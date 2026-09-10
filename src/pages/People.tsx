import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { PEOPLE, personPath, type Person } from '@/lib/people'
import { getWorkoutsFor } from '@/lib/workouts'
import { Card } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Segmented'
import { Avatar } from '@/components/Avatar'
import { StorageWarning } from '@/components/StorageWarning'
import { CompareChart } from '@/components/CompareChart'
import { LatestPhotos } from '@/components/LatestPhotos'
import { relativeDay } from '@/lib/utils'

type Tab = 'train' | 'photos' | 'progress'

const HEADINGS: Record<Tab, { title: string; accentWord: string; subtitle: string }> = {
  train: {
    title: "Who's",
    accentWord: 'lifting',
    subtitle: 'Own routine, own log, own numbers.',
  },
  photos: {
    title: 'Latest',
    accentWord: 'photos',
    subtitle: 'The most recent shot from everyone. Tap a camera to add one.',
  },
  progress: {
    title: "Who's",
    accentWord: 'improving',
    subtitle: 'Measured against each person’s own starting numbers.',
  },
}

/**
 * The front door.
 *
 * Split into three tabs rather than one long scroll: picking a person, the
 * photos, and the comparison are three different reasons to open the app, and
 * stacking them meant scrolling past two to reach the third. Each tab is sized
 * to be taken in at a glance on a phone.
 *
 * This page sits outside the person routes, so it must never touch the
 * active-person storage helpers - it reads each person's data by id instead.
 */
export function People() {
  const [tab, setTab] = useState<Tab>('train')
  const heading = HEADINGS[tab]

  return (
    <div className="app-glow min-h-full">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-8 lg:py-12">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2 shadow-lg shadow-accent/30">
            <Dumbbell className="h-6 w-6 text-accent-fg" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xl font-black leading-none tracking-tight">IronLog</div>
            <div className="text-[11px] font-semibold text-chalk-faint">
              Training logs · kilograms
            </div>
          </div>
        </div>

        <StorageWarning className="mb-5" />

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          {heading.title} <span className="text-gradient-accent">{heading.accentWord}</span>
          {tab === 'train' ? '?' : ''}
        </h1>
        <p className="mt-1.5 text-sm text-chalk-muted">{heading.subtitle}</p>

        <Segmented
          className="mt-5"
          options={[
            { value: 'train', label: 'Train' },
            { value: 'photos', label: 'Photos' },
            { value: 'progress', label: 'Progress' },
          ]}
          value={tab}
          onChange={setTab}
        />

        <div className="mt-5">
          {tab === 'train' && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PEOPLE.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          )}
          {tab === 'photos' && <LatestPhotos bare />}
          {tab === 'progress' && <CompareChart bare />}
        </div>

        <p className="mt-auto pt-10 text-[11px] leading-relaxed text-chalk-faint">
          Every person&apos;s log, photos and tested maxes are stored separately in this browser,
          and never leave the device. Back them up from History, one person at a time.
        </p>
      </div>
    </div>
  )
}

function PersonCard({ person }: { person: Person }) {
  const workouts = getWorkoutsFor(person.id)
  const last = workouts[0]

  return (
    <Link to={personPath(person.id)} className="group block rounded-3xl">
      <Card
        className="flex h-full flex-col items-center gap-3 p-4 text-center transition-all group-hover:-translate-y-0.5 group-hover:ring-1"
        style={{ ['--tw-ring-color' as string]: `${person.theme.accent}66` }}
      >
        <Avatar person={person} size="md" className="h-14 w-14 text-base" />
        <div className="min-w-0">
          <div className="truncate text-sm font-black tracking-tight">{person.name}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-chalk-muted">
            {workouts.length
              ? `${workouts.length} session${workouts.length === 1 ? '' : 's'}`
              : 'No sessions'}
          </div>
          <div className="mt-0.5 truncate text-[10px] font-semibold text-chalk-faint">
            {last ? relativeDay(last.date) : person.routine.length ? 'Ready to start' : 'No routine'}
          </div>
        </div>
      </Card>
    </Link>
  )
}
