import { useState } from 'react'
import { usePerson } from '@/components/PersonScope'
import { Segmented } from '@/components/ui/Segmented'
import { RunningSections } from '@/components/training/RunningSections'
import { RunningCompare } from '@/components/training/RunningCompare'

type Tab = 'log' | 'compare'

export function Running() {
  const { person } = usePerson()
  const [tab, setTab] = useState<Tab>('log')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Running</h1>
        <p className="mt-0.5 text-sm text-chalk-muted">
          Broncos, intervals and runs. Any of them, on any day.
        </p>
      </div>

      <Segmented
        options={[
          { value: 'log', label: 'Your running' },
          { value: 'compare', label: 'Compare' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'log' ? (
        <RunningSections accent={person.theme.accent} />
      ) : (
        <RunningCompare currentPersonId={person.id} />
      )}
    </div>
  )
}
