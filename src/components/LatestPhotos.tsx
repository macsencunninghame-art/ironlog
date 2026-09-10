import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ImageOff } from 'lucide-react'
import { PEOPLE, personPath, type Person } from '@/lib/people'
import { addPhoto, latestPhotoByPerson, photosAreEphemeral, type Photo } from '@/lib/photos'
import { useObjectUrl } from '@/lib/hooks'
import { relativeDay } from '@/lib/utils'
import { Card } from './ui/Card'
import { CameraCapture } from './CameraCapture'
import { cn } from '@/lib/utils'

/**
 * The most recent photo from every person, with a camera on each tile.
 *
 * Everyone appears whether or not they have a photo: the empty tiles are the
 * invitation to take the first one, and a roster with gaps in it reads as a
 * roster rather than as a bug.
 */
export function LatestPhotos({ className }: { className?: string }) {
  const [latest, setLatest] = useState<Map<string, Photo>>(new Map())
  const [shooting, setShooting] = useState<Person | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLatest(await latestPhotoByPerson())
  }, [])

  useEffect(() => {
    let cancelled = false
    latestPhotoByPerson().then((map) => {
      if (!cancelled) setLatest(map)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCapture = async (person: Person, file: File) => {
    setShooting(null)
    setSaving(person.id)
    setError(null)
    try {
      await addPhoto(person.id, file)
      await refresh()
    } catch {
      setError(`${person.name}'s photo could not be saved.`)
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card className={cn('p-5', className)}>
      <h2 className="text-sm font-bold">Latest photos</h2>
      <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">
        The most recent shot from each person — tap the camera to add one
      </p>

      <div
        className="mt-4 grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
      >
        {PEOPLE.map((person) => (
          <PhotoTile
            key={person.id}
            person={person}
            photo={latest.get(person.id)}
            saving={saving === person.id}
            onShoot={() => setShooting(person)}
          />
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-300">
          {error}
        </p>
      )}

      {photosAreEphemeral() && (
        <p className="mt-3 text-[11px] font-semibold text-amber-200">
          This browser is blocking photo storage, so these will be gone when you close the tab.
        </p>
      )}

      {shooting && (
        <CameraCapture
          title={`Photo for ${shooting.name}`}
          onCapture={(file) => handleCapture(shooting, file)}
          onClose={() => setShooting(null)}
        />
      )}
    </Card>
  )
}

function PhotoTile({
  person,
  photo,
  saving,
  onShoot,
}: {
  person: Person
  photo: Photo | undefined
  saving: boolean
  onShoot: () => void
}) {
  const url = useObjectUrl(photo?.blob ?? null)

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-600/70 bg-ink-900">
      <div className="relative aspect-square w-full max-w-full overflow-hidden bg-ink-800">
        {photo ? (
          <Link
            to={personPath(person.id, '/history')}
            aria-label={`${person.name}'s gallery`}
            className="group block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {url && (
              <img
                src={url}
                alt={`${person.name}'s most recent session photo`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
              />
            )}
          </Link>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-2 text-center">
            <ImageOff className="h-5 w-5 text-chalk-faint" strokeWidth={2} />
            <span className="text-[10px] font-semibold leading-tight text-chalk-faint">
              No photo yet
            </span>
          </div>
        )}

        <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: person.theme.accent }} aria-hidden />

        <button
          type="button"
          onClick={onShoot}
          disabled={saving}
          aria-label={`Take a photo for ${person.name}`}
          className="absolute right-1.5 top-1.5 rounded-xl bg-ink-950/75 p-1.5 text-chalk backdrop-blur-sm transition-colors hover:bg-ink-950 disabled:opacity-50"
        >
          <Camera className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>

      <div className="p-2.5">
        <div className="truncate text-xs font-bold">{person.name}</div>
        <div className="truncate text-[10px] font-semibold text-chalk-faint">
          {saving ? 'Saving…' : photo ? relativeDay(photo.date) : 'Tap the camera'}
        </div>
      </div>
    </div>
  )
}
