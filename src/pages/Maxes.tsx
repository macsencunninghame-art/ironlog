import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Trash2, Trophy, TrendingUp } from 'lucide-react'
import { MAX_LIFTS, addMax, bestMax, currentMax, deleteMax, historyFor, maxDelta } from '@/lib/maxes'
import { cn, fmtDateLong, fmtKg, fmtShortDate, toDateInputValue, fromDateInputValue } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LineChart } from '@/components/charts/LineChart'

export function Maxes() {
  // Bumped after every write so the whole board re-reads from storage.
  const [version, setVersion] = useState(0)
  const [openLift, setOpenLift] = useState<string | null>(null)

  const refresh = () => setVersion((v) => v + 1)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">1RM board</h1>
        <p className="mt-0.5 text-sm text-chalk-muted">
          Your tested maxes. Kept separate from training PRs.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-ink-600 bg-ink-800/50 px-4 py-3">
        <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-chalk-faint" />
        <p className="text-xs font-medium leading-relaxed text-chalk-muted">
          These are numbers you went and tested, entered by hand. They never feed into PR detection,
          so a heavy tested max will not stop your working sets from flashing lime.
        </p>
      </div>

      <div className="space-y-3">
        {MAX_LIFTS.map((lift) => (
          <MaxCard
            key={`${lift.id}-${version}`}
            liftId={lift.id}
            name={lift.name}
            note={lift.note}
            open={openLift === lift.id}
            onToggle={() => setOpenLift(openLift === lift.id ? null : lift.id)}
            onChanged={refresh}
          />
        ))}
      </div>
    </div>
  )
}

interface MaxCardProps {
  liftId: string
  name: string
  note?: string
  open: boolean
  onToggle: () => void
  onChanged: () => void
}

function MaxCard({ liftId, name, note, open, onToggle, onChanged }: MaxCardProps) {
  const history = useMemo(() => historyFor(liftId), [liftId])
  const current = currentMax(liftId)
  const best = bestMax(liftId)
  const delta = maxDelta(liftId)

  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))

  const series = history.map((entry) => ({
    date: new Date(entry.date),
    value: entry.weight,
    detail: fmtShortDate(entry.date),
  }))

  const submit = () => {
    const value = Number(weight)
    if (!Number.isFinite(value) || value <= 0) return
    addMax(liftId, value, fromDateInputValue(date))
    setWeight('')
    onChanged()
  }

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-ink-700/30"
      >
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold">{name}</h2>
          {note && <p className="text-[10px] font-semibold uppercase tracking-wider text-chalk-faint">{note}</p>}
        </div>

        <div className="shrink-0 text-right">
          {current ? (
            <>
              <div className="num text-xl font-black leading-none text-volt">
                {fmtKg(current.weight)}
                <span className="ml-1 text-xs font-bold text-chalk-muted">kg</span>
              </div>
              {delta !== null && delta !== 0 && (
                <div
                  className={cn(
                    'num mt-1 flex items-center justify-end gap-0.5 text-[10px] font-bold',
                    delta > 0 ? 'text-volt' : 'text-chalk-faint',
                  )}
                >
                  <TrendingUp className={cn('h-3 w-3', delta < 0 && 'rotate-180')} />
                  {delta > 0 ? '+' : ''}
                  {fmtKg(delta)} kg
                </div>
              )}
            </>
          ) : (
            <span className="text-xs font-semibold text-chalk-faint">Not set</span>
          )}
        </div>

        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-chalk-faint transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="animate-rise border-t border-ink-600/60 p-4">
          {series.length >= 2 && (
            <div className="mb-4">
              <LineChart points={series} height={170} color="#C6FF3D" suffix="kg" />
            </div>
          )}

          {/* Add a new max */}
          <div className="mb-4 rounded-2xl border border-ink-600 bg-ink-900/50 p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-chalk-muted">
              Log a new max
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                placeholder="kg"
                value={weight}
                aria-label={`New ${name} max in kilograms`}
                onChange={(e) => setWeight(e.target.value)}
                className="w-24 text-center text-base font-bold"
              />
              <Input
                type="date"
                value={date}
                max={toDateInputValue(new Date())}
                aria-label={`Date of new ${name} max`}
                onChange={(e) => setDate(e.target.value)}
                className="w-[160px] text-sm font-semibold"
              />
              <Button size="sm" variant="volt" onClick={submit} disabled={!weight} className="ml-auto">
                <Plus className="h-4 w-4" strokeWidth={3} />
                Add
              </Button>
            </div>
          </div>

          {/* History */}
          {history.length ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-chalk-faint">
                  History
                </span>
                {best && history.length > 1 && (
                  <span className="num text-[11px] font-bold text-chalk-faint">
                    Best {fmtKg(best.weight)} kg
                  </span>
                )}
              </div>

              {[...history].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl bg-ink-900/50 px-3 py-2"
                >
                  <span className="num text-sm font-black text-chalk">
                    {fmtKg(entry.weight)}
                    <span className="ml-1 text-[10px] font-bold text-chalk-muted">kg</span>
                  </span>
                  <span className="text-[11px] font-semibold text-chalk-faint">
                    {fmtDateLong(entry.date)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      deleteMax(entry.id)
                      onChanged()
                    }}
                    aria-label="Delete this entry"
                    className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-chalk-faint transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-xs font-medium text-chalk-faint">
              Nothing recorded yet. Add your current max above.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
