import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, Dumbbell, Flame, Play, Trophy, TrendingUp } from 'lucide-react'
import { EXERCISE_NAMES, getDay } from '@/lib/routine'
import {
  currentStreak,
  daysDoneThisWeek,
  exerciseSeries,
  suggestNextDay,
  totalPRCount,
  volumeThisWeek,
  workoutVolume,
  workoutsThisWeek,
} from '@/lib/stats'
import { getWorkouts } from '@/lib/workouts'
import { usePerson } from '@/components/PersonScope'
import { fmtKg, fmtVolume, relativeDay } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/StatCard'
import { WeekTracker } from '@/components/WeekTracker'
import { LineChart } from '@/components/charts/LineChart'

export function Dashboard() {
  const navigate = useNavigate()
  const { person, href } = usePerson()
  const workouts = useMemo(() => getWorkouts(), [])

  const suggested = suggestNextDay(workouts)
  const suggestedDay = getDay(suggested)
  const done = daysDoneThisWeek(workouts)
  const streak = currentStreak(workouts)
  const weekVolume = volumeThisWeek(workouts)
  const thisWeek = workoutsThisWeek(workouts)
  const prs = totalPRCount(workouts)

  // Headline lift: whichever has the most sessions behind it, squats by default.
  const headline = useMemo(() => {
    const counts = new Map<string, number>()
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (ex.sets.some((s) => s.done)) {
          counts.set(ex.exerciseId, (counts.get(ex.exerciseId) ?? 0) + 1)
        }
      }
    }
    let best: string | null = null
    let bestCount = 0
    for (const [id, count] of counts) {
      if (count > bestCount) {
        best = id
        bestCount = count
      }
    }
    return best ?? 'barbell-squats'
  }, [workouts])

  const series = useMemo(
    () =>
      exerciseSeries(workouts, headline).map((p) => ({
        date: p.date,
        value: p.weight > 0 ? p.weight : p.reps,
        detail: p.weight > 0 ? `${fmtKg(p.weight)} kg x ${p.reps}` : `${p.reps} reps`,
      })),
    [workouts, headline],
  )

  const recent = workouts.slice(0, 4)

  return (
    <div className="space-y-5">
      {/* Hero */}
      <Card className="relative overflow-hidden border-flame/25 p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-flame/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-hot/15 blur-3xl" />

        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest text-flame">
            {workouts.length ? 'Up next' : `Welcome to IronLog, ${person.name}`}
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            Day {suggestedDay.id}
            <span className="text-gradient-flame"> {suggestedDay.name}</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-chalk-muted">
            {suggestedDay.subtitle} · {suggestedDay.slots.length} exercises
          </p>

          <Button
            size="lg"
            className="mt-5 w-full sm:w-auto"
            onClick={() => navigate(href(`/log?day=${suggestedDay.id}`))}
          >
            <Play className="h-5 w-5" fill="currentColor" />
            Start workout
          </Button>
        </div>
      </Card>

      {/* Week goal */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-chalk-muted">This week</h2>
          <span className="num text-xs font-bold text-chalk-faint">{done.size} of 3</span>
        </div>
        <WeekTracker done={done} onPick={(day) => navigate(href(`/log?day=${day}`))} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Streak"
          value={`${streak}`}
          unit={streak === 1 ? 'wk' : 'wks'}
          hint="Full weeks"
          icon={Flame}
          tone="flame"
        />
        <StatCard
          label="Week volume"
          value={fmtVolume(weekVolume)}
          unit="kg"
          hint="Mon to Sun"
          icon={Dumbbell}
          tone="hot"
        />
        <StatCard
          label="Sessions"
          value={`${thisWeek.length}`}
          hint="This week"
          icon={Activity}
          tone="chalk"
        />
        <StatCard label="PRs set" value={`${prs}`} hint="All time" icon={Trophy} tone="volt" />
      </div>

      {/* Headline progression */}
      <Card className="p-5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold">{EXERCISE_NAMES[headline] ?? headline}</h2>
            <p className="text-[11px] font-semibold text-chalk-faint">Top set progression</p>
          </div>
          <Link
            to={href("/progress")}
            className="flex shrink-0 items-center gap-1 text-xs font-bold text-flame hover:text-flame-soft"
          >
            All charts
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {series.length >= 2 ? (
          <LineChart points={series} height={150} minimal />
        ) : (
          <EmptyBlock
            icon={TrendingUp}
            text={
              series.length === 1
                ? 'One more session and this chart comes alive.'
                : 'Log a workout to start your first chart.'
            }
          />
        )}
      </Card>

      {/* Recent activity */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Recent activity</h2>
          {workouts.length > 0 && (
            <Link
              to={href("/history")}
              className="flex items-center gap-1 text-xs font-bold text-flame hover:text-flame-soft"
            >
              History
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {recent.length ? (
          <div className="space-y-2">
            {recent.map((workout) => {
              const day = getDay(workout.dayId)
              return (
                <Link
                  key={workout.id}
                  to={href("/history")}
                  className="flex items-center gap-3 rounded-2xl bg-ink-900/50 p-3 transition-colors hover:bg-ink-700/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flame to-hot text-sm font-black text-white">
                    {workout.dayId}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{day.name}</div>
                    <div className="text-[11px] font-semibold text-chalk-faint">
                      {relativeDay(workout.date)}
                    </div>
                  </div>
                  <span className="num shrink-0 text-xs font-bold text-chalk-muted">
                    {fmtVolume(workoutVolume(workout))} kg
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <EmptyBlock icon={Activity} text="Nothing logged yet. Your first session starts the record." />
        )}
      </Card>
    </div>
  )
}

function EmptyBlock({
  icon: Icon,
  text,
}: {
  icon: typeof Activity
  text: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-600 py-8 text-center">
      <Icon className="h-6 w-6 text-chalk-faint" />
      <p className="max-w-[240px] text-xs font-medium text-chalk-faint">{text}</p>
    </div>
  )
}
