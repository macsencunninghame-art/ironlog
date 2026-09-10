import type { Person } from '@/lib/people'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: 'h-9 w-9 text-[11px]',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-2xl',
} as const

interface AvatarProps {
  person: Person
  size?: keyof typeof SIZES
  className?: string
}

/**
 * A monogram disc in the person's own colours.
 *
 * Painted from the theme inline rather than through accent classes, because the
 * picker shows every person at once and each disc needs its own colours there,
 * not the accent of whatever section is in scope.
 *
 * Drawn rather than loaded: the app ships no image assets and stores nothing on a
 * server, so an uploaded photo would have to live in the browser alongside the log.
 */
export function Avatar({ person, size = 'md', className }: AvatarProps) {
  const { accent, accent2, fg } = person.theme
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-black tracking-tight',
        SIZES[size],
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${accent}, ${accent2})`,
        color: fg,
        boxShadow: `0 10px 24px -8px ${accent}66`,
      }}
    >
      {person.initials}
    </span>
  )
}
