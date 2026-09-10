import type { DayId } from '@/types'
import { uid } from './utils'

/**
 * Session photos.
 *
 * These live in IndexedDB rather than alongside the log in localStorage: even one
 * compressed photo is bigger than an entire training history, and a handful would
 * blow the ~5 MB localStorage quota and take the workouts down with them.
 *
 * Photos are stored as Blobs, resized on the way in. They never leave the device,
 * and - unlike workouts and maxes - they are NOT part of the JSON backup, which
 * would balloon it. Save anything you cannot lose from the gallery.
 */

const DB_NAME = 'ironlog-photos'
const DB_VERSION = 1
const STORE = 'photos'

/** Long edge, in pixels. Enough to look sharp on a phone without storing 4 MB a shot. */
const MAX_EDGE = 1280
const QUALITY = 0.75

export interface Photo {
  id: string
  personId: string
  /** The session this was taken at, when it was added while logging one. */
  workoutId: string | null
  dayId: DayId | null
  /** ISO timestamp. */
  date: string
  blob: Blob
}

/** Falls back to memory when IndexedDB is unavailable, mirroring the storage layer. */
const memory = new Map<string, Photo>()
let dbFailed = false

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('personId', 'personId', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = run(tx.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
    tx.oncomplete = () => db.close()
  })
}

/** True when photos are only being held for this session and will not survive a refresh. */
export function photosAreEphemeral(): boolean {
  return dbFailed
}

/**
 * Shrink and re-encode before storing.
 *
 * A modern phone photo is 3-6 MB; at 1280px and JPEG 0.75 the same shot lands
 * around 150-300 KB, which keeps a few hundred of them comfortably in the browser.
 */
export async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  )
  // If the browser will not encode, keeping the original beats losing the photo.
  return blob ?? file
}

export async function addPhoto(
  personId: string,
  file: File,
  meta: { workoutId?: string | null; dayId?: DayId | null; date?: string } = {},
): Promise<Photo> {
  let blob: Blob = file
  try {
    blob = await compress(file)
  } catch {
    // Decoding can fail on an odd format or a corrupt file. Storing the original
    // costs space but keeps the photo, and never fails the surrounding save.
  }

  const photo: Photo = {
    id: uid(),
    personId,
    workoutId: meta.workoutId ?? null,
    dayId: meta.dayId ?? null,
    date: meta.date ?? new Date().toISOString(),
    blob,
  }

  try {
    await withStore('readwrite', (store) => store.put(photo) as IDBRequest<IDBValidKey>)
  } catch {
    dbFailed = true
    memory.set(photo.id, photo)
  }
  return photo
}

/** One person's photos, newest first. */
export async function listPhotos(personId: string): Promise<Photo[]> {
  let rows: Photo[]
  try {
    rows = await withStore('readonly', (store) => store.getAll() as IDBRequest<Photo[]>)
  } catch {
    dbFailed = true
    rows = [...memory.values()]
  }
  return rows
    .filter((p) => p.personId === personId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Everyone's most recent photo, keyed by person.
 *
 * One pass over the store rather than a listPhotos() call per person, since the
 * picker needs all of them at once.
 */
export async function latestPhotoByPerson(): Promise<Map<string, Photo>> {
  let rows: Photo[]
  try {
    rows = await withStore('readonly', (store) => store.getAll() as IDBRequest<Photo[]>)
  } catch {
    dbFailed = true
    rows = [...memory.values()]
  }

  const latest = new Map<string, Photo>()
  for (const photo of rows) {
    const held = latest.get(photo.personId)
    if (!held || new Date(photo.date).getTime() > new Date(held.date).getTime()) {
      latest.set(photo.personId, photo)
    }
  }
  return latest
}

export async function deletePhoto(id: string): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(id) as IDBRequest<undefined>)
  } catch {
    dbFailed = true
  }
  memory.delete(id)
}

/** How much room the photos take, for the note in the gallery. */
export function totalBytes(photos: Photo[]): number {
  return photos.reduce((n, p) => n + p.blob.size, 0)
}

export function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}
