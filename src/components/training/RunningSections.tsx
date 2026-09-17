import { useMemo, useState } from 'react'
import { Footprints, Gauge, Repeat, Timer, TrendingDown, X } from 'lucide-react'
import type { BroncoEntry, IntervalEntry, RunEntry } from '@/types'
import {
  addBronco,
  addInterval,
  addRun,
  broncoStats,
  fmtPace,
  fmtTime,
  getBroncos,
  getIntervals,
  getRuns,
  intervalStats,
  paceOf,
  parseTime,
  runStats,
  summarise,
} from '@/lib/running'
import { fmtDate, fmtSignedPct, fromDateInputValue, toDateInputValue } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Segmented } from '@/components/ui/Segmented'
import { LineChart } from '@/components/charts/LineChart'
import { EntryList, EmptyBlock, MiniStat, SessionForm } from './parts'

export type RunView = 'bronco' | 'intervals' | 'runs'

const BRONCO_BLURB = '5 × (20-40-60 m shuttles) · 1200 m · lower is better'

/**
 * The three ways running gets logged, behind one switcher.
 *
 * Used by the Running tab and by the Run part of Tri, reading and writing the
 * same entries either way: a run is a run, and splitting the log by which tab
 * someone happened to open would make both halves wrong.
 *
 * No session is tied to a day of the week. Every entry carries its own date, so
 * any of the three can be logged on any day, including after the fact.
 */
export function RunningSections({
  accent,
  compact = false,
}: {
  accent: string
  compact?: boolean
}) {
  const [view, setView] = useState<RunView>('bronco')
  const [version, setVersion] = useState(0)
  const bump = () => setVersion((v) => v + 1)

  const broncos = useMemo(() => getBroncos(), [version])
  const intervals = useMemo(() => getIntervals(), [version])
  const runs = useMemo(() => getRuns(), [version])

  return (
    <div className="space-y-4">
      <Segmented
        className={compact ? 'bg-ink-900/60' : undefined}
        options={[
          { value: 'bronco', label: 'Bronco' },
          { value: 'intervals', label: 'Intervals' },
          { value: 'runs', label: 'Runs' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'bronco' && <BroncoView entries={broncos} accent={accent} onChange={bump} />}
      {view === 'intervals' && <IntervalsView entries={intervals} accent={accent} onChange={bump} />}
      {view === 'runs' && <RunsView entries={runs} accent={accent} onChange={bump} />}
    </div>
  )
}

// ------------------------------------------------------------------ Bronco

function BroncoView({
  entries,
  accent,
  onChange,
}: {
  entries: BroncoEntry[]
  accent: string
  onChange: () => void
}) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))

  const stats = broncoStats(entries)
  const seconds = parseTime(time)

  const points = useMemo(
    () =>
      [...entries]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((e) => ({
          date: new Date(e.date),
          value: e.seconds,
          detail: `${fmtTime(e.seconds)} · ${fmtDate(e.date)}`,
        })),
    [entries],
  )

  const submit = () => {
    if (seconds === null) return
    addBronco(seconds, fromDateInputValue(date))
    setTime('')
    onChange()
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold">Log a Bronco</h2>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">{BRONCO_BLURB}</p>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[110px] flex-1">
            <label
              htmlFor="bronco-time"
              className="text-[10px] font-black uppercase tracking-widest text-chalk-muted"
            >
              Time
            </label>
            <Input
              id="bronco-time"
              inputMode="numeric"
              placeholder="5:42"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <label
              htmlFor="bronco-date"
              className="text-[10px] font-black uppercase tracking-widest text-chalk-muted"
            >
              Date
            </label>
            <Input
              id="bronco-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={submit} disabled={seconds === null}>
            Add
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Best" value={stats.best ? fmtTime(stats.best.seconds) : '—'} tone="volt" />
        <MiniStat label="Latest" value={stats.latest ? fmtTime(stats.latest.seconds) : '—'} />
        <MiniStat
          label="Faster by"
          value={stats.improvedPct === null ? '—' : fmtSignedPct(stats.improvedPct)}
          tone={stats.improvedPct !== null && stats.improvedPct > 0 ? 'volt' : undefined}
        />
      </div>

      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold">Bronco times</h2>
        </div>
        <p className="mb-3 text-[11px] font-semibold text-chalk-faint">
          A line heading down is a line heading the right way.
        </p>
        {points.length >= 2 ? (
          <LineChart points={points} height={200} color={accent} format={fmtTime} />
        ) : (
          <EmptyBlock
            text={
              points.length === 1
                ? 'One more test and this chart comes alive.'
                : 'No Broncos logged yet.'
            }
          />
        )}
      </Card>

      <EntryList
        rows={entries.map((e) => ({
          id: e.id,
          primary: fmtTime(e.seconds),
          secondary: fmtDate(e.date),
          best: stats.best?.id === e.id,
        }))}
        emptyText="Nothing logged yet."
      />
    </div>
  )
}

// ------------------------------------------------------------------ Intervals

function IntervalsView({
  entries,
  accent,
  onChange,
}: {
  entries: IntervalEntry[]
  accent: string
  onChange: () => void
}) {
  const [distance, setDistance] = useState('')
  const [rest, setRest] = useState('')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [reps, setReps] = useState<string[]>(['', '', '', ''])

  const stats = intervalStats(entries)
  const distanceM = Number(distance)
  const repSeconds = reps.map(parseTime)
  const filled = repSeconds.filter((s): s is number => s !== null)
  const valid = Number.isFinite(distanceM) && distanceM > 0 && filled.length > 0

  const points = useMemo(
    () =>
      [...entries]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((e) => ({ entry: e, summary: summarise(e) }))
        .filter((x) => x.summary !== null)
        .map((x) => ({
          date: new Date(x.entry.date),
          value: x.summary!.pace,
          detail: `${x.summary!.reps} × ${x.entry.distanceM}m · avg ${fmtTime(x.summary!.average)} · ${fmtDate(x.entry.date)}`,
        })),
    [entries],
  )

  const submit = () => {
    if (!valid) return
    addInterval(
      distanceM,
      filled.map((seconds) => ({ seconds })),
      fromDateInputValue(date),
      parseTime(rest) ?? undefined,
    )
    setDistance('')
    setRest('')
    setReps(['', '', '', ''])
    onChange()
  }

  const setRep = (i: number, value: string) =>
    setReps((prev) => prev.map((r, n) => (n === i ? value : r)))

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold">Log an interval session</h2>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">
          One time per rep. Everything else — best, average, pace, fade — comes from them.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[100px] flex-1">
            <label
              htmlFor="interval-distance"
              className="text-[10px] font-black uppercase tracking-widest text-chalk-muted"
            >
              Rep distance (m)
            </label>
            <Input
              id="interval-distance"
              inputMode="numeric"
              placeholder="400"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="min-w-[90px] flex-1">
            <label
              htmlFor="interval-rest"
              className="text-[10px] font-black uppercase tracking-widest text-chalk-muted"
            >
              Rest (optional)
            </label>
            <Input
              id="interval-rest"
              inputMode="numeric"
              placeholder="1:30"
              value={rest}
              onChange={(e) => setRest(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <label
              htmlFor="interval-date"
              className="text-[10px] font-black uppercase tracking-widest text-chalk-muted"
            >
              Date
            </label>
            <Input
              id="interval-date"
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
            {reps.map((value, i) => (
              <div key={i} className="relative">
                <Input
                  id={`interval-rep-${i + 1}`}
                  aria-label={`Rep ${i + 1} time`}
                  inputMode="numeric"
                  placeholder={`Rep ${i + 1}`}
                  value={value}
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
                {filled.length} × {distanceM}m · avg{' '}
                {fmtTime(filled.reduce((n, t) => n + t, 0) / filled.length)}
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Sessions" value={`${stats.sessions}`} />
        <MiniStat
          label="Best rep"
          value={stats.bestRep ? `${fmtTime(stats.bestRep.seconds)}` : '—'}
          tone="volt"
        />
        <MiniStat label="Total" value={`${Number(stats.totalKm.toFixed(1))} km`} />
      </div>
      {stats.bestRep && (
        <p className="-mt-2 px-1 text-[10px] font-semibold text-chalk-faint">
          Best rep was over {stats.bestRep.distanceM} m.
        </p>
      )}

      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold">Average rep pace</h2>
        </div>
        <p className="mb-3 text-[11px] font-semibold text-chalk-faint">
          Minutes per kilometre across the reps. Rep distance moves between sessions, so read it
          alongside what each one was.
        </p>
        {points.length >= 2 ? (
          <LineChart points={points} height={200} color={accent} format={fmtTime} />
        ) : (
          <EmptyBlock
            text={
              points.length === 1
                ? 'One more session and this chart comes alive.'
                : 'No interval sessions logged yet.'
            }
          />
        )}
      </Card>

      <EntryList
        rows={entries.map((e) => {
          const s = summarise(e)
          return {
            id: e.id,
            primary: s ? `${s.reps} × ${e.distanceM}m` : `${e.distanceM}m`,
            secondary: s
              ? `best ${fmtTime(s.best)} · avg ${fmtTime(s.average)}${fadeText(s.fade)} · ${fmtDate(e.date)}`
              : fmtDate(e.date),
          }
        })}
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

// ------------------------------------------------------------------ Runs

function RunsView({
  entries,
  accent,
  onChange,
}: {
  entries: RunEntry[]
  accent: string
  onChange: () => void
}) {
  const stats = runStats(entries)

  const points = useMemo(
    () =>
      [...entries]
        .filter((r) => r.distanceKm > 0 && r.seconds > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((r) => ({
          date: new Date(r.date),
          value: paceOf(r),
          detail: `${fmtPace(paceOf(r))} · ${r.distanceKm} km · ${fmtDate(r.date)}`,
        })),
    [entries],
  )

  return (
    <div className="space-y-4">
      <SessionForm
        idPrefix="run"
        title="Log a run"
        blurb="Pace is worked out from these two, never stored separately."
        icon={<Footprints className="h-4 w-4 text-accent" />}
        distanceLabel="Distance (km)"
        distancePlaceholder="5"
        timePlaceholder="24:30"
        hint={(km, seconds) => `That is ${fmtPace(seconds / km)}`}
        onAdd={(km, seconds, date) => {
          addRun(km, seconds, date)
          onChange()
        }}
      />

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Runs" value={`${stats.runs}`} />
        <MiniStat label="Distance" value={`${Number(stats.totalKm.toFixed(1))} km`} />
        <MiniStat
          label="Best pace"
          value={stats.bestPace ? fmtTime(stats.bestPace) : '—'}
          tone="volt"
        />
      </div>

      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold">Pace</h2>
        </div>
        <p className="mb-3 text-[11px] font-semibold text-chalk-faint">
          Minutes per kilometre. Lower is faster — and pace moves with distance, so read it
          alongside how far each run was.
        </p>
        {points.length >= 2 ? (
          <LineChart points={points} height={200} color={accent} format={fmtTime} />
        ) : (
          <EmptyBlock
            text={
              points.length === 1
                ? 'One more run and this chart comes alive.'
                : 'No runs logged yet.'
            }
          />
        )}
      </Card>

      <EntryList
        rows={entries.map((r) => ({
          id: r.id,
          primary: `${r.distanceKm} km · ${fmtTime(r.seconds)}`,
          secondary: `${fmtPace(paceOf(r))} · ${fmtDate(r.date)}`,
        }))}
        emptyText="Nothing logged yet."
      />
    </div>
  )
}
