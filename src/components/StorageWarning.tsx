import { isEphemeral } from '@/lib/storage'
import { cn } from '@/lib/utils'

/** Only shows when localStorage is blocked and data is memory-only. */
export function StorageWarning({ className }: { className?: string }) {
  if (!isEphemeral()) return null
  return (
    <div
      className={cn(
        'rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-200',
        className,
      )}
    >
      This browser is blocking local storage, so anything you log will be lost when you close the tab.
      Export a backup from History if you need to keep it.
    </div>
  )
}
