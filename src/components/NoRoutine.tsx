import { ClipboardList } from 'lucide-react'
import { Card } from './ui/Card'

/**
 * Shown wherever a page needs training days and the person has none yet.
 *
 * Routines are hardcoded by design, so the honest answer here is that theirs has
 * not been written - not an invitation to build one from inside the app.
 */
export function NoRoutine({ name, action }: { name: string; action: string }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-700/70">
        <ClipboardList className="h-6 w-6 text-chalk-faint" strokeWidth={2} />
      </span>
      <div>
        <h2 className="text-base font-black tracking-tight">No routine yet</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-chalk-muted">
          {name} has no training days set up, so there is nothing to {action}. Routines are fixed
          in the source: add one to <code className="text-chalk-faint">src/lib/routine.ts</code> and
          assign it in <code className="text-chalk-faint">src/lib/people.ts</code>.
        </p>
      </div>
    </Card>
  )
}
