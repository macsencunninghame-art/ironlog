import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { parseTime } from '@/lib/running'
import { fromDateInputValue, toDateInputValue } from '@/lib/utils'
import { cn } from '@/lib/utils'

/** Shared furniture for the training logs, so swim, bike, run and intervals look alike. */

export function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'volt'
}) {
  return (
    <Card className="p-3">
      <div className={cn('num text-lg font-black', tone === 'volt' ? 'text-volt' : 'text-chalk')}>
        {value}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-chalk-faint">
        {label}
      </div>
    </Card>
  )
}

export function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-ink-600 px-6 py-10 text-center">
      <p className="max-w-[260px] text-xs font-medium text-chalk-faint">{text}</p>
    </div>
  )
}

export interface EntryRow {
  id: string
  primary: string
  secondary: string
  /** Marks the best entry so far. */
  best?: boolean
}

/** Read-only by design: nothing in IronLog can be deleted from inside the app. */
export function EntryList({ rows, emptyText }: { rows: EntryRow[]; emptyText: string }) {
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
        </div>
      ))}
    </Card>
  )
}

interface SessionFormProps {
  idPrefix: string
  title: string
  blurb: string
  icon: React.ReactNode
  distanceLabel: string
  distancePlaceholder: string
  timePlaceholder: string
  /** Live read-out of the derived figure once both fields are valid, e.g. the pace. */
  hint?: (distance: number, seconds: number) => string
  onAdd: (distance: number, seconds: number, date: Date) => void
}

/**
 * Distance plus time, which is every swim, ride and run.
 *
 * The date is free: a session is filed on whatever day you say, so nothing has to
 * be logged the day it happened and no discipline is tied to a day of the week.
 */
export function SessionForm({
  idPrefix,
  title,
  blurb,
  icon,
  distanceLabel,
  distancePlaceholder,
  timePlaceholder,
  hint,
  onAdd,
}: SessionFormProps) {
  const [distance, setDistance] = useState('')
  const [time, setTime] = useState('')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))

  const value = Number(distance)
  const seconds = parseTime(time)
  const valid = seconds !== null && Number.isFinite(value) && value > 0

  const submit = () => {
    if (!valid) return
    onAdd(value, seconds, fromDateInputValue(date))
    setDistance('')
    setTime('')
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">{blurb}</p>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[90px] flex-1">
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
            htmlFor={`${idPrefix}-time`}
            className="text-[10px] font-black uppercase tracking-widest text-chalk-muted"
          >
            Time
          </label>
          <Input
            id={`${idPrefix}-time`}
            inputMode="numeric"
            placeholder={timePlaceholder}
            value={time}
            onChange={(e) => setTime(e.target.value)}
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
        <Button onClick={submit} disabled={!valid}>
          Add
        </Button>
      </div>

      {valid && hint && (
        <p className="num mt-2 text-[11px] font-bold text-accent">{hint(value, seconds)}</p>
      )}
    </Card>
  )
}
