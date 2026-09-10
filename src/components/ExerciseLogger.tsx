import { Flame, Link2, Minus, Plus, TrendingDown, Trophy } from 'lucide-react'
import type { LoggedExercise, SetEntry } from '@/types'
import type { RoutineSlot } from '@/lib/routine'
import { checkPR, type PR } from '@/lib/stats'
import { cn, fmtKg } from '@/lib/utils'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { Checkbox } from './ui/Checkbox'
import { Input } from './ui/Input'

interface ExerciseLoggerProps {
  slot: RoutineSlot
  logged: LoggedExercise
  /** Standing PR from previous sessions - never includes the set being typed. */
  pr: PR | null
  onChange: (next: LoggedExercise) => void
}

export function ExerciseLogger({ slot, logged, pr, onChange }: ExerciseLoggerProps) {
  const update = (patch: Partial<LoggedExercise>) => onChange({ ...logged, ...patch })

  const updateSet = (index: number, patch: Partial<SetEntry>) => {
    const sets = logged.sets.map((s, i) => (i === index ? { ...s, ...patch } : s))
    update({ sets })
  }

  const addSet = () => {
    const last = logged.sets[logged.sets.length - 1]
    update({
      sets: [
        ...logged.sets,
        // Added sets are never drop sets, so an extra set cannot silently void a PR.
        { weight: last?.weight ?? slot.startWeight, reps: slot.reps, done: false, isDropSet: false },
      ],
    })
  }

  const removeSet = (index: number) => {
    if (logged.sets.length <= 1) return
    update({ sets: logged.sets.filter((_, i) => i !== index) })
  }

  const toggleWarmup = (index: number) => {
    update({ warmupsDone: logged.warmupsDone.map((w, i) => (i === index ? !w : w)) })
  }

  const prLabel = pr
    ? pr.bodyweight
      ? `${pr.topSetReps} reps`
      : `${fmtKg(pr.topSetWeight)} kg x ${pr.topSetReps}`
    : null

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-600/60 bg-ink-800/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold tracking-tight">{slot.name}</h3>
            <p className="num mt-0.5 text-xs font-semibold text-chalk-muted">
              {slot.sets} x {slot.reps}
              {slot.bodyweight && ' · bodyweight'}
            </p>
          </div>

          <div className="shrink-0 text-right">
            {prLabel ? (
              <>
                <div className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-chalk-faint">
                  <Trophy className="h-3 w-3" />
                  PR
                </div>
                <div className="num text-sm font-black text-volt">{prLabel}</div>
              </>
            ) : (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-chalk-faint">
                No PR yet
              </div>
            )}
          </div>
        </div>

        {(slot.warmupSets > 0 || slot.supersetGroup || slot.dropSet) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {slot.warmupSets > 0 && (
              <Badge tone="warmup">
                <Flame className="h-2.5 w-2.5" />
                {slot.warmupSets} warmup
              </Badge>
            )}
            {slot.supersetGroup && (
              <Badge tone="superset">
                <Link2 className="h-2.5 w-2.5" />
                superset
              </Badge>
            )}
            {slot.dropSet && (
              <Badge tone="drop">
                <TrendingDown className="h-2.5 w-2.5" />
                drop set
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {slot.warmupSets > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/5 px-3 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">Warmup</span>
            <div className="ml-auto flex gap-2">
              {logged.warmupsDone.map((done, i) => (
                <Checkbox
                  key={i}
                  checked={done}
                  onChange={() => toggleWarmup(i)}
                  label={`Warmup set ${i + 1}`}
                  className="h-8 w-8 rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {!slot.bodyweight && (
            <div className="num flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-chalk-faint">
              <span className="w-6">Set</span>
              <span className="flex-1">kg</span>
              <span className="flex-1">reps</span>
              <span className="w-9" />
            </div>
          )}

          {logged.sets.map((set, i) => {
            const result = checkPR(pr, set.weight, set.reps, set.isDropSet, slot.bodyweight)
            const showPR = result.isPR && set.done

            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 rounded-2xl border p-2 transition-all',
                  showPR
                    ? 'border-volt/50 bg-volt/10'
                    : set.done
                      ? 'border-ink-500 bg-ink-700/40'
                      : 'border-transparent bg-ink-900/40',
                )}
              >
                <div className="flex w-6 shrink-0 flex-col items-center">
                  <span className="num text-sm font-black text-chalk-muted">{i + 1}</span>
                  {set.isDropSet && (
                    <span className="text-[8px] font-bold uppercase text-violet-300">drop</span>
                  )}
                </div>

                {!slot.bodyweight && (
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    value={set.weight ?? ''}
                    placeholder="0"
                    aria-label={`Set ${i + 1} weight in kilograms`}
                    onChange={(e) =>
                      updateSet(i, { weight: e.target.value === '' ? null : Number(e.target.value) })
                    }
                    className="flex-1 text-center text-base font-bold"
                  />
                )}

                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={set.reps ?? ''}
                  placeholder="0"
                  aria-label={`Set ${i + 1} reps`}
                  onChange={(e) =>
                    updateSet(i, { reps: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  className={cn('flex-1 text-center text-base font-bold', slot.bodyweight && 'max-w-[140px]')}
                />

                {slot.bodyweight && (
                  <span className="text-xs font-semibold text-chalk-faint">reps</span>
                )}

                {showPR && (
                  <span className="animate-pr-pop flex items-center gap-1 rounded-lg bg-volt px-2 py-1 text-[10px] font-black uppercase text-ink-950">
                    <Trophy className="h-3 w-3" strokeWidth={3} />
                    PR
                  </span>
                )}

                <Checkbox
                  checked={set.done}
                  onChange={(next) => updateSet(i, { done: next })}
                  label={`Set ${i + 1} done`}
                  tone={result.isPR ? 'volt' : 'accent'}
                />

                {logged.sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSet(i)}
                    aria-label={`Remove set ${i + 1}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-ink-700 hover:text-red-300"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addSet}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-500 py-2 text-xs font-bold text-chalk-muted transition-colors hover:border-accent/50 hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          Add set
        </button>
      </div>
    </Card>
  )
}
