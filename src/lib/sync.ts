import type { BroncoEntry, MaxEntry, RunEntry, Workout } from '@/types'
import { PEOPLE } from './people'
import { readJSON, storageKey, writeJSON, type DataKind } from './storage'
import { getSupabase, isShared, PHOTO_BUCKET } from './supabase'
import { allLocalPhotos, putLocalPhoto, PHOTO_WRITTEN, type Photo } from './photos'

/**
 * Keeping four phones in agreement.
 *
 * The whole design rests on one property: nothing in this app can be edited or
 * deleted any more, so the data is append-only. Two devices that have diverged
 * have not disagreed about anything - they have each seen entries the other has
 * not. Merging is therefore a union by id, with no conflict to resolve, no
 * last-write-wins, and no way for a sync to lose something.
 *
 * That is also why the pages did not have to change. The device keeps its own
 * full copy in localStorage and every existing read stays synchronous and
 * instant; sync only widens that copy in the background. Offline still works,
 * and a session logged on a train uploads itself when the signal returns.
 */

interface Adapter<T extends { id: string }> {
  kind: DataKind
  table: string
  toRow: (personId: string, item: T) => Record<string, unknown>
  fromRow: (row: Record<string, unknown>) => T
}

const WORKOUTS: Adapter<Workout> = {
  kind: 'workouts',
  table: 'workouts',
  toRow: (person_id, w) => ({
    id: w.id,
    person_id,
    day_id: w.dayId,
    date: w.date,
    exercises: w.exercises,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    dayId: Number(r.day_id),
    date: new Date(r.date as string).toISOString(),
    exercises: (r.exercises ?? []) as Workout['exercises'],
  }),
}

const MAXES: Adapter<MaxEntry> = {
  kind: 'maxes',
  table: 'maxes',
  toRow: (person_id, m) => ({
    id: m.id,
    person_id,
    lift_id: m.liftId,
    weight: m.weight,
    date: m.date,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    liftId: r.lift_id as string,
    weight: Number(r.weight),
    date: new Date(r.date as string).toISOString(),
  }),
}

const BRONCOS: Adapter<BroncoEntry> = {
  kind: 'broncos',
  table: 'broncos',
  toRow: (person_id, b) => ({
    id: b.id,
    person_id,
    date: b.date,
    seconds: b.seconds,
    note: b.note ?? null,
  }),
  fromRow: (r) => ({
    id: r.id as string,
    date: new Date(r.date as string).toISOString(),
    seconds: Number(r.seconds),
    note: (r.note as string | null) ?? undefined,
  }),
}

const RUNS: Adapter<RunEntry> = {
  kind: 'runs',
  table: 'runs',
  toRow: (person_id, r) => ({
    id: r.id,
    person_id,
    date: r.date,
    distance_km: r.distanceKm,
    seconds: r.seconds,
    note: r.note ?? null,
    source: r.source ?? 'manual',
  }),
  fromRow: (r) => ({
    id: r.id as string,
    date: new Date(r.date as string).toISOString(),
    distanceKm: Number(r.distance_km),
    seconds: Number(r.seconds),
    note: (r.note as string | null) ?? undefined,
    source: ((r.source as string) ?? 'manual') as RunEntry['source'],
  }),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ADAPTERS: Adapter<any>[] = [WORKOUTS, MAXES, BRONCOS, RUNS]

export interface SyncResult {
  ok: boolean
  /** Rows this device did not have before. */
  pulled: number
  /** Rows only this device had, now uploaded. */
  pushed: number
  error?: string
}

let running: Promise<SyncResult> | null = null
let lastResult: SyncResult | null = null

export function lastSync(): SyncResult | null {
  return lastResult
}

/**
 * Pull everything, merge it in, then upload whatever only this device had.
 *
 * Concurrent calls share one run rather than racing each other - two tabs, or a
 * focus event landing on top of the boot sync, would otherwise both push.
 */
export function syncNow(): Promise<SyncResult> {
  if (!isShared) {
    return Promise.resolve({ ok: false, pulled: 0, pushed: 0, error: 'No shared database configured.' })
  }
  if (running) return running

  running = run().finally(() => {
    running = null
  })
  return running
}

async function run(): Promise<SyncResult> {
  let pulled = 0
  let pushed = 0

  try {
    const supabase = await getSupabase()
    if (!supabase) throw new Error('The database client could not be loaded.')

    for (const adapter of ADAPTERS) {
      const { data, error } = await supabase.from(adapter.table).select('*')
      if (error) throw new Error(`${adapter.table}: ${error.message}`)

      // Remote rows, grouped by the person they belong to.
      const remote = new Map<string, Map<string, unknown>>()
      for (const row of (data ?? []) as Record<string, unknown>[]) {
        const personId = row.person_id as string
        if (!remote.has(personId)) remote.set(personId, new Map())
        remote.get(personId)!.set(row.id as string, adapter.fromRow(row))
      }

      const toUpload: Record<string, unknown>[] = []

      for (const person of PEOPLE) {
        const key = storageKey(person.id, adapter.kind)
        const local = readJSON<{ id: string }[]>(key, [])
        const localList = Array.isArray(local) ? local : []
        const localIds = new Set(localList.map((item) => item.id))
        const remoteForPerson = remote.get(person.id) ?? new Map()

        // Union by id. An id present on both sides is the same entry, because
        // nothing can be edited after it is written.
        const merged = [...localList]
        for (const [id, item] of remoteForPerson) {
          if (!localIds.has(id)) {
            merged.push(item as { id: string })
            pulled += 1
          }
        }
        if (merged.length !== localList.length) writeJSON(key, merged)

        for (const item of localList) {
          if (!remoteForPerson.has(item.id)) toUpload.push(adapter.toRow(person.id, item))
        }
      }

      if (toUpload.length) {
        const { error: upsertError } = await supabase!
          .from(adapter.table)
          .upsert(toUpload, { onConflict: 'id' })
        if (upsertError) throw new Error(`${adapter.table}: ${upsertError.message}`)
        pushed += toUpload.length
      }
    }

    const photos = await syncPhotos()
    pulled += photos.pulled
    pushed += photos.pushed

    lastResult = { ok: true, pulled, pushed }
  } catch (err) {
    lastResult = {
      ok: false,
      pulled,
      pushed,
      error: err instanceof Error ? err.message : 'Sync failed.',
    }
  }

  return lastResult
}

/**
 * Photos, which are blobs rather than JSON and so need their own path.
 *
 * The image goes to Storage and a row describing it goes to the table; the row
 * is written second, so a half-finished upload leaves an orphaned file rather
 * than a row pointing at an image that is not there. Downloads run one at a
 * time: a phone catching up on a month of everyone's photos should trickle in
 * the background, not saturate the connection.
 */
async function syncPhotos(): Promise<{ pulled: number; pushed: number }> {
  const supabase = await getSupabase()
  if (!supabase) return { pulled: 0, pushed: 0 }

  const { data, error } = await supabase.from('photos').select('*')
  if (error) throw new Error(`photos: ${error.message}`)

  const local = await allLocalPhotos()
  const localIds = new Set(local.map((p) => p.id))
  const remoteRows = (data ?? []) as Record<string, unknown>[]
  const remoteIds = new Set(remoteRows.map((r) => r.id as string))

  let pulled = 0
  let pushed = 0

  for (const row of remoteRows) {
    const id = row.id as string
    if (localIds.has(id)) continue

    const { data: blob, error: downloadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .download(row.path as string)
    // One unreadable photo should not stop the rest of the sync.
    if (downloadError || !blob) continue

    const photo: Photo = {
      id,
      personId: row.person_id as string,
      workoutId: (row.workout_id as string | null) ?? null,
      dayId: row.day_id === null || row.day_id === undefined ? null : Number(row.day_id),
      date: new Date(row.date as string).toISOString(),
      blob,
    }
    await putLocalPhoto(photo)
    pulled += 1
  }

  for (const photo of local) {
    if (remoteIds.has(photo.id)) continue

    const path = `${photo.personId}/${photo.id}.jpg`
    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, photo.blob, { contentType: photo.blob.type || 'image/jpeg', upsert: true })
    if (uploadError) continue

    const { error: rowError } = await supabase.from('photos').upsert(
      {
        id: photo.id,
        person_id: photo.personId,
        workout_id: photo.workoutId,
        day_id: photo.dayId,
        date: photo.date,
        path,
      },
      { onConflict: 'id' },
    )
    if (!rowError) pushed += 1
  }

  return { pulled, pushed }
}

let soon: ReturnType<typeof setTimeout> | null = null

/**
 * Upload shortly after a write, without blocking the save.
 *
 * Debounced, because logging a session writes once but adding three photos to it
 * writes three more times, and one upload covers the lot.
 */
export function syncSoon(): void {
  if (!isShared) return
  if (soon) clearTimeout(soon)
  soon = setTimeout(() => {
    soon = null
    void syncNow()
  }, 1500)
}

/**
 * Sync at boot and whenever the app is brought back to the front.
 *
 * Pages re-read their data when they mount, so a background pull is picked up by
 * the next navigation on its own. Nothing is force-refreshed under the user -
 * having a half-typed session vanish because a sync landed would be worse than
 * seeing yesterday's numbers for one more screen.
 */
export function startSync(): void {
  if (!isShared) return

  void syncNow()

  window.addEventListener('focus', () => void syncNow())
  window.addEventListener('online', () => void syncNow())
  window.addEventListener(PHOTO_WRITTEN, () => syncSoon())
}
