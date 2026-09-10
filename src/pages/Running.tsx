import { useMemo, useState } from 'react'
import { Footprints, Gauge, Timer, Trash2, TrendingDown } from 'lucide-react'
import type { BroncoEntry, RunEntry } from '@/types'
import {
  addBronco,
  addRun,
  broncoStats,
  deleteBronco,
  deleteRun,
  fmtPace,
  fmtTime,
  getBroncos,
  getRuns,
  paceOf,
  parseTime,
  runStats,
  runningForEveryone,
} from '@/lib/running'
import { usePerson } from '@/components/PersonScope'
import { fmtDate, fromDateInputValue, toDateInputValue } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Segmented } from '@/components/ui/Segmented'
import { LineChart } from '@/components/charts/LineChart'
import { Avatar } from '@/components/Avatar'
import { cn } from '@/lib/utils'

type View = 'bronco' | 'runs' | 'compare'

/** The Bronco is a fixed test, so its shape can be stated rather than configured. */
const BRONCO_BLURB = '5 × (20-40-60 m shuttles) · 1200 m · lower is better'

export function Running() {
  const { person } = usePerson()
  const [view, setView] = useState<View>('bronco')
  const [version, setVersion] = useState(0)

  const broncos = useMemo(() => getBroncos(), [version])
  const runs = useMemo(() => getRuns(), [version])
  const bump = () => setVersion((v) => v + 1)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Running</h1>
        <p className="mt-0.5 text-sm text-chalk-muted">
          Bronco tests and runs. Kept apart from lifting — here, faster is better.
        </p>
      </div>

      <Segmented
        options={[
          { value: 'bronco', label: 'Bronco' },
          { value: 'runs', label: 'Runs' },
          { value: 'compare', label: 'Compare' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'bronco' && <BroncoView entries={broncos} accent={person.theme.accent} onChange={bump} />}
      {view === 'runs' && <RunsView entries={runs} accent={person.theme.accent} onChange={bump} />}
      {view === 'compare' && <RunningCompare currentPersonId={person.id} />}
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
  const [error, setError] = useState<string | null>(null)

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
    if (seconds === null) {
      setError('Enter a time like 5:42.')
      return
    }
    addBronco(seconds, fromDateInputValue(date))
    setTime('')
    setError(null)
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
            <label htmlFor="bronco-time" className="text-[10px] font-black uppercase tracking-widest text-chalk-muted">
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
            <label htmlFor="bronco-date" className="text-[10px] font-black uppercase tracking-widest text-chalk-muted">
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
        {error && <p className="mt-2 text-[11px] font-semibold text-red-300">{error}</p>}
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Best" value={stats.best ? fmtTime(stats.best.seconds) : '—'} tone="volt" />
        <MiniStat label="Latest" value={stats.latest ? fmtTime(stats.latest.seconds) : '—'} />
        <MiniStat
          label="Faster by"
          value={stats.improvedPct === null ? '—' : `${stats.improvedPct >= 0 ? '' : '−'}${Math.abs(stats.improvedPct).toFixed(1)}%`}
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
          <EmptyBlock text={points.length === 1 ? 'One more test and this chart comes alive.' : 'No Broncos logged yet.'} />
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
        onDelete={(id) => {
          deleteBronco(id)
          onChange()
        }}
      />
    </div>
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
  const [distance, setDistance] = useState('')
  const [time, setTime] = useState('')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [error, setError] = useState<string | null>(null)

  const stats = runStats(entries)
  const km = Number(distance)
  const seconds = parseTime(time)
  const valid = seconds !== null && Number.isFinite(km) && km > 0

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

  const submit = () => {
    if (!valid) {
      setError('Enter a distance in km and a time like 24:30.')
      return
    }
    addRun(km, seconds!, fromDateInputValue(date))
    setDistance('')
    setTime('')
    setError(null)
    onChange()
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Footprints className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold">Log a run</h2>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">
          Pace is worked out from these two, never stored separately.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[90px] flex-1">
            <label htmlFor="run-distance" className="text-[10px] font-black uppercase tracking-widest text-chalk-muted">
              Distance (km)
            </label>
            <Input
              id="run-distance"
              inputMode="decimal"
              placeholder="5"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="min-w-[90px] flex-1">
            <label htmlFor="run-time" className="text-[10px] font-black uppercase tracking-widest text-chalk-muted">
              Time
            </label>
            <Input
              id="run-time"
              inputMode="numeric"
              placeholder="24:30"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <label htmlFor="run-date" className="text-[10px] font-black uppercase tracking-widest text-chalk-muted">
              Date
            </label>
            <Input
              id="run-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={submit} disabled={!valid}>
            Add
          </Button>
        </div>
        {valid && (
          <p className="num mt-2 text-[11px] font-bold text-accent">
            That is {fmtPace(seconds! / km)}
          </p>
        )}
        {error && <p className="mt-2 text-[11px] font-semibold text-red-300">{error}</p>}
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Runs" value={`${stats.runs}`} />
        <MiniStat label="Distance" value={`${Number(stats.totalKm.toFixed(1))} km`} />
        <MiniStat label="Best pace" value={stats.bestPace ? fmtTime(stats.bestPace) : '—'} tone="volt" />
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
          <EmptyBlock text={points.length === 1 ? 'One more run and this chart comes alive.' : 'No runs logged yet.'} />
        )}
      </Card>

      <EntryList
        rows={entries.map((r) => ({
          id: r.id,
          primary: `${r.distanceKm} km · ${fmtTime(r.seconds)}`,
          secondary: `${fmtPace(paceOf(r))} · ${fmtDate(r.date)}`,
        }))}
        emptyText="Nothing logged yet."
        onDelete={(id) => {
          deleteRun(id)
          onChange()
        }}
      />
    </div>
  )
}

// ------------------------------------------------------------------ Compare

function RunningCompare({ currentPersonId }: { currentPersonId: string }) {
  const everyone = useMemo(() => runningForEveryone(), [])

  const rows: { key: string; title: string; note: string; values: { id: string; label: string; pct: number | null; person: (typeof everyone)[number]['person'] }[] }[] = [
    {
      key: 'bronco',
      title: 'Bronco',
      note: 'Percent faster from first test to latest',
      values: everyone.map((e) => ({
        id: e.person.id,
        person: e.person,
        label: e.bronco.best ? fmtTime(e.bronco.best.seconds) : '—',
        pct: e.bronco.improvedPct,
      })),
    },
    {
      key: 'pace',
      title: 'Run pace',
      note: 'Percent faster, first three runs against the last three',
      values: everyone.map((e) => ({
        id: e.person.id,
        person: e.person,
        label: e.run.bestPace ? fmtPace(e.run.bestPace) : '—',
        pct: e.run.improvedPct,
      })),
    },
  ]

  // Most improved first, matching the lifting board. People without enough data
  // sort to the bottom rather than reading as zero.
  for (const row of rows) {
    row.values.sort((a, b) => {
      if (a.pct === null && b.pct === null) return 0
      if (a.pct === null) return 1
      if (b.pct === null) return -1
      return b.pct - a.pct
    })
  }

  const anyData = rows.some((r) => r.values.some((v) => v.pct !== null))

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-[11px] leading-relaxed text-chalk-muted">
          As with lifting, everyone is measured against <strong className="text-chalk">their own</strong>{' '}
          starting numbers — being quicker is not the same as improving. A positive figure always
          means faster, on both the Bronco and on pace.
        </p>
      </Card>

      {!anyData ? (
        <EmptyBlock text="Nothing to compare yet. A Bronco needs two tests, and pace needs two runs." />
      ) : (
        rows.map((row) => {
          const max = Math.max(1, ...row.values.map((v) => Math.abs(v.pct ?? 0)))
          return (
            <Card key={row.key} className="p-5">
              <h2 className="text-sm font-bold">{row.title}</h2>
              <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">{row.note}</p>

              <div className="mt-4 space-y-3">
                {row.values.map((v) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <Avatar person={v.person} size="sm" className="h-8 w-8 text-[10px]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            'truncate text-xs font-bold',
                            v.id === currentPersonId ? 'text-chalk' : 'text-chalk-muted',
                          )}
                        >
                          {v.person.name}
                          <span className="num ml-2 font-semibold text-chalk-faint">{v.label}</span>
                        </span>
                        <span
                          className={cn(
                            'num text-xs font-black',
                            v.pct === null ? 'text-chalk-faint' : v.pct > 0 ? 'text-volt' : v.pct < 0 ? 'text-red-300' : 'text-chalk-muted',
                          )}
                        >
                          {v.pct === null
                            ? 'No data'
                            : `${v.pct >= 0 ? '+' : '−'}${Math.abs(v.pct).toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (Math.abs(v.pct ?? 0) / max) * 100)}%`,
                            background: `linear-gradient(90deg, ${v.person.theme.accent}, ${v.person.theme.accent2})`,
                            opacity: (v.pct ?? 0) < 0 ? 0.45 : 1,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}

// ------------------------------------------------------------------ shared bits

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'volt' }) {
  return (
    <Card className="p-3">
      <div className={cn('num text-lg font-black', tone === 'volt' ? 'text-volt' : 'text-chalk')}>
        {value}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-chalk-faint">{label}</div>
    </Card>
  )
}

function EntryList({
  rows,
  emptyText,
  onDelete,
}: {
  rows: { id: string; primary: string; secondary: string; best?: boolean }[]
  emptyText: string
  onDelete: (id: string) => void
}) {
  const [confirming, setConfirming] = useState<string | null>(null)

  if (!rows.length) return <EmptyBlock text={emptyText} />

  return (
    <Card className="divide-y divide-ink-600/40">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <div className="num flex items-center gap-2 text-sm font-bold">
              {row.primary}
              {row.best && (
                <span className="rounded-md bg-volt/15 px-1.5 py-0.5 text-[10px] font-black text-volt">
                  PB
                </span>
              )}
            </div>
            <div className="text-[11px] font-semibold text-chalk-faint">{row.secondary}</div>
          </div>
          {confirming === row.id ? (
            <div className="flex gap-1.5">
              <Button size="sm" variant="danger" onClick={() => onDelete(row.id)}>
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(row.id)}
              aria-label={`Delete ${row.primary}`}
              className="rounded-xl p-2 text-chalk-faint hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </Card>
  )
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-ink-600 px-6 py-10 text-center">
      <p className="max-w-[260px] text-xs font-medium text-chalk-faint">{text}</p>
    </div>
  )
}
