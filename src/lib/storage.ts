/**
 * localStorage with a graceful in-memory fallback, namespaced per person.
 *
 * Private browsing, blocked cookies and a full quota all make localStorage throw.
 * When that happens the app keeps working for the session rather than crashing -
 * data just will not survive a refresh, which is why History offers an export.
 *
 * Every key is scoped to one person (`ironlog:<person>:<kind>`). Reads and writes
 * go through the active person, which the person route sets before any page renders,
 * so no page can accidentally read one person's log while showing another's name.
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

function rawGet(key: string): string | null {
  try {
    return localStorageWorks() ? window.localStorage.getItem(key) : (memory.get(key) ?? null)
  } catch {
    return null
  }
}

function rawSet(key: string, raw: string): void {
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

function rawRemove(key: string): void {
  if (localStorageWorks()) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Nothing to do - the read side treats it as absent either way.
    }
  }
  memory.delete(key)
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = rawGet(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  rawSet(key, JSON.stringify(value))
}

/** Distinguishes "never written" from "written as empty", which migration depends on. */
function hasKey(key: string): boolean {
  return rawGet(key) !== null
}

export type DataKind = 'workouts' | 'maxes'

/** Where one person's data of a given kind lives. */
export function storageKey(personId: string, kind: DataKind): string {
  return `ironlog:${personId}:${kind}`
}

let activePersonId: string | null = null

/** Set by the person route, before the pages beneath it read anything. */
export function setActivePerson(personId: string): void {
  activePersonId = personId
}

export function getActivePersonId(): string | null {
  return activePersonId
}

export function activeKey(kind: DataKind): string {
  if (!activePersonId) {
    // A page reached the log without a person in the URL - a routing bug. Failing
    // loudly beats quietly reading or, worse, writing into the wrong person's log.
    throw new Error(`IronLog: tried to reach "${kind}" with no person selected.`)
  }
  return storageKey(activePersonId, kind)
}

/** Keys used before the app knew about more than one person. */
const LEGACY_KEYS: Record<DataKind, string> = {
  workouts: 'ironlog:workouts',
  maxes: 'ironlog:maxes',
}

/**
 * Moves the original single-person log into that person's namespace.
 *
 * Runs once at boot. It only copies when the old key exists and the new one has
 * never been written, so someone who deliberately clears their log does not find
 * it restored on the next refresh. The original is dropped only after the copy
 * has been read back intact.
 */
export function migrateLegacyPerson(personId: string): void {
  for (const kind of ['workouts', 'maxes'] as const) {
    const from = LEGACY_KEYS[kind]
    const to = storageKey(personId, kind)
    const raw = rawGet(from)
    if (raw === null || hasKey(to)) continue
    rawSet(to, raw)
    if (rawGet(to) === raw) rawRemove(from)
  }
}
