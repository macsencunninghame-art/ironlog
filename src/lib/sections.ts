import { Bike, Dumbbell, Footprints, LayoutGrid, Zap, type LucideIcon } from 'lucide-react'

/**
 * The tabs in a person's section of the app.
 *
 * Not everyone trains the same way, so the bar is built from the sections that
 * person actually uses rather than showing every discipline to everybody. The
 * roster in `people.ts` decides; this file only says what each section contains.
 *
 * Paths are relative to the person; `personPath` turns them absolute.
 */

export interface SectionPage {
  sub: string
  label: string
}

export interface Section {
  id: string
  label: string
  icon: LucideIcon
  /** Where the tab itself goes. */
  landing: string
  end?: boolean
  /** Pills shown under the header. Empty when a section is a single page. */
  pages: SectionPage[]
}

export const SECTIONS: Record<string, Section> = {
  home: {
    id: 'home',
    label: 'Home',
    icon: LayoutGrid,
    landing: '',
    end: true,
    pages: [],
  },
  gym: {
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
  running: {
    id: 'running',
    label: 'Running',
    icon: Footprints,
    landing: '/running',
    // Bronco, Runs and Compare are switched within the page itself.
    pages: [],
  },
  hyrox: {
    id: 'hyrox',
    label: 'Hyrox',
    icon: Zap,
    landing: '/hyrox',
    pages: [],
  },
  tri: {
    id: 'tri',
    label: 'Tri',
    icon: Bike,
    landing: '/tri',
    pages: [],
  },
}

/** The sections this person uses, in the order they appear in the bar. */
export function sectionsFor(ids: string[]): Section[] {
  return ids.map((id) => SECTIONS[id]).filter((s): s is Section => Boolean(s))
}

/**
 * Which of a person's sections a path belongs to.
 *
 * Undefined when the path is not one of theirs - a section someone else uses is
 * still reachable by URL, it simply does not light up a tab they do not have.
 */
export function sectionForPath(
  personId: string,
  pathname: string,
  sections: Section[],
): Section | undefined {
  const base = `/p/${personId}`
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : ''

  return sections.find(
    (section) => section.landing === rest || section.pages.some((page) => page.sub === rest),
  )
}
