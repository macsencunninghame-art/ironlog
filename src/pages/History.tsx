import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Download, History as HistoryIcon, Upload } from 'lucide-react'
import type { DayId } from '@/types'
import { dayIds } from '@/lib/routine'
import { usePerson } from '@/components/PersonScope'
import { Gallery } from '@/components/Gallery'
import { Segmented } from '@/components/ui/Segmented'
import { downloadBackup, getWorkouts, restoreBackup } from '@/lib/workouts'
import { workoutVolume } from '@/lib/stats'
import { cn, fmtVolume } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SessionCard } from '@/components/SessionCard'

type View = 'sessions' | 'photos'

export function HistoryPage() {
  const { person, routine } = usePerson()
  const [view, setView] = useState<View>('sessions')
  const [version, setVersion] = useState(0)
  const [filter, setFilter] = useState<DayId | 'all'>('all')
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null)
  const [pendingFile, setPendingFile] = useState<{ name: string; raw: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const workouts = useMemo(() => getWorkouts(), [version])
  const visible = filter === 'all' ? workouts : workouts.filter((w) => w.dayId === filter)
  const totalVolume = workouts.reduce((n, w) => n + workoutVolume(w), 0)


  const handleFile = async (file: File) => {
    const raw = await file.text()
    setPendingFile({ name: file.name, raw })
    setNotice(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const confirmRestore = () => {
    if (!pendingFile) return
    const result = restoreBackup(pendingFile.raw)
    setNotice({ ok: result.ok, message: result.message })
    setPendingFile(null)
    if (result.ok) setVersion((v) => v + 1)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">History</h1>
          <p className="num mt-0.5 text-sm text-chalk-muted">
            {workouts.length} session{workouts.length === 1 ? '' : 's'} · {fmtVolume(totalVolume)} kg
            lifted
          </p>
        </div>
      </div>

      <Segmented
        options={[
          { value: 'sessions', label: 'Sessions' },
          { value: 'photos', label: 'Photos' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'photos' ? (
        <Gallery personId={person.id} personName={person.name} routine={routine} />
      ) : (
        <>

      {/* Day filter */}
      <div className="flex gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </FilterChip>
        {dayIds(routine).map((day) => (
          <FilterChip key={day} active={filter === day} onClick={() => setFilter(day)}>
            Day {day}
          </FilterChip>
        ))}
      </div>

      {/* Sessions */}
      {visible.length ? (
        <div className="space-y-3">
          {visible.map((workout) => (
            <SessionCard key={workout.id} workout={workout} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-2 border-dashed py-14 text-center">
          <HistoryIcon className="h-7 w-7 text-chalk-faint" />
          <p className="max-w-[260px] text-xs font-medium text-chalk-faint">
            {workouts.length
              ? 'No sessions logged for this day yet.'
              : 'Nothing here yet. Your first saved session shows up right here.'}
          </p>
        </Card>
      )}

      {/* Backup */}
      <Card className="p-5">
        <h2 className="text-sm font-bold">Backup</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-chalk-muted">
          Everything lives in this browser only. Clearing your browsing data wipes it. Export a copy
          now and again, and keep it somewhere safe. Nothing can be deleted from inside the app —
          importing is the one exception, and it replaces this person&apos;s whole log.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={downloadBackup}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </div>

        {pendingFile && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-amber-200">Replace everything?</p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-200/80">
                  Importing <span className="font-semibold">{pendingFile.name}</span> overwrites all{' '}
                  {workouts.length} logged session{workouts.length === 1 ? '' : 's'} and every 1RM
                  entry. This cannot be undone.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setPendingFile(null)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" onClick={confirmRestore}>
                    Replace my data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {notice && (
          <p
            className={cn(
              'mt-3 rounded-xl px-3 py-2 text-[11px] font-semibold',
              notice.ok ? 'bg-volt/10 text-volt' : 'bg-red-500/10 text-red-300',
            )}
          >
            {notice.message}
          </p>
        )}
      </Card>
        </>
      )}
    </div>
  )
}

function FilterChip({
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
      className={cn(
        'rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95',
        active
          ? 'bg-gradient-to-r from-accent to-accent2 text-white shadow-lg shadow-accent/20'
          : 'border border-ink-600 bg-ink-800/60 text-chalk-muted hover:text-chalk',
      )}
    >
      {children}
    </button>
  )
}
