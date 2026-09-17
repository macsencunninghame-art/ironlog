import { FULL_BODY_3, MITCHY_FULL_BODY, scaledFullBody3, type RoutineDay } from './routine'
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
  /**
   * The tabs in their section of the app, in order, from the registry in
   * `sections.ts`. Not everyone trains the same way, so nobody is shown a
   * discipline they do not do.
   */
  sections: string[]
}

export const PEOPLE: Person[] = [
  {
    id: 'macsy',
    name: 'Macsy',
    initials: 'Ma',
    theme: {
      // Orange into pink, dark enough to carry white text on a fill.
      accent: '#D14900',
      accentSoft: '#FF7A2E',
      accentDeep: '#A83700',
      accent2: '#E5157F',
      fg: '#FFFFFF',
    },
    routine: FULL_BODY_3,
    sections: ['home', 'gym', 'hyrox', 'tri'],
  },
  {
    id: 'mitchy',
    name: 'Mitchy',
    initials: 'Mi',
    theme: {
      // Was lime, which is invisible on white. Green into teal keeps the
      // family and reads at any size.
      accent: '#3E8F00',
      accentSoft: '#5FB815',
      accentDeep: '#2C6600',
      accent2: '#00A06B',
      fg: '#FFFFFF',
    },
    routine: MITCHY_FULL_BODY,
    sections: ['home', 'gym', 'running'],
  },
  {
    id: 'mezza',
    name: 'Mezza',
    initials: 'Me',
    theme: {
      // Pink into fuchsia.
      accent: '#D6197A',
      accentSoft: '#FF5CAE',
      accentDeep: '#A00E5A',
      accent2: '#A81CC4',
      fg: '#FFFFFF',
    },
    routine: scaledFullBody3(0.55),
    sections: ['home', 'gym', 'hyrox', 'running'],
  },
  {
    id: 'mcginley',
    name: 'McGinley',
    initials: 'Mc',
    theme: {
      // Violet into blue - the one direction the other three do not occupy.
      accent: '#6A3FE0',
      accentSoft: '#8F6BFF',
      accentDeep: '#4E29B5',
      accent2: '#2563EB',
      fg: '#FFFFFF',
    },
    // Placeholder starting loads - nothing is known about his numbers yet.
    routine: scaledFullBody3(0.85),
    sections: ['home', 'gym', 'tri'],
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
    // d3 wants a colour string rather than a triplet.
    '--accent-hex': theme.accent,
    '--accent2-hex': theme.accent2,
  }
}

/** Absolute path into a person's section of the app, e.g. personPath('macsy', '/log'). */
export function personPath(personId: string, sub = ''): string {
  return `/p/${personId}${sub}`
}
