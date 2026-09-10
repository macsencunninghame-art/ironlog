import { useState } from 'react'
import { ChevronDown, Dumbbell, Layers, Trash2 } from 'lucide-react'
import type { Workout } from '@/types'
import { EXERCISE_NAMES, dayLabel } from '@/lib/routine'
import { usePerson } from './PersonScope'
import { completedSetCount, workoutVolume } from '@/lib/stats'
import { cn, fmtDateLong, fmtKg, fmtVolume, relativeDay } from '@/lib/utils'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'

interface SessionCardProps {
  workout: Workout
  onDelete: (id: string) => void
}

export function SessionCard({ workout, onDelete }: SessionCardProps) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const { routine } = usePerson()

  const day = dayLabel(routine, workout.dayId)
  const volume = workoutVolume(workout)
  const sets = completedSetCount(workout)

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-ink-700/30"
        aria-expanded={open}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2 text-base font-black text-white shadow-lg shadow-accent/20">
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
        </div>

        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-chalk-faint transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="animate-rise border-t border-ink-600/60 px-4 pb-4 pt-3">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-chalk-faint">
            {fmtDateLong(workout.date)}
          </p>

          <div className="space-y-3">
            {workout.exercises.map((ex) => {
              const doneSets = ex.sets.filter((s) => s.done)
              if (!doneSets.length && !ex.warmupsDone.some(Boolean)) return null

              return (
                <div key={ex.exerciseId} className="rounded-2xl bg-ink-900/50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold">
                      {EXERCISE_NAMES[ex.exerciseId] ?? ex.exerciseId}
                    </span>
                    {ex.warmupsDone.some(Boolean) && (
                      <Badge tone="warmup">{ex.warmupsDone.filter(Boolean).length} warmup</Badge>
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
                              ? 'border-violet-400/25 bg-violet-400/10 text-violet-300'
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

          <div className="mt-4 flex justify-end">
            {confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-chalk-muted">Delete this session?</span>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-chalk-muted hover:bg-ink-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(workout.id)}
                  className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-chalk-faint transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
