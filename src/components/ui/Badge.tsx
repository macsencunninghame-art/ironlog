import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'warmup' | 'superset' | 'drop' | 'pr' | 'muted' | 'flame'

const tones: Record<Tone, string> = {
  warmup: 'bg-sky-400/10 text-sky-300 border-sky-400/25',
  superset: 'bg-hot/10 text-hot-soft border-hot/30',
  drop: 'bg-violet-400/10 text-violet-300 border-violet-400/25',
  pr: 'bg-volt/15 text-volt border-volt/40',
  muted: 'bg-ink-700 text-chalk-muted border-ink-600',
  flame: 'bg-flame/10 text-flame-soft border-flame/30',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ className, tone = 'muted', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
