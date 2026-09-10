import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Native select on purpose - iOS and Android render their own wheel picker,
 * which beats any custom dropdown when you are standing in a gym.
 */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-2xl border border-ink-600 bg-ink-800 px-4 py-3 pr-10',
          'text-sm font-semibold text-chalk',
          'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
          'transition-colors cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-muted"
        aria-hidden
      />
    </div>
  ),
)
Select.displayName = 'Select'
