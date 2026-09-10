import { FULL_BODY_3, type RoutineDay } from './routine'
import { getActivePersonId } from './storage'

/**
 * Who uses this app.
 *
 * Like the routines, the roster is hardcoded - there is no "add person" screen.
 * Each person gets their own log AND their own routine: their workouts, tested
 * maxes, PRs, streak and charts are entirely their own, and so are the days they
 * train. A person whose routine has not been written yet has no days, and the
 * app says so rather than showing them someone else's split.
 *
 * To add someone, add an entry below with an unused accent and either an existing
 * routine or a new one from `routine.ts`.
 */

export interface Person {
  id: string
  name: string
  /** Two letters - the current names all start with M, so one initial would not tell them apart. */
  initials: string
  /** Avatar disc gradient. */
  gradient: string
  /** Text colour that reads against that gradient. */
  fg: string
  /** Accent used for the ring and glow on their picker card. */
  ring: string
  glow: string
  /** The days this person trains. Empty until their routine is written. */
  routine: RoutineDay[]
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
    routine: FULL_BODY_3,
  },
  {
    id: 'mitchy',
    name: 'Mitchy',
    initials: 'Mi',
    gradient: 'from-volt-deep to-volt',
    fg: 'text-ink-950',
    ring: 'ring-volt/40',
    glow: 'shadow-volt/25',
    routine: [],
  },
  {
    id: 'mezza',
    name: 'Mezza',
    initials: 'Me',
    gradient: 'from-fuchsia-500 to-pink-400',
    fg: 'text-white',
    ring: 'ring-pink-400/40',
    glow: 'shadow-pink-500/30',
    routine: [],
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

/**
 * The routine belonging to whoever the app is currently showing.
 *
 * Pages take the routine from `usePerson()` instead; this exists for the stats
 * layer, whose functions are called from all over and would otherwise have to
 * thread a routine through every signature. Empty when nobody is selected, which
 * only happens outside a person route.
 */
export function activeRoutine(): RoutineDay[] {
  return findPerson(getActivePersonId())?.routine ?? []
}

/** Absolute path into a person's section of the app, e.g. personPath('macsy', '/log'). */
export function personPath(personId: string, sub = ''): string {
  return `/p/${personId}${sub}`
}
