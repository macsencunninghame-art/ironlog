import type { IronLogBackup, MaxEntry, Workout } from '@/types'
import { readJSON, STORAGE_KEYS, writeJSON } from './storage'
import { readMaxes, writeMaxes } from './maxes'

/**
 * Every logged session, newest first.
 * There are no seeded baseline entries - the log starts empty and fills up
 * from the first real workout, so every number on screen was actually lifted.
 */
export function getWorkouts(): Workout[] {
  const stored = readJSON<Workout[]>(STORAGE_KEYS.workouts, [])
  if (!Array.isArray(stored)) return []
  return [...stored].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/** Oldest first - what the charts want. */
export function getWorkoutsChronological(): Workout[] {
  return getWorkouts().reverse()
}

export function saveWorkout(workout: Workout): void {
  const all = readJSON<Workout[]>(STORAGE_KEYS.workouts, [])
  const next = Array.isArray(all) ? [...all] : []
  const existing = next.findIndex((w) => w.id === workout.id)
  if (existing >= 0) next[existing] = workout
  else next.push(workout)
  writeJSON(STORAGE_KEYS.workouts, next)
}

export function deleteWorkout(id: string): void {
  const all = readJSON<Workout[]>(STORAGE_KEYS.workouts, [])
  if (!Array.isArray(all)) return
  writeJSON(
    STORAGE_KEYS.workouts,
    all.filter((w) => w.id !== id),
  )
}

export function buildBackup(): IronLogBackup {
  return {
    app: 'ironlog',
    version: 1,
    exportedAt: new Date().toISOString(),
    workouts: getWorkouts(),
    maxes: readMaxes(),
  }
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `ironlog-backup-${stamp}.json`
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

/** Replaces everything with the contents of a backup file. */
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

  writeJSON(STORAGE_KEYS.workouts, workouts)
  writeMaxes(maxes)

  return {
    ok: true,
    message: `Restored ${workouts.length} workout${workouts.length === 1 ? '' : 's'} and ${maxes.length} max${maxes.length === 1 ? '' : 'es'}.`,
    workouts: workouts.length,
    maxes: maxes.length,
  }
}
