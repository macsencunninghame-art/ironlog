import type { LucideIcon } from 'lucide-react'
import { Card } from './ui/Card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  unit?: string
  hint?: string
  icon: LucideIcon
  tone?: 'accent' | 'accent2' | 'volt' | 'chalk'
}

const tones = {
  accent: { icon: 'text-accent bg-accent/12', value: 'text-chalk' },
  accent2: { icon: 'text-accent2 bg-accent2/12', value: 'text-chalk' },
  volt: { icon: 'text-volt bg-volt/12', value: 'text-volt' },
  chalk: { icon: 'text-chalk-muted bg-ink-700', value: 'text-chalk' },
}

export function StatCard({ label, value, unit, hint, icon: Icon, tone = 'accent' }: StatCardProps) {
  const t = tones[tone]
  return (
    <Card className="p-4">
      <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-xl', t.icon)}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn('num text-2xl font-black leading-none tracking-tight', t.value)}>{value}</span>
        {unit && <span className="text-xs font-bold text-chalk-muted">{unit}</span>}
      </div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-chalk-muted">
        {label}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-chalk-faint">{hint}</div>}
    </Card>
  )
}
