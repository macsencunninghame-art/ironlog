import { useMemo } from 'react'
import { fmtPace, fmtTime, runningForEveryone } from '@/lib/running'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/Avatar'
import { cn, fmtSignedPct } from '@/lib/utils'
import { EmptyBlock } from './parts'

export function RunningCompare({ currentPersonId }: { currentPersonId: string }) {
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
          Everyone is measured against their own starting numbers. A positive figure means
          faster, on both the Bronco and on pace.
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
                          {v.pct === null ? 'No data' : fmtSignedPct(v.pct)}
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
