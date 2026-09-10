import { useEffect, useState } from 'react'

/**
 * A blob URL that lives exactly as long as the component showing it.
 *
 * Creating the URL during render and revoking it in an effect cleanup looks
 * equivalent but breaks under StrictMode's double mount: the first cleanup
 * revokes the URL, the memo does not re-run, and the image is left pointing at
 * a dead handle. Creating and revoking in the same effect keeps the two in step.
 *
 * Null on the first render, so callers should not paint an <img> until it lands.
 */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])

  return url
}
