import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  className?: string
  tone?: 'flame' | 'volt'
}

export function Checkbox({ checked, onChange, label, className, tone = 'flame' }: CheckboxProps) {
  const activeTone =
    tone === 'volt' ? 'bg-volt border-volt text-ink-950' : 'bg-flame border-flame text-white'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flame/50',
        'active:scale-95',
        checked ? activeTone : 'border-ink-500 bg-ink-900/60 text-transparent hover:border-chalk-faint',
        className,
      )}
    >
      <Check className="h-5 w-5" strokeWidth={3.5} />
    </button>
  )
}
