import { useMemo, useState } from 'react'
import { Bike, Gauge, Waves } from 'lucide-react'
import type { BikeEntry, SwimEntry } from '@/types'
import {
  addBike,
  addSwim,
  bikeSpeed,
  bikeStats,
  fmtSpeed,
  fmtSwimPace,
  getBikes,
  getSwims,
  swimPace,
  swimStats,
} from '@/lib/tri'
import { fmtTime } from '@/lib/running'
import { usePerson } from '@/components/PersonScope'
import { Card } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Segmented'
import { LineChart } from '@/components/charts/LineChart'
import { EntryList, EmptyBlock, MiniStat, SessionForm } from '@/components/training/parts'
import { RunningSections } from '@/components/training/RunningSections'
import { fmtDate, fmtSignedPct } from '@/lib/utils'

type Leg = 'swim' | 'bike' | 'run'

/**
 * The three legs.
 *
 * Run is not a separate log: it reuses the running sections whole, reading and
 * writing the same Broncos, intervals and runs as the Running tab. Somebody who
 * has both tabs sees one set of running, not two halves of one.
 */
export function Tri() {
  const { person } = usePerson()
  const [leg, setLeg] = useState<Leg>('swim')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Tri</h1>
        <p className="mt-0.5 text-sm text-chalk-muted">
          Swim, bike and run. Any leg, on any day.
        </p>
      </div>

      <Segmented
        options={[
          { value: 'swim', label: 'Swim' },
          { value: 'bike', label: 'Bike' },
          { value: 'run', label: 'Run' },
        ]}
        value={leg}
        onChange={setLeg}
      />

      {leg === 'swim' && <SwimView accent={person.theme.accent} />}
      {leg === 'bike' && <BikeView accent={person.theme.accent} />}
      {leg === 'run' && <RunningSections accent={person.theme.accent} compact />}
    </div>
  )
}

// ------------------------------------------------------------------ swim

function SwimView({ accent }: { accent: string }) {
  const [version, setVersion] = useState(0)
  const entries = useMemo(() => getSwims(), [version])
  const stats = swimStats(entries)

  const points = useMemo(
    () =>
      [...entries]
        .filter((s) => s.distanceM > 0 && s.seconds > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((s: SwimEntry) => ({
          date: new Date(s.date),
          value: swimPace(s),
          detail: `${fmtSwimPace(swimPace(s))} · ${s.distanceM} m · ${fmtDate(s.date)}`,
        })),
    [entries],
  )

  return (
    <div className="space-y-4">
      <SessionForm
        idPrefix="swim"
        title="Log a swim"
        blurb="Pace is per 100 m."
        icon={<Waves className="h-4 w-4 text-accent" />}
        distanceLabel="Distance (m)"
        distancePlaceholder="1500"
        timePlaceholder="28:00"
        hint={(m, seconds) => `That is ${fmtSwimPace((seconds / m) * 100)}`}
        onAdd={(m, seconds, date) => {
          addSwim(m, seconds, date)
          setVersion((v) => v + 1)
        }}
      />

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Swims" value={`${stats.swims}`} />
        <MiniStat label="Distance" value={`${Math.round(stats.totalM).toLocaleString()} m`} />
        <MiniStat
          label="Best pace"
          value={stats.bestPace ? fmtTime(stats.bestPace) : '—'}
          tone="volt"
        />
      </div>

      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold">Pace per 100 m</h2>
        </div>
        <p className="mb-3 text-[11px] font-semibold text-chalk-faint">
          Lower is faster.
          {stats.improvedPct !== null && (
            <span className="ml-1 text-chalk-muted">
              {fmtSignedPct(stats.improvedPct)} against your first swims.
            </span>
          )}
        </p>
        {points.length >= 2 ? (
          <LineChart points={points} height={200} color={accent} format={fmtTime} />
        ) : (
          <EmptyBlock
            text={
              points.length === 1
                ? 'One more swim and this chart has something to plot.'
                : 'No swims logged yet.'
            }
          />
        )}
      </Card>

      <EntryList
        rows={entries.map((s) => ({
          id: s.id,
          primary: `${s.distanceM} m · ${fmtTime(s.seconds)}`,
          secondary: `${fmtSwimPace(swimPace(s))} · ${fmtDate(s.date)}`,
        }))}
        emptyText="Nothing logged yet."
      />
    </div>
  )
}

// ------------------------------------------------------------------ bike

function BikeView({ accent }: { accent: string }) {
  const [version, setVersion] = useState(0)
  const entries = useMemo(() => getBikes(), [version])
  const stats = bikeStats(entries)

  const points = useMemo(
    () =>
      [...entries]
        .filter((b) => b.distanceKm > 0 && b.seconds > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((b: BikeEntry) => ({
          date: new Date(b.date),
          value: bikeSpeed(b),
          detail: `${fmtSpeed(bikeSpeed(b))} · ${b.distanceKm} km · ${fmtDate(b.date)}`,
        })),
    [entries],
  )

  return (
    <div className="space-y-4">
      <SessionForm
        idPrefix="bike"
        title="Log a ride"
        blurb="Speed in km/h, not pace."
        icon={<Bike className="h-4 w-4 text-accent" />}
        distanceLabel="Distance (km)"
        distancePlaceholder="40"
        timePlaceholder="1:10:00"
        hint={(km, seconds) => `That is ${fmtSpeed(km / (seconds / 3600))}`}
        onAdd={(km, seconds, date) => {
          addBike(km, seconds, date)
          setVersion((v) => v + 1)
        }}
      />

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Rides" value={`${stats.rides}`} />
        <MiniStat label="Distance" value={`${Number(stats.totalKm.toFixed(1))} km`} />
        <MiniStat
          label="Best speed"
          value={stats.bestSpeed ? fmtSpeed(stats.bestSpeed) : '—'}
          tone="volt"
        />
      </div>

      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold">Speed</h2>
        </div>
        <p className="mb-3 text-[11px] font-semibold text-chalk-faint">
          Kilometres per hour. Higher is faster.
          {stats.improvedPct !== null && (
            <span className="ml-1 text-chalk-muted">
              {fmtSignedPct(stats.improvedPct)} against your first rides.
            </span>
          )}
        </p>
        {points.length >= 2 ? (
          <LineChart
            points={points}
            height={200}
            color={accent}
            format={(v) => `${v.toFixed(1)}`}
          />
        ) : (
          <EmptyBlock
            text={
              points.length === 1
                ? 'One more ride and this chart has something to plot.'
                : 'No rides logged yet.'
            }
          />
        )}
      </Card>

      <EntryList
        rows={entries.map((b) => ({
          id: b.id,
          primary: `${b.distanceKm} km · ${fmtTime(b.seconds)}`,
          secondary: `${fmtSpeed(bikeSpeed(b))} · ${fmtDate(b.date)}`,
        }))}
        emptyText="Nothing logged yet."
      />
    </div>
  )
}
