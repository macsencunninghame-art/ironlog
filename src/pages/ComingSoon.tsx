import { Construction } from 'lucide-react'
import { usePerson } from '@/components/PersonScope'
import { Card } from '@/components/ui/Card'

interface ComingSoonProps {
  title: string
  /** What the app would need to know before this can be built properly. */
  needs: string
}

/**
 * A named place in the Training section that has no data model yet.
 *
 * Shown rather than hidden so the shape of the section is honest about what it
 * will hold - and says plainly that nothing here records anything, instead of
 * offering a form that quietly goes nowhere.
 */
export function ComingSoon({ title, needs }: ComingSoonProps) {
  const { person } = usePerson()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        <p className="mt-0.5 text-sm text-chalk-muted">Part of {person.name}&apos;s training.</p>
      </div>

      <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-700/70">
          <Construction className="h-6 w-6 text-chalk-faint" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-black tracking-tight">Not built yet</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-chalk-muted">
            {needs}
          </p>
        </div>
      </Card>
    </div>
  )
}

export function Hyrox() {
  return (
    <ComingSoon
      title="Hyrox"
      needs="Nothing is recorded here yet. Hyrox could be logged as whole simulated races, as
        individual stations with their times, or as sessions with splits — they need different data
        behind them, so say which one you want and it can be built to match."
    />
  )
}

export function Tri() {
  return (
    <ComingSoon
      title="Tri"
      needs="Nothing is recorded here yet. Swim, bike and run each want their own distance and time,
        and brick sessions and full races want something different again — say how you train and
        this can be built around it."
    />
  )
}
