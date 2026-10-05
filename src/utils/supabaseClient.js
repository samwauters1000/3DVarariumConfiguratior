// Supabase client for the optional login (see "Login for repeat users" in PLAN.md).
//
// The project URL and anon key come from `.env` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
// The anon key is public by design; security comes from row level security in the database.
// Without these variables sign-in is simply "not connected yet" and everything else keeps
// working. The library is only downloaded when sign-in is actually configured.

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isAuthConfigured = Boolean(url && anonKey)

let clientPromise = null

export function getSupabase() {
  if (!isAuthConfigured) return Promise.resolve(null)
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, anonKey, {
      auth: {
        // PKCE: the sign-in result comes back as a `?code=` query, so it never clashes with
        // share links in the hash (`#design=...`).
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }),
  )
  return clientPromise
}

// Where Google and magic links send the user back to (this page, including the base path).
export const getRedirectUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}`
