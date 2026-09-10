/**
 * Who uses this app.
 *
 * Like the routine, the roster is hardcoded - there is no "add person" screen.
 * Everyone here shares the same three-day split; what is separate is their log.
 * Each person's workouts and tested maxes live under their own storage keys, so
 * nothing one person logs can show up in the other's charts, PRs or streak.
 *
 * To add someone, add an entry below and pick an unused accent.
 */

export interface Person {
  id: string
  name: string
  /** Two letters - both current names start with M, so one initial would not tell them apart. */
  initials: string
  /** Avatar disc gradient. */
  gradient: string
  /** Text colour that reads against that gradient. */
  fg: string
  /** Accent used for the ring and glow on their picker card. */
  ring: string
  glow: string
}

export const PEOPLE: Person[] = [
  {
    id: 'macsy',
    name: 'Macsy',
    initials: 'Ma',
    gradient: 'from-flame to-hot',
    fg: 'text-white',
    ring: 'ring-flame/40',
    glow: 'shadow-flame/30',
  },
  {
    id: 'mitchy',
    name: 'Mitchy',
    initials: 'Mi',
    gradient: 'from-volt-deep to-volt',
    fg: 'text-ink-950',
    ring: 'ring-volt/40',
    glow: 'shadow-volt/25',
  },
]

/**
 * The log written before the app knew about more than one person.
 * Its data is migrated into this person's namespace on first boot.
 */
export const ORIGINAL_PERSON_ID = 'macsy'

export function findPerson(id: string | undefined | null): Person | undefined {
  if (!id) return undefined
  return PEOPLE.find((p) => p.id === id)
}

/** Absolute path into a person's section of the app, e.g. personPath('macsy', '/log'). */
export function personPath(personId: string, sub = ''): string {
  return `/p/${personId}${sub}`
}
