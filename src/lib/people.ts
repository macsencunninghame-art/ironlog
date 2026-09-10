import { FULL_BODY_3, scaledFullBody3, type RoutineDay } from './routine'
import { getActivePersonId } from './storage'

/**
 * Who uses this app.
 *
 * Like the routines, the roster is hardcoded - there is no "add person" screen.
 * Each person gets their own log, their own routine and their own accent colour,
 * which the whole interface picks up while you are in their section.
 *
 * Everyone currently trains the same split, started from different loads. That is
 * a convenience, not an assumption: give anyone a hand-written routine here the
 * moment theirs should differ, and every screen follows.
 */

/** The colours the interface takes on inside one person's section. */
export interface PersonTheme {
  /** Primary accent: buttons, active tabs, links, chart lines. */
  accent: string
  accentSoft: string
  accentDeep: string
  /** The far end of every accent gradient. */
  accent2: string
  /** Text that sits on top of a solid accent fill. */
  fg: string
}

export interface Person {
  id: string
  name: string
  /** Two letters - the current names all start with M, so one initial would not tell them apart. */
  initials: string
  theme: PersonTheme
  /** The days this person trains. */
  routine: RoutineDay[]
}

export const PEOPLE: Person[] = [
  {
    id: 'macsy',
    name: 'Macsy',
    initials: 'Ma',
    theme: {
      accent: '#FF6B18',
      accentSoft: '#FF8A47',
      accentDeep: '#E04E00',
      accent2: '#FF2D8A',
      fg: '#FFFFFF',
    },
    routine: FULL_BODY_3,
  },
  {
    id: 'mitchy',
    name: 'Mitchy',
    initials: 'Mi',
    theme: {
      accent: '#C6FF3D',
      accentSoft: '#DBFF85',
      accentDeep: '#9BD400',
      accent2: '#34D399',
      // Lime is far too bright to carry white text.
      fg: '#070A12',
    },
    routine: scaledFullBody3(0.75),
  },
  {
    id: 'mezza',
    name: 'Mezza',
    initials: 'Me',
    theme: {
      accent: '#FF4FA3',
      accentSoft: '#FF85C0',
      accentDeep: '#DB2777',
      accent2: '#C026D3',
      fg: '#FFFFFF',
    },
    routine: scaledFullBody3(0.55),
  },
  {
    id: 'mcginley',
    name: 'McGinley',
    initials: 'Mc',
    theme: {
      // Violet into blue: the one direction none of the other three occupy, and
      // dark enough at both ends of the gradient to carry white text.
      accent: '#8B5CF6',
      accentSoft: '#A78BFA',
      accentDeep: '#6D28D9',
      accent2: '#3B82F6',
      fg: '#FFFFFF',
    },
    // Placeholder starting loads - nothing is known about his numbers yet.
    routine: scaledFullBody3(0.85),
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

/** `#FF6B18` -> `255 107 24`, the space-separated form Tailwind's opacity modifiers need. */
export function rgbTriplet(hex: string): string {
  const clean = hex.replace('#', '')
  const n = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16,
  )
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/** The CSS custom properties that repaint the interface in someone's colours. */
export function themeVars(theme: PersonTheme): Record<string, string> {
  return {
    '--accent': rgbTriplet(theme.accent),
    '--accent-soft': rgbTriplet(theme.accentSoft),
    '--accent-deep': rgbTriplet(theme.accentDeep),
    '--accent-2': rgbTriplet(theme.accent2),
    '--accent-fg': rgbTriplet(theme.fg),
  }
}

/** Absolute path into a person's section of the app, e.g. personPath('macsy', '/log'). */
export function personPath(personId: string, sub = ''): string {
  return `/p/${personId}${sub}`
}
