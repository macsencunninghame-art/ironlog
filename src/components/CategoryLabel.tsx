import { Dumbbell, Sparkles, Target, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import { CATEGORY_NAMES, type Category } from '@/lib/routine'
import { cn } from '@/lib/utils'
import { Badge } from './ui/Badge'

const icons: Record<Category, typeof Sparkles> = {
  skill: Sparkles,
  main: Dumbbell,
  structural: Wrench,
  isolation: Target,
}

/**
 * The one place a category turns into something you can see.
 *
 * Skill is the only category that gets the accent: it is practice rather than
 * prescribed work, and the point of labelling it is to keep it visually apart
 * from the resistance training. The other three share the muted tone so a day
 * reads as one list rather than four competing colours - no new colours enter
 * the palette either way.
 */
export function CategoryBadge({ category }: { category: Category }) {
  const Icon = icons[category]
  return (
    <Badge tone={category === 'skill' ? 'accent' : 'muted'}>
      <Icon className="h-2.5 w-2.5" />
      {CATEGORY_NAMES[category]}
    </Badge>
  )
}

/** Section heading above a run of exercises that share a category. */
export function CategoryHeading({
  category,
  count,
  className,
  children,
}: {
  category: Category
  count?: number
  className?: string
  children?: ReactNode
}) {
  const Icon = icons[category]
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon
        className={cn('h-3.5 w-3.5 shrink-0', category === 'skill' ? 'text-accent' : 'text-chalk-faint')}
        strokeWidth={2.5}
      />
      <span
        className={cn(
          'text-[10px] font-black uppercase tracking-widest',
          category === 'skill' ? 'text-accent' : 'text-chalk-muted',
        )}
      >
        {CATEGORY_NAMES[category]}
      </span>
      {count !== undefined && (
        <span className="num text-[10px] font-bold text-chalk-faint">{count}</span>
      )}
      <span
        className={cn(
          'h-px flex-1',
          category === 'skill' ? 'bg-accent/25' : 'bg-ink-600/70',
        )}
      />
      {children}
    </div>
  )
}
