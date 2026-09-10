import { Link } from 'react-router-dom'
import { ChevronRight, Dumbbell } from 'lucide-react'
import { PEOPLE, personPath, type Person } from '@/lib/people'
import { getWorkoutsFor } from '@/lib/workouts'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/Avatar'
import { StorageWarning } from '@/components/StorageWarning'
import { relativeDay } from '@/lib/utils'

/**
 * The front door: pick whose log to open.
 *
 * This sits outside the person routes, so it must never touch the active-person
 * storage helpers - it reads each person's sessions by id instead.
 */
export function People() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-10 lg:py-16">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-flame to-hot shadow-lg shadow-flame/30">
          <Dumbbell className="h-7 w-7 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-2xl font-black leading-none tracking-tight">IronLog</div>
          <div className="text-[11px] font-semibold text-chalk-faint">3-day full body · kilograms</div>
        </div>
      </div>

      <StorageWarning className="mb-6" />

      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
        Who&apos;s <span className="text-gradient-flame">lifting</span>?
      </h1>
      <p className="mt-1.5 text-sm text-chalk-muted">
        Everyone runs the same three days. The logs stay separate.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {PEOPLE.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}
      </div>

      <p className="mt-auto pt-10 text-[11px] leading-relaxed text-chalk-faint">
        Each person&apos;s workouts and tested maxes are stored separately in this browser, and never
        leave the device. Back them up from History, one person at a time.
      </p>
    </div>
  )
}

function PersonCard({ person }: { person: Person }) {
  const workouts = getWorkoutsFor(person.id)
  const last = workouts[0]

  return (
    <Link to={personPath(person.id)} className="group block rounded-3xl">
      <Card
        className={`flex items-center gap-4 p-5 transition-all group-hover:-translate-y-0.5 group-hover:ring-1 ${person.ring}`}
      >
        <Avatar person={person} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="truncate text-xl font-black tracking-tight">{person.name}</div>
          <div className="mt-0.5 text-xs font-semibold text-chalk-muted">
            {workouts.length
              ? `${workouts.length} session${workouts.length === 1 ? '' : 's'} logged`
              : 'No sessions yet'}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-chalk-faint">
            {last ? `Last trained ${relativeDay(last.date).toLowerCase()}` : 'Ready to start'}
          </div>
        </div>

        <ChevronRight
          className="h-5 w-5 shrink-0 text-chalk-faint transition-transform group-hover:translate-x-0.5 group-hover:text-chalk-muted"
          strokeWidth={2.5}
        />
      </Card>
    </Link>
  )
}
