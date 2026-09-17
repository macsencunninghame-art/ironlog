import { useMemo, useState } from 'react'
import { Gauge, Repeat, X } from 'lucide-react'
import type { IntervalRep } from '@/types'
import { fmtTime, parseTime } from '@/lib/running'
import { fmtDate, fromDateInputValue, toDateInputValue } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LineChart } from '@/components/charts/LineChart'
import { EntryList, EmptyBlock, MiniStat } from './parts'

/** One session, normalised so the three disciplines can share this whole screen. */
export interface IntervalRow {
  id: string
  date: string
  /** In the discipline's own unit. */
  distance: number
  reps: IntervalRep[]
  /** Best rep, average rep, the session's pace or speed, and the fade. */
  summary: {
    reps: number
    best: number
    average: number
    rate: number
    fade: number | null
  } | null
}

interface IntervalsLogProps {
  idPrefix: string
  accent: string
  /** "m" for swimming and running reps, "km" for riding. */
  unit: string
  distanceLabel: string
  distancePlaceholder: string
  repPlaceholder: string
  chartTitle: string
  chartBlurb: string
  /** How the session rate reads: a pace, or a speed. */
  formatRate: (value: number) => string
  /** Speed climbs as you improve; pace falls. Drives the "best" stat only. */
  lowerIsBetter: boolean
  rows: IntervalRow[]
  stats: { label: string; value: string; tone?: 'volt' }[]
  onAdd: (distance: number, reps: IntervalRep[], date: Date, restSeconds?: number) => void
}

/**
 * Log a set of reps, and chart how the sessions have moved.
 *
 * One component for running, swimming and riding intervals. The shape of the
 * session is identical - a rep distance and one time per rep - and everything
 * that differs between them is a prop: the unit, how the rate reads, and which
 * direction counts as better.
 *
 * Nothing about the summary is stored. Best, average, rate and fade are all
 * worked out from the reps, so they cannot drift away from them.
 */
export function IntervalsLog({
  idPrefix,
  accent,
  unit,
  distanceLabel,
  distancePlaceholder,
  repPlaceholder,
  chartTitle,
  chartBlurb,
  formatRate,
  lowerIsBetter,
  rows,
  stats,
  onAdd,
}: IntervalsLogProps) {
  const [distance, setDistance] = useState('')
  const [rest, setRest] = useState('')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [reps, setReps] = useState<string[]>(['', '', '', ''])

  const value = Number(distance)
  const repSeconds = reps.map(parseTime)
  const filled = repSeconds.filter((s): s is number => s !== null)
  const valid = Number.isFinite(value) && value > 0 && filled.length > 0

  const points = useMemo(
    () =>
      [...rows]
        .filter((r) => r.summary !== null)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((r) => ({
          date: new Date(r.date),
          value: r.summary!.rate,
          detail: `${r.summary!.reps} × ${r.distance}${unit} · ${formatRate(r.summary!.rate)} · ${fmtDate(r.date)}`,
        })),
    [rows, unit, formatRate],
  )

  const submit = () => {
    if (!valid) return
    onAdd(
      value,
      filled.map((seconds) => ({ seconds })),
      fromDateInputValue(date),
      parseTime(rest) ?? undefined,
    )
    setDistance('')
    setRest('')
    setReps(['', '', '', ''])
  }

  const setRep = (i: number, next: string) =>
    setReps((prev) => prev.map((r, n) => (n === i ? next : r)))

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold">Log an interval session</h2>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">One time per rep.</p>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[100px] flex-1">
            <label
              htmlFor={`${idPrefix}-distance`}
              className="text-[10px] font-black uppercase tracking-widest text-chalk-muted"
            >
              {distanceLabel}
            </label>
            <Input
              id={`${idPrefix}-distance`}
              inputMode="decimal"
              placeholder={distancePlaceholder}
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="min-w-[90px] flex-1">
            <label
              htmlFor={`${idPrefix}-rest`}
              className="text-[10px] font-black uppercase tracking-widest text-chalk-muted"
            >
              Rest (optional)
            </label>
            <Input
              id={`${idPrefix}-rest`}
              inputMode="numeric"
              placeholder="1:30"
              value={rest}
              onChange={(e) => setRest(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <label
              htmlFor={`${idPrefix}-date`}
              className="text-[10px] font-black uppercase tracking-widest text-chalk-muted"
            >
              Date
            </label>
            <Input
              id={`${idPrefix}-date`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-chalk-muted">
            Rep times
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {reps.map((repValue, i) => (
              <div key={i} className="relative">
                <Input
                  id={`${idPrefix}-rep-${i + 1}`}
                  aria-label={`Rep ${i + 1} time`}
                  inputMode="numeric"
                  placeholder={i === 0 ? repPlaceholder : `Rep ${i + 1}`}
                  value={repValue}
                  onChange={(e) => setRep(i, e.target.value)}
                />
                {reps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setReps((prev) => prev.filter((_, n) => n !== i))}
                    aria-label={`Remove rep ${i + 1}`}
                    className="absolute -right-1 -top-1 rounded-full bg-ink-700 p-0.5 text-chalk-faint hover:text-chalk"
                  >
                    <X className="h-3 w-3" strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setReps((prev) => [...prev, ''])}>
              Add rep
            </Button>
            <Button onClick={submit} disabled={!valid}>
              Save session
            </Button>
            {valid && (
              <span className="num text-[11px] font-bold text-accent">
                {filled.length} × {value}
                {unit} · avg {fmtTime(filled.reduce((n, t) => n + t, 0) / filled.length)}
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <MiniStat key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} />
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold">{chartTitle}</h2>
        </div>
        <p className="mb-3 text-[11px] font-semibold text-chalk-faint">{chartBlurb}</p>
        {points.length >= 2 ? (
          <LineChart
            points={points}
            height={200}
            color={accent}
            format={(v) => formatRate(v)}
          />
        ) : (
          <EmptyBlock
            text={
              points.length === 1
                ? 'One more session and this chart has something to plot.'
                : 'No interval sessions logged yet.'
            }
          />
        )}
      </Card>

      <EntryList
        rows={rows.map((r) => ({
          id: r.id,
          primary: r.summary ? `${r.summary.reps} × ${r.distance}${unit}` : `${r.distance}${unit}`,
          secondary: r.summary
            ? `best ${fmtTime(r.summary.best)} · avg ${fmtTime(r.summary.average)} · ${formatRate(r.summary.rate)}${fadeText(r.summary.fade)} · ${fmtDate(r.date)}`
            : fmtDate(r.date),
          best:
            r.summary !== null &&
            rows.every(
              (other) =>
                other.summary === null ||
                (lowerIsBetter
                  ? r.summary!.rate <= other.summary.rate
                  : r.summary!.rate >= other.summary.rate),
            ),
        }))}
        emptyText="Nothing logged yet."
      />
    </div>
  )
}

/** How the last rep compared with the first, in words rather than a signed number. */
function fadeText(fade: number | null): string {
  if (fade === null || Math.abs(fade) < 0.5) return ''
  const size = Math.abs(fade).toFixed(1)
  return fade > 0 ? ` · ${size}% slower by the last` : ` · ${size}% faster by the last`
}
