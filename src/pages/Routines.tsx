import { Flame, Link2, Lock, TrendingDown } from 'lucide-react'
import { usePerson } from '@/components/PersonScope'
import { NoRoutine } from '@/components/NoRoutine'
import { fmtKg } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

export function Routines() {
  const { person, routine } = usePerson()

  if (!routine.length) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">The routine</h1>
          <p className="mt-0.5 text-sm text-chalk-muted">{person.name}&apos;s training days.</p>
        </div>
        <NoRoutine name={person.name} action="show" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">The routine</h1>
        <p className="mt-0.5 text-sm text-chalk-muted">
          {routine.length} day{routine.length === 1 ? '' : 's'} for {person.name}. All weights in
          kilograms.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-ink-600 bg-ink-800/50 px-4 py-3">
        <Lock className="h-4 w-4 shrink-0 text-chalk-faint" />
        <p className="text-xs font-medium text-chalk-muted">
          Fixed by design. The routine lives in the source and cannot be changed from inside the app.
        </p>
      </div>

      {routine.map((day) => (
        <Card key={day.id} className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-ink-600/60 bg-gradient-to-r from-accent/12 to-transparent p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2 text-base font-black text-white shadow-lg shadow-accent/20">
              {day.id}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-black tracking-tight">{day.name}</h2>
              <p className="truncate text-[11px] font-semibold text-chalk-muted">
                {day.subtitle} · {day.slots.length} exercises
              </p>
            </div>
          </div>

          <div className="divide-y divide-ink-600/40">
            {day.slots.map((slot, i) => (
              <div key={`${slot.exerciseId}-${i}`} className="flex items-start gap-3 p-4">
                <span className="num mt-0.5 w-5 shrink-0 text-xs font-black text-chalk-faint">
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold leading-snug">{slot.name}</h3>

                  <div className="num mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-chalk-muted">
                    <span className="text-accent-soft">
                      {slot.sets} x {slot.reps}
                    </span>
                    {slot.startWeight !== null ? (
                      <span>
                        start {fmtKg(slot.startWeight)} kg x {slot.startReps}
                      </span>
                    ) : (
                      <span>bodyweight · reps only</span>
                    )}
                  </div>

                  {(slot.warmupSets > 0 || slot.supersetGroup || slot.dropSet) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
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
                          last set drop
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <p className="px-1 pb-2 text-[11px] leading-relaxed text-chalk-faint">
        Warmup sets are ticked off rather than logged, so they never count toward volume or PRs.
        Drop sets are recorded but excluded from PRs.
      </p>
    </div>
  )
}
