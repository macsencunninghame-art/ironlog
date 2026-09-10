import { Dumbbell, Footprints, LayoutGrid, type LucideIcon } from 'lucide-react'

/**
 * How a person's section of the app is grouped.
 *
 * Everything used to sit in one row of tabs, which reached seven and stopped
 * being scannable. Training splits in two — what you do in the gym, and
 * everything conditioning — so the bar carries three, and each group gets its
 * own row of pills once you are inside it.
 *
 * Paths are relative to the person; `personPath` turns them absolute.
 */

export interface SectionPage {
  sub: string
  label: string
  /** Marks a page that exists only to say it has not been built yet. */
  placeholder?: boolean
}

export interface Section {
  id: string
  label: string
  icon: LucideIcon
  /** Where the tab itself goes. */
  landing: string
  end?: boolean
  pages: SectionPage[]
}

export const SECTIONS: Section[] = [
  {
    id: 'home',
    label: 'Home',
    icon: LayoutGrid,
    landing: '',
    end: true,
    pages: [],
  },
  {
    id: 'gym',
    label: 'Gym',
    icon: Dumbbell,
    landing: '/log',
    pages: [
      { sub: '/log', label: 'Log' },
      { sub: '/routines', label: 'Routine' },
      { sub: '/progress', label: 'Progress' },
      { sub: '/maxes', label: 'Maxes' },
      { sub: '/history', label: 'History' },
    ],
  },
  {
    id: 'training',
    label: 'Training',
    icon: Footprints,
    landing: '/running',
    pages: [
      { sub: '/running', label: 'Running' },
      { sub: '/hyrox', label: 'Hyrox', placeholder: true },
      { sub: '/tri', label: 'Tri', placeholder: true },
    ],
  },
]

/** Which section a path inside a person's area belongs to. */
export function sectionForPath(personId: string, pathname: string): Section {
  const base = `/p/${personId}`
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : ''
  const match = SECTIONS.find((s) => s.pages.some((p) => p.sub === rest))
  return match ?? SECTIONS[0]
}
