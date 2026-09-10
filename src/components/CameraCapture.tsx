import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, ImagePlus, RefreshCw, X } from 'lucide-react'
import { Button } from './ui/Button'

interface CameraCaptureProps {
  /** Whose photo this will be, shown so you cannot shoot into the wrong gallery. */
  title: string
  onCapture: (file: File) => void
  onClose: () => void
}

type Facing = 'environment' | 'user'

/**
 * A real camera, not a file picker.
 *
 * `<input capture>` hands the job to the phone's camera app and does nothing at
 * all on a laptop, so this opens a live preview through getUserMedia and takes
 * the frame itself. Where that is unavailable or refused - no camera, permission
 * denied, an insecure origin - it says which, and still offers the file picker
 * rather than dead-ending.
 */
export function CameraCapture({ title, onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [facing, setFacing] = useState<Facing>('environment')
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [shooting, setShooting] = useState(false)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setError(null)

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser cannot open a camera. Serving over HTTPS is required.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setReady(true)
      } catch (err) {
        if (cancelled) return
        const name = err instanceof Error ? err.name : ''
        setError(
          name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow it in your browser settings, or choose a file instead.'
            : name === 'NotFoundError'
              ? 'No camera found on this device.'
              : 'The camera could not be opened.',
        )
      }
    }

    start()
    return () => {
      cancelled = true
      stop()
    }
  }, [facing, stop])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const shoot = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    setShooting(true)

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setShooting(false)
      return
    }
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        setShooting(false)
        if (!blob) {
          setError('The photo could not be captured. Try again.')
          return
        }
        stop()
        onCapture(new File([blob], `ironlog-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.92,
    )
  }

  // Rendered into <body>: a `backdrop-filter` ancestor - Card has one - becomes the
  // containing block for fixed positioning, which would strand this sheet inline
  // inside the card instead of covering the screen.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex flex-col bg-ink-950">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{title}</div>
          <div className="text-[11px] font-semibold text-chalk-faint">
            {error ? 'Camera unavailable' : ready ? 'Ready' : 'Starting camera…'}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="rounded-xl bg-ink-800 p-2 text-chalk-muted hover:text-chalk"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center bg-black">
        {error ? (
          <p className="max-w-xs px-6 text-center text-xs leading-relaxed text-chalk-muted">{error}</p>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full max-h-full w-full max-w-full object-contain"
          />
        )}
      </div>

      <div className="safe-bottom flex items-center justify-center gap-3 px-4 py-4">
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
          Choose file
        </Button>

        <button
          type="button"
          onClick={shoot}
          disabled={!ready || shooting}
          aria-label="Take photo"
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-chalk bg-accent text-accent-fg transition-transform active:scale-95 disabled:opacity-40"
        >
          <Camera className="h-7 w-7" strokeWidth={2.5} />
        </button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          disabled={!!error}
        >
          <RefreshCw className="h-4 w-4" />
          Flip
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file?.type.startsWith('image/')) {
              stop()
              onCapture(file)
            }
          }}
        />
      </div>
    </div>,
    document.body,
  )
}
