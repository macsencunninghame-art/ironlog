import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Check, Save, Trophy } from 'lucide-react'
import type { DayId, LoggedExercise, Workout } from '@/types'
import { ROUTINE, getDay, type RoutineSlot } from '@/lib/routine'
import { checkPR, getPR, workoutVolume } from '@/lib/stats'
import { getWorkouts, saveWorkout } from '@/lib/workouts'
import { usePerson } from '@/components/PersonScope'
import { cn, fmtVolume, toDateInputValue, fromDateInputValue, uid } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ExerciseLogger } from '@/components/ExerciseLogger'

export function LogWorkout() {
  const navigate = useNavigate()
  const { href } = usePerson()
  const [params, setParams] = useSearchParams()

  const paramDay = Number(params.get('day'))
  const initialDay: DayId = paramDay === 1 || paramDay === 2 || paramDay === 3 ? paramDay : 1

  const [dayId, setDayId] = useState<DayId>(initialDay)
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [entries, setEntries] = useState<LoggedExercise[]>([])
  const [saved, setSaved] = useState(false)

  // Snapshot of history taken once - PRs must not shift as the form is typed into.
  const history = useMemo(() => getWorkouts(), [])
  const day = getDay(dayId)

  const prs = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getPR>>()
    for (const slot of day.slots) {
      if (!map.has(slot.exerciseId)) map.set(slot.exerciseId, getPR(history, slot.exerciseId))
    }
    return map
  }, [history, day])

  // Rebuild the blank form whenever the day changes.
  useEffect(() => {
    setEntries(day.slots.map((slot) => blankEntry(slot, history)))
    setSaved(false)
  }, [day, history])

  const switchDay = (next: DayId) => {
    setDayId(next)
    setParams({ day: String(next) }, { replace: true })
  }

  const completedSets = entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)

  const prCount = useMemo(() => {
    let count = 0
    entries.forEach((entry, i) => {
      const slot = day.slots[i]
      if (!slot) return
      const pr = prs.get(slot.exerciseId) ?? null
      for (const set of entry.sets) {
        if (!set.done) continue
        if (checkPR(pr, set.weight, set.reps, set.isDropSet, slot.bodyweight).isPR) count += 1
      }
    })
    return count
  }, [entries, day, prs])

  const draft: Workout = {
    id: uid(),
    dayId,
    date: fromDateInputValue(date).toISOString(),
    exercises: entries,
  }
  const volume = workoutVolume(draft)

  const handleSave = () => {
    // Keep only exercises that were actually touched, so partial sessions stay tidy.
    const exercises = entries
      .map((entry) => ({
        ...entry,
        sets: entry.sets.filter((s) => s.done),
      }))
      .filter((entry) => entry.sets.length > 0 || entry.warmupsDone.some(Boolean))

    if (!exercises.length) return

    saveWorkout({ ...draft, exercises })
    setSaved(true)
    setTimeout(() => navigate(href('/history')), 900)
  }

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Log workout</h1>
        <p className="mt-0.5 text-sm text-chalk-muted">Weights in kilograms.</p>
      </div>

      {/* Day picker */}
      <div className="grid grid-cols-3 gap-2">
        {ROUTINE.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => switchDay(d.id)}
            className={cn(
              'rounded-2xl border p-3 text-left transition-all active:scale-[0.98]',
              d.id === dayId
                ? 'border-flame bg-gradient-to-br from-flame/20 to-hot/10 shadow-lg shadow-flame/10'
                : 'border-ink-600 bg-ink-800/60 hover:border-ink-500',
            )}
          >
            <div className={cn('text-[10px] font-black uppercase tracking-widest', d.id === dayId ? 'text-flame' : 'text-chalk-faint')}>
              Day {d.id}
            </div>
            <div className={cn('mt-0.5 truncate text-xs font-bold', d.id === dayId ? 'text-chalk' : 'text-chalk-muted')}>
              {d.name}
            </div>
          </button>
        ))}
      </div>

      {/* Date */}
      <Card className="flex items-center gap-3 p-4">
        <CalendarDays className="h-5 w-5 shrink-0 text-chalk-muted" />
        <label htmlFor="workout-date" className="text-xs font-bold uppercase tracking-wider text-chalk-muted">
          Date
        </label>
        <Input
          id="workout-date"
          type="date"
          value={date}
          max={toDateInputValue(new Date())}
          onChange={(e) => setDate(e.target.value)}
          className="ml-auto max-w-[170px] text-sm font-bold"
        />
      </Card>

      {/* Exercises */}
      <div className="space-y-3">
        {day.slots.map((slot, i) => {
          const entry = entries[i]
          if (!entry) return null
          return (
            <ExerciseLogger
              key={`${slot.exerciseId}-${i}`}
              slot={slot}
              logged={entry}
              pr={prs.get(slot.exerciseId) ?? null}
              onChange={(next) => setEntries((prev) => prev.map((e, j) => (j === i ? next : e)))}
            />
          )
        })}
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-24 z-10 lg:bottom-4">
        <Card className="glass flex items-center gap-3 border-flame/25 p-3">
          <div className="min-w-0 flex-1">
            <div className="num flex items-center gap-2 text-sm font-black">
              {completedSets} sets
              <span className="text-chalk-faint">·</span>
              {fmtVolume(volume)} kg
            </div>
            {prCount > 0 && (
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-volt">
                <Trophy className="h-3 w-3" strokeWidth={3} />
                {prCount} new PR{prCount === 1 ? '' : 's'}
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={completedSets === 0 || saved}
            variant={saved ? 'volt' : 'primary'}
            size="lg"
            className="shrink-0"
          >
            {saved ? (
              <>
                <Check className="h-5 w-5" strokeWidth={3} />
                Saved
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  )
}

/**
 * Blank form for one exercise.
 * Weights pre-fill from the last time you did the lift, falling back to the
 * starting numbers baked into the routine. Nothing is recorded until you save.
 */
function blankEntry(slot: RoutineSlot, history: Workout[]): LoggedExercise {
  let weight = slot.startWeight
  let reps = slot.startReps

  for (const workout of history) {
    const previous = workout.exercises.find((e) => e.exerciseId === slot.exerciseId)
    if (!previous) continue
    const lastDone = [...previous.sets].reverse().find((s) => s.done && !s.isDropSet)
    if (lastDone) {
      weight = lastDone.weight ?? weight
      reps = lastDone.reps ?? reps
      break
    }
  }

  return {
    exerciseId: slot.exerciseId,
    warmupsDone: Array.from({ length: slot.warmupSets }, () => false),
    sets: Array.from({ length: slot.sets }, (_, i) => ({
      weight: slot.bodyweight ? null : weight,
      reps: reps ?? slot.reps,
      done: false,
      isDropSet: Boolean(slot.dropSet) && i === slot.sets - 1,
    })),
  }
}
