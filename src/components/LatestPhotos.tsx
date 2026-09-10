import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PEOPLE, personPath } from '@/lib/people'
import { latestPhotoByPerson, type Photo } from '@/lib/photos'
import { useObjectUrl } from '@/lib/hooks'
import { relativeDay } from '@/lib/utils'
import { Card } from './ui/Card'
import { cn } from '@/lib/utils'

/**
 * The most recent photo from each person, on the way in to the app.
 *
 * Hidden entirely until somebody has added one: three empty frames say less than
 * no section at all, and the first photo makes it appear on its own.
 */
export function LatestPhotos({ className }: { className?: string }) {
  const [latest, setLatest] = useState<Map<string, Photo> | null>(null)

  useEffect(() => {
    let cancelled = false
    latestPhotoByPerson().then((map) => {
      if (!cancelled) setLatest(map)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const withPhotos = latest ? PEOPLE.filter((p) => latest.has(p.id)) : []
  if (!latest || withPhotos.length === 0) return null

  return (
    <Card className={cn('p-5', className)}>
      <h2 className="text-sm font-bold">Latest photos</h2>
      <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">
        The most recent shot from each person
      </p>

      <div
        className="mt-4 grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
      >
        {withPhotos.map((person) => (
          <PhotoTile key={person.id} name={person.name} accent={person.theme.accent} photo={latest.get(person.id)!} to={personPath(person.id, '/history')} />
        ))}
      </div>
    </Card>
  )
}

function PhotoTile({
  name,
  accent,
  photo,
  to,
}: {
  name: string
  accent: string
  photo: Photo
  to: string
}) {
  const url = useObjectUrl(photo.blob)

  return (
    <Link
      to={to}
      className="group block overflow-hidden rounded-2xl border border-ink-600/70 bg-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative aspect-square w-full max-w-full overflow-hidden bg-ink-800">
        {url && (
          <img
            src={url}
            alt={`${name}'s most recent session photo`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
          />
        )}
        <span
          className="absolute inset-x-0 bottom-0 h-1"
          style={{ background: accent }}
          aria-hidden
        />
      </div>
      <div className="p-2.5">
        <div className="truncate text-xs font-bold">{name}</div>
        <div className="truncate text-[10px] font-semibold text-chalk-faint">
          {relativeDay(photo.date)}
        </div>
      </div>
    </Link>
  )
}
