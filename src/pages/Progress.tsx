import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { BarChart3, LineChart as LineIcon, Trophy } from 'lucide-react'
import { allTrackedExercises } from '@/lib/routine'
import { usePerson } from '@/components/PersonScope'
import { NoRoutine } from '@/components/NoRoutine'
import { exerciseSeries, exercisesWithData, getPR, weeklyVolume } from '@/lib/stats'
import { getWorkouts } from '@/lib/workouts'
import { fmtKg, fmtShortDate, fmtVolume } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'

type Metric = 'weight' | 'e1rm'

export function Progress() {
  const { person, routine } = usePerson()
  const workouts = useMemo(() => getWorkouts(), [])
  const withData = useMemo(() => exercisesWithData(workouts), [workouts])
  const exercises = allTrackedExercises(routine)

  // Hooks must run before any early return, so this tolerates an empty routine.
  const firstWithData = exercises.find((e) => withData.has(e.id))?.id ?? exercises[0]?.id ?? ''
  const [exerciseId, setExerciseId] = useState(firstWithData)
  const [metric, setMetric] = useState<Metric>('weight')

  const selected = exercises.find((e) => e.id === exerciseId)
  const pr = getPR(workouts, exerciseId)

  const series = useMemo(() => {
    const points = exerciseSeries(workouts, exerciseId)
    return points.map((p) => ({
      date: p.date,
      value: selected?.bodyweight ? p.reps : metric === 'weight' ? p.weight : p.e1rm,
      detail: selected?.bodyweight
        ? `${p.reps} reps · ${fmtShortDate(p.date.toISOString())}`
        : `${fmtKg(p.weight)} kg x ${p.reps} · ${fmtShortDate(p.date.toISOString())}`,
    }))
  }, [workouts, exerciseId, metric, selected])

  const weeks = useMemo(() => weeklyVolume(workouts, 12), [workouts])
  const volumeData = weeks.map((w) => ({
    label: fmtShortDate(w.start.toISOString()),
    value: w.volume,
    detail: `${w.sessions} session${w.sessions === 1 ? '' : 's'}`,
  }))
  const hasVolume = weeks.some((w) => w.volume > 0)

  // After the hooks above, so the hook order stays identical either way.
  if (!routine.length) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Progress</h1>
          <p className="mt-0.5 text-sm text-chalk-muted">Every number here is one you lifted.</p>
        </div>
        <NoRoutine name={person.name} action="chart" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Progress</h1>
        <p className="mt-0.5 text-sm text-chalk-muted">Every number here is one you lifted.</p>
      </div>

      {/* Exercise progression */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <LineIcon className="h-4 w-4 text-flame" />
          <h2 className="text-sm font-bold">Exercise progression</h2>
        </div>

        <Select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
              {withData.has(ex.id) ? '' : ' — no data yet'}
            </option>
          ))}
        </Select>

        {!selected?.bodyweight && (
          <div className="mt-3 flex gap-2">
            <MetricTab active={metric === 'weight'} onClick={() => setMetric('weight')}>
              Top set
            </MetricTab>
            <MetricTab active={metric === 'e1rm'} onClick={() => setMetric('e1rm')}>
              Est. 1RM
            </MetricTab>
          </div>
        )}

        {pr && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-volt/25 bg-volt/8 px-3 py-2">
            <Trophy className="h-4 w-4 shrink-0 text-volt" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-chalk-muted">
              Personal record
            </span>
            <span className="num ml-auto text-sm font-black text-volt">
              {pr.bodyweight
                ? `${pr.topSetReps} reps`
                : `${fmtKg(pr.topSetWeight)} kg x ${pr.topSetReps}`}
            </span>
          </div>
        )}

        <div className="mt-4">
          {series.length >= 2 ? (
            <LineChart
              points={series}
              height={260}
              color="#FF6B18"
              suffix={selected?.bodyweight ? 'reps' : 'kg'}
            />
          ) : (
            <Empty
              text={
                series.length === 1
                  ? 'One session logged. Log this lift again to draw the line.'
                  : 'No sessions logged for this lift yet.'
              }
            />
          )}
        </div>
      </Card>

      {/* Weekly volume */}
      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-hot" />
          <h2 className="text-sm font-bold">Weekly volume</h2>
        </div>
        <p className="mb-4 text-[11px] font-semibold text-chalk-faint">
          Last 12 weeks · weight x reps on completed sets
        </p>

        {hasVolume ? (
          <>
            <BarChart data={volumeData} height={240} />
            <div className="num mt-3 flex justify-between border-t border-ink-600/50 pt-3 text-[11px] font-bold text-chalk-muted">
              <span>
                Best week{' '}
                <span className="text-chalk">
                  {fmtVolume(Math.max(...weeks.map((w) => w.volume)))} kg
                </span>
              </span>
              <span>
                Total{' '}
                <span className="text-chalk">
                  {fmtVolume(weeks.reduce((n, w) => n + w.volume, 0))} kg
                </span>
              </span>
            </div>
          </>
        ) : (
          <Empty text="No volume yet. Save a session and this fills in." />
        )}
      </Card>
    </div>
  )
}

function MetricTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-xl bg-flame/15 px-3 py-1.5 text-xs font-bold text-flame ring-1 ring-flame/30'
          : 'rounded-xl px-3 py-1.5 text-xs font-bold text-chalk-faint hover:text-chalk-muted'
      }
    >
      {children}
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-ink-600 px-6 py-12 text-center">
      <p className="max-w-[260px] text-xs font-medium text-chalk-faint">{text}</p>
    </div>
  )
}
