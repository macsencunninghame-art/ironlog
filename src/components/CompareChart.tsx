import React, { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { MUSCLE_GROUPS } from '@/lib/routine'
import { compareEveryone } from '@/lib/compare'
import { Card } from './ui/Card'
import { cn, fmtSignedPct } from '@/lib/utils'

/**
 * Everyone's progression side by side, by movement pattern.
 *
 * Bars are coloured by person and share one scale across every group, so a bar
 * twice as long really does mean twice the improvement - within a group and
 * between them. Length is magnitude; the sign lives in the label, because
 * recolouring a bar red would collide with the colour that identifies the person.
 */
interface CompareChartProps {
  className?: string
  /** Drop the surrounding card and heading, for a page that already provides them. */
  bare?: boolean
}

export function CompareChart({ className, bare = false }: CompareChartProps) {
  const everyone = useMemo(() => compareEveryone(), [])
  const withData = everyone.filter((p) => p.overallPct !== null)

  const max = useMemo(
    () =>
      Math.max(
        1,
        ...everyone.flatMap((p) => p.groups.map((g) => Math.abs(g.changePct ?? 0))),
      ),
    [everyone],
  )

  const Frame = bare ? BareFrame : CardFrame

  return (
    <Frame className={className}>
      {!bare && (
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Who&apos;s improving</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">
              Change against each person&apos;s own starting numbers
            </p>
          </div>
          <TrendingUp className="h-4 w-4 shrink-0 text-chalk-faint" />
        </div>
      )}

      {withData.length === 0 ? (
        <p className={cn('text-xs leading-relaxed text-chalk-muted', !bare && 'mt-4')}>
          Nothing to compare yet — a lift needs two logged sessions before it shows any
          progression.
        </p>
      ) : (
        <>
          {/* Legend, since the bars are identified by colour alone. */}
          <div className={cn('flex flex-wrap gap-x-4 gap-y-1', bare ? 'mb-1' : 'mt-3')}>
            {withData.map(({ person, overallPct }) => (
              <div key={person.id} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: person.theme.accent }}
                />
                <span className="text-[11px] font-bold text-chalk-muted">{person.name}</span>
                <span className="num text-[11px] font-black text-chalk">
                  {fmtSignedPct(overallPct!)}
                </span>
              </div>
            ))}
          </div>

          <div className={cn('space-y-4', bare ? 'mt-3' : 'mt-4')}>
            {MUSCLE_GROUPS.map(({ id, name }) => {
              const rows = withData
                .map((p) => ({ person: p.person, group: p.groups.find((g) => g.group === id)! }))
                .filter((r) => r.group.changePct !== null)

              return (
                <div key={id}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-chalk-faint">
                    {name}
                  </div>
                  {rows.length === 0 ? (
                    <p className="mt-1 text-[11px] font-semibold text-chalk-faint">No data yet</p>
                  ) : (
                    <div className="mt-1.5 space-y-1.5">
                      {rows.map(({ person, group }) => {
                        const pct = group.changePct!
                        return (
                          <div key={person.id} className="flex items-center gap-2">
                            {/* Initials as well as colour, so a row is readable without
                                matching it back to the legend. */}
                            <span
                              className="w-5 shrink-0 text-[10px] font-black"
                              style={{ color: person.theme.accent }}
                            >
                              {person.initials}
                            </span>
                            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-700">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.max(2, (Math.abs(pct) / max) * 100)}%`,
                                  background: `linear-gradient(90deg, ${person.theme.accent}, ${person.theme.accent2})`,
                                  opacity: pct < 0 ? 0.45 : 1,
                                }}
                              />
                            </div>
                            <span
                              className={cn(
                                'num w-14 shrink-0 text-right text-[11px] font-black',
                                pct < 0 ? 'text-red-300' : 'text-chalk',
                              )}
                            >
                              {fmtSignedPct(pct)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </Frame>
  )
}

function CardFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return <Card className={cn('p-5', className)}>{children}</Card>
}

function BareFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>
}
