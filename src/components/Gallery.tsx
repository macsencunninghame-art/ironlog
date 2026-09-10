import { useEffect, useRef, useState } from 'react'
import { Camera, Download, ImageOff, Trash2, X } from 'lucide-react'
import { addPhoto, deletePhoto, fmtBytes, listPhotos, photosAreEphemeral, totalBytes, type Photo } from '@/lib/photos'
import { dayLabel, type RoutineDay } from '@/lib/routine'
import { fmtDateLong, relativeDay } from '@/lib/utils'
import { useObjectUrl } from '@/lib/hooks'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface GalleryProps {
  personId: string
  personName: string
  routine: RoutineDay[]
}

export function Gallery({ personId, personName, routine }: GalleryProps) {
  const [photos, setPhotos] = useState<Photo[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<Photo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    listPhotos(personId).then((rows) => {
      if (!cancelled) setPhotos(rows)
    })
    return () => {
      cancelled = true
    }
  }, [personId])

  const handleFiles = async (files: FileList) => {
    setBusy(true)
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) await addPhoto(personId, file)
    }
    setPhotos(await listPhotos(personId))
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (id: string) => {
    await deletePhoto(id)
    setPhotos(await listPhotos(personId))
    setOpen(null)
  }

  if (photos === null) {
    return <p className="px-1 py-8 text-center text-xs font-semibold text-chalk-faint">Loading photos…</p>
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">{personName}&apos;s photos</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-chalk-faint">
              {photos.length
                ? `${photos.length} photo${photos.length === 1 ? '' : 's'} · ${fmtBytes(totalBytes(photos))}`
                : 'Nothing yet'}
            </p>
          </div>
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Camera className="h-4 w-4" />
            {busy ? 'Adding…' : 'Add photo'}
          </Button>
          <input
            ref={fileRef}
            id="gallery-file"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-chalk-muted">
          Photos are resized and kept in this browser, separately from your log. They are{' '}
          <strong className="text-chalk">not included in the History backup</strong> — save anything
          you would hate to lose.
          {photosAreEphemeral() && (
            <span className="mt-1 block text-amber-200">
              This browser is blocking photo storage, so these will be gone when you close the tab.
            </span>
          )}
        </p>
      </Card>

      {photos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-700/70">
            <ImageOff className="h-6 w-6 text-chalk-faint" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-black tracking-tight">No photos yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-chalk-muted">
              Add one at the end of a session on the Log page, or straight from here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <Thumb key={photo.id} photo={photo} routine={routine} onOpen={() => setOpen(photo)} />
          ))}
        </div>
      )}

      {open && (
        <Lightbox
          photo={open}
          routine={routine}
          onClose={() => setOpen(null)}
          onDelete={() => handleDelete(open.id)}
        />
      )}
    </div>
  )
}

function Thumb({
  photo,
  routine,
  onOpen,
}: {
  photo: Photo
  routine: RoutineDay[]
  onOpen: () => void
}) {
  const url = useObjectUrl(photo.blob)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-square w-full max-w-full overflow-hidden rounded-2xl border border-ink-600/70 bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {url && (
        <img
          src={url}
          alt={`Session photo from ${fmtDateLong(photo.date)}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
        />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent p-2 text-left">
        <span className="block truncate text-[10px] font-bold text-chalk">
          {relativeDay(photo.date)}
        </span>
        {photo.dayId !== null && (
          <span className="block truncate text-[10px] font-semibold text-chalk-faint">
            {dayLabel(routine, photo.dayId)}
          </span>
        )}
      </span>
    </button>
  )
}

function Lightbox({
  photo,
  routine,
  onClose,
  onDelete,
}: {
  photo: Photo
  routine: RoutineDay[]
  onClose: () => void
  onDelete: () => void
}) {
  const url = useObjectUrl(photo.blob)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{fmtDateLong(photo.date)}</div>
          {photo.dayId !== null && (
            <div className="truncate text-[11px] font-semibold text-chalk-faint">
              {dayLabel(routine, photo.dayId)}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-xl bg-ink-800 p-2 text-chalk-muted hover:text-chalk"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center py-4">
        {url && (
          <img
            src={url}
            alt={`Session photo from ${fmtDateLong(photo.date)}`}
            className="max-h-full max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
        <a
          href={url ?? undefined}
          download={`ironlog-${photo.date.slice(0, 10)}.jpg`}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-ink-600 bg-ink-700 px-3 text-sm font-semibold text-chalk"
        >
          <Download className="h-4 w-4" />
          Save
        </a>
        {confirming ? (
          <>
            <Button size="sm" variant="danger" onClick={onDelete}>
              Delete for good
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
