import { Check } from 'lucide-react'
import type { DayId } from '@/types'
import type { RoutineDay } from '@/lib/routine'
import { cn } from '@/lib/utils'

interface WeekTrackerProps {
  routine: RoutineDay[]
  done: Set<DayId>
  onPick?: (day: DayId) => void
}

/**
 * Purely informational. There is no fixed schedule and nothing here blocks
 * a fourth or fifth session - it just shows what is left in the week.
 */
export function WeekTracker({ routine, done, onPick }: WeekTrackerProps) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))' }}
    >
      {routine.map((day) => {
        const complete = done.has(day.id)
        return (
          <button
            key={day.id}
            type="button"
            onClick={() => onPick?.(day.id)}
            disabled={!onPick}
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition-all',
              onPick && 'hover:border-accent/50 active:scale-[0.98]',
              complete
                ? 'border-volt/40 bg-volt/10'
                : 'border-ink-600 bg-ink-800/60',
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black',
                complete ? 'bg-volt text-ink-950' : 'bg-ink-700 text-chalk-faint',
              )}
            >
              {complete ? <Check className="h-3.5 w-3.5" strokeWidth={4} /> : day.id}
            </span>
            <span
              className={cn(
                'truncate text-xs font-bold',
                complete ? 'text-volt' : 'text-chalk-muted',
              )}
            >
              Day {day.id}
            </span>
          </button>
        )
      })}
    </div>
  )
}
