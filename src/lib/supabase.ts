import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The shared database, when one is configured.
 *
 * Both values are public by design - the publishable key is meant to sit in
 * frontend code, and what protects the data is the access rules in
 * `supabase/schema.sql`, not the secrecy of this key.
 *
 * When they are absent the app carries on exactly as before, storing everything
 * on the device and syncing nothing. That is what makes this safe to ship: a
 * missing or wrong key degrades to the old behaviour rather than a broken app.
 *
 * The client library is loaded on demand rather than imported at the top level.
 * It is around 230 KB, it is only ever used by the background sync, and paying
 * for it before the first screen renders would be the wrong trade on a phone.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

export const isShared = Boolean(url && key)

/** Where a person's photos live in the storage bucket. */
export const PHOTO_BUCKET = 'photos'

let pending: Promise<SupabaseClient | null> | null = null

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isShared) return Promise.resolve(null)
  if (!pending) {
    pending = import('@supabase/supabase-js')
      .then(({ createClient }) => createClient(url!, key!, { auth: { persistSession: false } }))
      .catch(() => null)
  }
  return pending
}
