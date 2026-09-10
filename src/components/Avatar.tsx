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
 * A monogram disc in the person's accent colours.
 *
 * Drawn rather than loaded: the app ships no image assets and stores nothing on a
 * server, so an uploaded photo would have to live in localStorage alongside the log.
 */
export function Avatar({ person, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-black tracking-tight shadow-lg',
        SIZES[size],
        person.gradient,
        person.fg,
        person.glow,
        className,
      )}
    >
      {person.initials}
    </span>
  )
}
