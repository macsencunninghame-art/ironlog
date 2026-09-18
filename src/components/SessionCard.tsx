import { useState } from 'react'
import { ChevronDown, Dumbbell, Layers } from 'lucide-react'
import type { LoggedExercise, Workout } from '@/types'
import { CATEGORIES, categoryOf, dayLabel, exerciseName, type Category } from '@/lib/routine'
import { usePerson } from './PersonScope'
import { completedSetCount, workoutVolume } from '@/lib/stats'
import { cn, fmtDateLong, fmtKg, fmtVolume, relativeDay } from '@/lib/utils'
import { Badge } from './ui/Badge'
import { CategoryBadge, CategoryHeading } from './CategoryLabel'
import { Card } from './ui/Card'

interface SessionCardProps {
  workout: Workout
  /** Narrows the exercises shown inside to one category. 'all' shows everything. */
  category?: Category | 'all'
}

/** A run of logged exercises that share a category, in the order they were logged. */
interface Run {
  category: Category | undefined
  exercises: LoggedExercise[]
}

export function SessionCard({ workout, category = 'all' }: SessionCardProps) {
  const [open, setOpen] = useState(false)

  const { routine } = usePerson()

  const day = dayLabel(routine, workout.dayId)
  const volume = workoutVolume(workout)
  const sets = completedSetCount(workout)

  // Only exercises that were actually done - warmups on their own still count as
  // having turned up, which is why they survive the filter.
  const logged = workout.exercises.filter(
    (ex) => ex.sets.some((s) => s.done) || ex.warmupsDone.some(Boolean),
  )

  const categories = CATEGORIES.map((c) => c.id).filter((id) =>
    logged.some((ex) => categoryOf(routine, workout.dayId, ex.exerciseId) === id),
  )

  const visible =
    category === 'all'
      ? logged
      : logged.filter((ex) => categoryOf(routine, workout.dayId, ex.exerciseId) === category)

  const runs: Run[] = []
  for (const ex of visible) {
    const cat = categoryOf(routine, workout.dayId, ex.exerciseId)
    const last = runs[runs.length - 1]
    if (last && last.category === cat) last.exercises.push(ex)
    else runs.push({ category: cat, exercises: [ex] })
  }

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-ink-700/30"
        aria-expanded={open}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2 text-base font-black text-accent-fg shadow-lg shadow-accent/20">
          {workout.dayId}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold">{day}</span>
            <Badge tone="muted">{relativeDay(workout.date)}</Badge>
          </div>
          <div className="num mt-1 flex items-center gap-3 text-[11px] font-semibold text-chalk-muted">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {sets} sets
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {fmtVolume(volume)} kg
            </span>
          </div>
          {categories.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {categories.map((c) => (
                <CategoryBadge key={c} category={c} />
              ))}
            </div>
          )}
        </div>

        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-chalk-faint transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="animate-rise border-t border-ink-600/60 px-4 pb-4 pt-3">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-chalk-faint">
            {fmtDateLong(workout.date)}
          </p>

          {runs.length ? (
            <div className="space-y-4">
              {runs.map((run, r) => (
                <div key={`${run.category ?? 'other'}-${r}`} className="space-y-2">
                  {run.category ? (
                    <CategoryHeading category={run.category} />
                  ) : (
                    // Logged under a routine that no longer lists this exercise. It
                    // still shows - history is never hidden - just without a label.
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-chalk-faint">
                        Other
                      </span>
                      <span className="h-px flex-1 bg-ink-600/70" />
                    </div>
                  )}

                  {run.exercises.map((ex) => {
                    const doneSets = ex.sets.filter((s) => s.done)
                    return (
                      <div key={ex.exerciseId} className="rounded-2xl bg-ink-900/50 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-bold">
                            {exerciseName(routine, ex.exerciseId, workout.dayId)}
                          </span>
                          {ex.warmupsDone.some(Boolean) && (
                            <Badge tone="warmup">
                              {ex.warmupsDone.filter(Boolean).length} warmup
                            </Badge>
                          )}
                        </div>

                        {doneSets.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {doneSets.map((set, i) => (
                              <span
                                key={i}
                                className={cn(
                                  'num rounded-lg border px-2 py-1 text-xs font-bold',
                                  set.isDropSet
                                    ? 'border-violet-500/30 bg-violet-500/10 text-violet-700'
                                    : 'border-ink-600 bg-ink-800 text-chalk',
                                )}
                              >
                                {set.weight !== null && set.weight > 0
                                  ? `${fmtKg(set.weight)} x ${set.reps ?? 0}`
                                  : `${set.reps ?? 0} reps`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-chalk-faint">Warmup only</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-2 text-[11px] font-medium text-chalk-faint">
              Nothing in this session falls under that category.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
