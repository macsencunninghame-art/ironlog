import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-ink-600 bg-ink-900/80 px-3 py-2',
        'text-chalk placeholder:text-chalk-faint num',
        'focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30',
        'transition-colors',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
