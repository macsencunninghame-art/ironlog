import { useMemo, useState } from 'react'
import { Footprints, Gauge, Timer, TrendingDown } from 'lucide-react'
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
import { IntervalsLog } from './IntervalsLog'

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
          Lower is faster.
        </p>
        {points.length >= 2 ? (
          <LineChart points={points} height={200} color={accent} format={fmtTime} />
        ) : (
          <EmptyBlock
            text={
              points.length === 1
                ? 'One more test and this chart has something to plot.'
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
  const stats = intervalStats(entries)

  return (
    <IntervalsLog
      idPrefix="interval"
      accent={accent}
      unit="m"
      distanceLabel="Rep distance (m)"
      distancePlaceholder="400"
      repPlaceholder="1:12"
      chartTitle="Average rep pace"
      chartBlurb="Minutes per kilometre across the reps."
      formatRate={fmtTime}
      lowerIsBetter
      rows={entries.map((e) => ({
        id: e.id,
        date: e.date,
        distance: e.distanceM,
        reps: e.reps,
        summary: summarise(e),
      }))}
      stats={[
        { label: 'Sessions', value: `${stats.sessions}` },
        {
          label: 'Best rep',
          value: stats.bestRep ? `${fmtTime(stats.bestRep.seconds)}` : '—',
          tone: 'volt' as const,
        },
        { label: 'Total', value: `${Number(stats.totalKm.toFixed(1))} km` },
      ]}
      onAdd={(distanceM, reps, date, rest) => {
        addInterval(distanceM, reps, date, rest)
        onChange()
      }}
    />
  )
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
        blurb="Distance and time. Pace is derived."
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
          Minutes per kilometre. Lower is faster.
        </p>
        {points.length >= 2 ? (
          <LineChart points={points} height={200} color={accent} format={fmtTime} />
        ) : (
          <EmptyBlock
            text={
              points.length === 1
                ? 'One more run and this chart has something to plot.'
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
