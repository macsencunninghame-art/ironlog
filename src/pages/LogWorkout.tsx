import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Camera, Check, ImagePlus, Save, Trophy, X } from 'lucide-react'
import type { DayId, LoggedExercise, Workout } from '@/types'
import { getDay, type RoutineSlot } from '@/lib/routine'
import { checkPR, getPR, workoutVolume } from '@/lib/stats'
import { getWorkouts, saveWorkout } from '@/lib/workouts'
import { usePerson } from '@/components/PersonScope'
import { NoRoutine } from '@/components/NoRoutine'
import { addPhoto } from '@/lib/photos'
import { useObjectUrl } from '@/lib/hooks'
import { CameraCapture } from '@/components/CameraCapture'
import { cn, fmtVolume, toDateInputValue, fromDateInputValue, uid } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ExerciseLogger } from '@/components/ExerciseLogger'

export function LogWorkout() {
  const navigate = useNavigate()
  const { person, routine, href } = usePerson()
  const [params, setParams] = useSearchParams()

  // The valid days are whatever this person's routine defines, so the ?day= param
  // is checked against that rather than against a fixed 1-3.
  const paramDay = Number(params.get('day'))
  const initialDay: DayId = routine.some((d) => d.id === paramDay) ? paramDay : (routine[0]?.id ?? 0)

  const [dayId, setDayId] = useState<DayId>(initialDay)
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [entries, setEntries] = useState<LoggedExercise[]>([])
  const [saved, setSaved] = useState(false)
  // Held until the session is saved, so the photos can be filed against its id.
  const [photos, setPhotos] = useState<File[]>([])
  const [savingPhotos, setSavingPhotos] = useState(false)
  const [photoError, setPhotoError] = useState(0)
  const photoRef = useRef<HTMLInputElement>(null)
  const [shooting, setShooting] = useState(false)

  // Snapshot of history taken once - PRs must not shift as the form is typed into.
  const history = useMemo(() => getWorkouts(), [])
  const day = getDay(routine, dayId)

  const prs = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getPR>>()
    if (!day) return map
    for (const slot of day.slots) {
      if (!map.has(slot.exerciseId)) map.set(slot.exerciseId, getPR(history, slot.exerciseId))
    }
    return map
  }, [history, day])

  // Rebuild the blank form whenever the day changes.
  useEffect(() => {
    if (!day) return
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
      const slot = day?.slots[i]
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

  const handleSave = async () => {
    // Keep only exercises that were actually touched, so partial sessions stay tidy.
    const exercises = entries
      .map((entry) => ({
        ...entry,
        sets: entry.sets.filter((s) => s.done),
      }))
      .filter((entry) => entry.sets.length > 0 || entry.warmupsDone.some(Boolean))

    if (!exercises.length) return

    const workout = { ...draft, exercises }
    saveWorkout(workout)

    if (photos.length) {
      setSavingPhotos(true)
      let failed = 0
      for (const file of photos) {
        try {
          await addPhoto(person.id, file, {
            workoutId: workout.id,
            dayId: workout.dayId,
            date: workout.date,
          })
        } catch {
          // The session itself is already saved. A photo that will not store is
          // worth reporting, but it must never cost the user their workout.
          failed += 1
        }
      }
      setPhotoError(failed)
      setSavingPhotos(false)
    }

    setSaved(true)
    setTimeout(() => navigate(href('/history')), 900)
  }

  // After the hooks, so their order never changes between renders.
  if (!day) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Log workout</h1>
          <p className="mt-0.5 text-sm text-chalk-muted">Weights in kilograms.</p>
        </div>
        <NoRoutine name={person.name} action="log" />
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Log workout</h1>
        <p className="mt-0.5 text-sm text-chalk-muted">Weights in kilograms.</p>
      </div>

      {/* Day picker */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))' }}
      >
        {routine.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => switchDay(d.id)}
            className={cn(
              'rounded-2xl border p-3 text-left transition-all active:scale-[0.98]',
              d.id === dayId
                ? 'border-accent bg-gradient-to-br from-accent/20 to-accent2/10 shadow-lg shadow-accent/10'
                : 'border-ink-600 bg-ink-800/60 hover:border-ink-500',
            )}
          >
            <div className={cn('text-[10px] font-black uppercase tracking-widest', d.id === dayId ? 'text-accent' : 'text-chalk-faint')}>
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

      {/* Session photo */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Session photo</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">
              {photos.length
                ? `${photos.length} photo${photos.length === 1 ? '' : 's'} will be saved with this session`
                : 'Optional. Saved with the session and shown in your gallery.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShooting(true)}>
              <Camera className="h-4 w-4" />
              Take photo
            </Button>
            <Button variant="secondary" size="sm" onClick={() => photoRef.current?.click()}>
              <ImagePlus className="h-4 w-4" />
              Upload
            </Button>
          </div>
          <input
            ref={photoRef}
            id="session-photo"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []).filter((f) =>
                f.type.startsWith('image/'),
              )
              if (picked.length) setPhotos((prev) => [...prev, ...picked])
              e.target.value = ''
            }}
          />
        </div>

        {photoError > 0 && (
          <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-200">
            The session saved, but {photoError} photo{photoError === 1 ? '' : 's'} could not be
            stored. Try adding {photoError === 1 ? 'it' : 'them'} again from the gallery.
          </p>
        )}

        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map((file, i) => (
              <PhotoChip
                key={`${file.name}-${i}`}
                file={file}
                onRemove={() => setPhotos((prev) => prev.filter((_, n) => n !== i))}
              />
            ))}
          </div>
        )}
      </Card>

      {shooting && (
        <CameraCapture
          title={`Photo for ${person.name}`}
          onCapture={(file) => {
            setShooting(false)
            setPhotos((prev) => [...prev, file])
          }}
          onClose={() => setShooting(false)}
        />
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-24 z-10 lg:bottom-4">
        <Card className="glass flex items-center gap-3 border-accent/25 p-3">
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
            disabled={completedSets === 0 || saved || savingPhotos}
            variant={saved ? 'volt' : 'primary'}
            size="lg"
            className="shrink-0"
          >
            {saved ? (
              <>
                <Check className="h-5 w-5" strokeWidth={3} />
                Saved
              </>
            ) : savingPhotos ? (
              <>
                <Camera className="h-5 w-5" />
                Saving photos…
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

/** Preview of a photo picked for this session, before it is written to the gallery. */
function PhotoChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useObjectUrl(file)

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-ink-600 bg-ink-900">
      {url && <img src={url} alt={file.name} className="h-full w-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute right-0.5 top-0.5 rounded-lg bg-ink-950/80 p-0.5 text-chalk-muted hover:text-chalk"
      >
        <X className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
    </div>
  )
}
