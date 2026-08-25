/**
 * localStorage with a graceful in-memory fallback.
 *
 * Private browsing, blocked cookies and a full quota all make localStorage throw.
 * When that happens the app keeps working for the session rather than crashing -
 * data just will not survive a refresh, which is why History offers an export.
 */

const memory = new Map<string, string>()
let usable: boolean | null = null

function localStorageWorks(): boolean {
  if (usable !== null) return usable
  try {
    const probe = '__ironlog_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    usable = true
  } catch {
    usable = false
  }
  return usable
}

/** True when writes are only being held in memory for this session. */
export function isEphemeral(): boolean {
  return !localStorageWorks()
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorageWorks() ? window.localStorage.getItem(key) : (memory.get(key) ?? null)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  const raw = JSON.stringify(value)
  if (localStorageWorks()) {
    try {
      window.localStorage.setItem(key, raw)
      return
    } catch {
      // Quota blew up mid-session - fall through to memory so the save is not lost.
      usable = false
    }
  }
  memory.set(key, raw)
}

export const STORAGE_KEYS = {
  workouts: 'ironlog:workouts',
  maxes: 'ironlog:maxes',
} as const
