import { cn } from '@/lib/utils'

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (next: T) => void
  className?: string
}

/** Two or three peer views of one page - not navigation, so it does not live in the tab bar. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={cn('flex gap-1 rounded-2xl border border-ink-600 bg-ink-800/60 p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
              active
                ? 'bg-gradient-to-r from-accent/25 to-accent2/15 text-chalk ring-1 ring-accent/30'
                : 'text-chalk-muted hover:text-chalk',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
