import type { BroncoEntry, IronLogBackup, MaxEntry, RunEntry, Workout } from '@/types'
import { activeKey, getActivePersonId, readJSON, storageKey, writeJSON } from './storage'
import { readMaxes, writeMaxes } from './maxes'
import { findPerson } from './people'
import { getBroncos, getRuns } from './running'

/**
 * Every logged session, newest first.
 * There are no seeded baseline entries - the log starts empty and fills up
 * from the first real workout, so every number on screen was actually lifted.
 */
export function getWorkouts(): Workout[] {
  return sortedFrom(activeKey('workouts'))
}

/**
 * Another person's log, without making them the active one.
 * The picker needs a session count per person before anyone has been chosen.
 */
export function getWorkoutsFor(personId: string): Workout[] {
  return sortedFrom(storageKey(personId, 'workouts'))
}

function sortedFrom(key: string): Workout[] {
  const stored = readJSON<Workout[]>(key, [])
  if (!Array.isArray(stored)) return []
  return [...stored].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/** Oldest first - what the charts want. */
export function getWorkoutsChronological(): Workout[] {
  return getWorkouts().reverse()
}

export function saveWorkout(workout: Workout): void {
  const all = readJSON<Workout[]>(activeKey('workouts'), [])
  const next = Array.isArray(all) ? [...all] : []
  const existing = next.findIndex((w) => w.id === workout.id)
  if (existing >= 0) next[existing] = workout
  else next.push(workout)
  writeJSON(activeKey('workouts'), next)
}

/**
 * Deliberately not wired to any button.
 *
 * Nothing can be deleted from inside the app: a mis-tap should never be able to
 * cost someone months of training. This stays exported as the code-level escape
 * hatch - callable from the browser console, or from a one-off script - for the
 * rare entry that genuinely has to go.
 *
 * The route that needs no console at all is Export from History, editing the
 * JSON by hand, and Importing it back.
 */
export function deleteWorkout(id: string): void {
  const all = readJSON<Workout[]>(activeKey('workouts'), [])
  if (!Array.isArray(all)) return
  writeJSON(
    activeKey('workouts'),
    all.filter((w) => w.id !== id),
  )
}

/** Who the active log belongs to, for stamping and naming exports. */
function activePerson() {
  return findPerson(getActivePersonId())
}

export function buildBackup(): IronLogBackup {
  return {
    app: 'ironlog',
    version: 1,
    exportedAt: new Date().toISOString(),
    // Stamped so a file found months later says whose training it is.
    person: activePerson()?.name,
    workouts: getWorkouts(),
    maxes: readMaxes(),
    broncos: getBroncos(),
    runs: getRuns(),
  }
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  const who = activePerson()?.id
  a.href = url
  a.download = who ? `ironlog-${who}-backup-${stamp}.json` : `ironlog-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface ImportResult {
  ok: boolean
  message: string
  workouts?: number
  maxes?: number
}

/** Replaces the active person's log with the contents of a backup file. */
export function restoreBackup(raw: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, message: 'That file is not valid JSON.' }
  }

  const data = parsed as Partial<IronLogBackup>
  if (!data || data.app !== 'ironlog' || !Array.isArray(data.workouts)) {
    return { ok: false, message: 'That does not look like an IronLog backup.' }
  }

  const workouts = data.workouts.filter(
    (w): w is Workout =>
      !!w && typeof w.id === 'string' && typeof w.date === 'string' && Array.isArray(w.exercises),
  )
  const maxes = Array.isArray(data.maxes)
    ? data.maxes.filter(
        (m): m is MaxEntry =>
          !!m && typeof m.id === 'string' && typeof m.liftId === 'string' && typeof m.weight === 'number',
      )
    : []

  const broncos = Array.isArray(data.broncos)
    ? data.broncos.filter(
        (b): b is BroncoEntry =>
          !!b && typeof b.id === 'string' && typeof b.seconds === 'number' && typeof b.date === 'string',
      )
    : []
  const runs = Array.isArray(data.runs)
    ? data.runs.filter(
        (r): r is RunEntry =>
          !!r &&
          typeof r.id === 'string' &&
          typeof r.distanceKm === 'number' &&
          typeof r.seconds === 'number' &&
          typeof r.date === 'string',
      )
    : []

  writeJSON(activeKey('workouts'), workouts)
  writeMaxes(maxes)
  writeJSON(activeKey('broncos'), broncos)
  writeJSON(activeKey('runs'), runs)

  const into = activePerson()?.name
  // A file exported by someone else overwrites whoever is logged in now, so say so.
  const crossed =
    data.person && into && data.person !== into ? ` That file was exported by ${data.person}.` : ''

  return {
    ok: true,
    message:
      `Restored ${workouts.length} workout${workouts.length === 1 ? '' : 's'}, ` +
      `${maxes.length} max${maxes.length === 1 ? '' : 'es'} and ` +
      `${broncos.length + runs.length} running entr${broncos.length + runs.length === 1 ? 'y' : 'ies'}` +
      `${into ? ` into ${into}` : ''}.${crossed}`,
    workouts: workouts.length,
    maxes: maxes.length,
  }
}
