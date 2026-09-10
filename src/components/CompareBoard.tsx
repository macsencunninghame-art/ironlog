import { useMemo } from 'react'
import { Info, Users } from 'lucide-react'
import { MUSCLE_GROUPS } from '@/lib/routine'
import { compareEveryone, type PersonProgress } from '@/lib/compare'
import { Card } from './ui/Card'
import { Avatar } from './Avatar'
import { cn } from '@/lib/utils'

/** Signed percentage, always with its sign so a gain never reads as a plain number. */
function fmtPct(pct: number): string {
  const rounded = Math.abs(pct) < 10 ? pct.toFixed(1) : Math.round(pct).toString()
  return `${pct >= 0 ? '+' : ''}${rounded}%`
}

function toneFor(pct: number | null): string {
  if (pct === null) return 'text-chalk-faint'
  if (pct > 0.5) return 'text-volt'
  if (pct < -0.5) return 'text-red-300'
  return 'text-chalk-muted'
}

export function CompareBoard({ currentPersonId }: { currentPersonId: string }) {
  const everyone = useMemo(() => compareEveryone(), [])
  const anyData = everyone.some((p) => p.overallPct !== null)

  return (
    <div className="space-y-5">
      <Card className="flex items-start gap-3 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-chalk-faint" />
        <p className="text-[11px] leading-relaxed text-chalk-muted">
          Everyone is measured against <strong className="text-chalk">their own</strong> starting
          numbers, so being stronger is not the same as improving. Each lift is compared from the
          first session it appears in to the most recent, and those are averaged by movement
          pattern — you do not need to be doing the same exercises to compare.
        </p>
      </Card>

      {!anyData ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-700/70">
            <Users className="h-6 w-6 text-chalk-faint" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-black tracking-tight">Nothing to compare yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-chalk-muted">
              A lift needs two logged sessions before it shows any progression. Once at least one
              person has trained the same exercise twice, this fills in.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <h2 className="text-sm font-bold">Overall progression</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">
              Across every lift with two or more sessions
            </p>
            <div className="mt-4 space-y-2">
              {everyone.map((row) => (
                <PersonRow key={row.person.id} row={row} current={row.person.id === currentPersonId} />
              ))}
            </div>
          </Card>

          {MUSCLE_GROUPS.map(({ id, name }) => {
            const rows = everyone.map((p) => ({
              progress: p,
              group: p.groups.find((g) => g.group === id)!,
            }))
            const max = Math.max(
              ...rows.map((r) => Math.abs(r.group.changePct ?? 0)),
              1, // keeps a lone tiny result from filling the bar
            )

            return (
              <Card key={id} className="p-5">
                <h2 className="text-sm font-bold">{name}</h2>
                <div className="mt-3 space-y-3">
                  {rows.map(({ progress, group }) => (
                    <div key={progress.person.id} className="flex items-center gap-3">
                      <Avatar person={progress.person} size="sm" className="h-8 w-8 text-[10px]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={cn(
                              'truncate text-xs font-bold',
                              progress.person.id === currentPersonId ? 'text-chalk' : 'text-chalk-muted',
                            )}
                          >
                            {progress.person.name}
                          </span>
                          <span className={cn('num text-xs font-black', toneFor(group.changePct))}>
                            {group.changePct === null ? 'No data' : fmtPct(group.changePct)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              (group.changePct ?? 0) < 0 ? 'bg-red-400/70' : 'bg-volt',
                            )}
                            style={{
                              width: `${Math.min(100, (Math.abs(group.changePct ?? 0) / max) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] font-semibold text-chalk-faint">
                  {rows
                    .filter((r) => r.group.exercises > 0)
                    .map((r) => `${r.progress.person.name}: ${r.group.exercises} lift${r.group.exercises === 1 ? '' : 's'}`)
                    .join(' · ') || 'No lifts logged twice yet'}
                </p>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}

function PersonRow({ row, current }: { row: PersonProgress; current: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl p-3',
        current ? 'bg-accent/10 ring-1 ring-accent/25' : 'bg-ink-900/50',
      )}
    >
      <Avatar person={row.person} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">
          {row.person.name}
          {current && <span className="ml-1.5 text-[10px] font-bold text-accent">you</span>}
        </div>
        <div className="text-[11px] font-semibold text-chalk-faint">
          {row.sessions} session{row.sessions === 1 ? '' : 's'}
        </div>
      </div>
      <span className={cn('num shrink-0 text-lg font-black', toneFor(row.overallPct))}>
        {row.overallPct === null ? '—' : fmtPct(row.overallPct)}
      </span>
    </div>
  )
}
