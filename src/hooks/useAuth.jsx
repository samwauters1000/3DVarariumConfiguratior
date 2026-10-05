import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getRedirectUrl, getSupabase, isAuthConfigured } from '../utils/supabaseClient.js'
import { findItem } from '../data/objectCategories.js'
import { getPrerenderedThumbnail } from './useThumbnail.js'

// Optional login. The configurator never requires it; signed-in users will get their saved
// designs in the cloud (planned).
//
// Two kinds of account share one simple profile, so the UI does not care which it is:
// - a real Supabase account (Google or magic link), once `.env` has the project keys;
// - the **test account**: signs in instantly without Supabase, to try out the signed-in
//   experience. It lives only in this browser (localStorage).
//
// The profile: { id, name, email, avatar, isTest, googlePicture }, where avatar is
// { kind: 'initials' } | { kind: 'plant', plantId } | { kind: 'photo', photo } | { kind: 'google' }.
// Errors are thrown as readable English messages.

const AuthContext = createContext(null)
const TEST_ACCOUNT_KEY = 'vararium:test-account' // its settings (kept after signing out)
const TEST_SIGNED_IN_KEY = 'vararium:test-account-signed-in'
const photoKey = (userId) => `vararium:profile-photo:${userId}`

const DEFAULT_TEST_ACCOUNT = {
  id: 'test-account',
  name: 'Test Gardener',
  email: 'test@vararium.app',
  avatar: { kind: 'plant', plantId: 'plant-fittonia' },
  isTest: true,
}

function readJson(key) {
  try {
    const text = window.localStorage.getItem(key)
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function writeJson(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

// A Supabase user as a profile. A custom photo is kept on this device only (large images do
// not belong in the login token); plant pictures and the name are stored in the account.
function profileFromSupabase(user) {
  if (!user) return null
  const meta = user.user_metadata ?? {}
  const googlePicture = meta.avatar_url || meta.picture || null
  const photo = readJson(photoKey(user.id))
  let avatar = { kind: googlePicture ? 'google' : 'initials' }
  if (meta.avatar_kind === 'plant' && meta.avatar_plant) avatar = { kind: 'plant', plantId: meta.avatar_plant }
  else if (meta.avatar_kind === 'photo' && photo) avatar = { kind: 'photo', photo }
  else if (meta.avatar_kind === 'initials') avatar = { kind: 'initials' }
  return {
    id: user.id,
    name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Account',
    email: user.email ?? '',
    avatar,
    googlePicture,
    isTest: false,
  }
}

// After a PKCE sign-in the URL ends with `?code=...`: remove it once the session exists, so a
// refresh or a shared address stays clean (share links in the hash are left alone).
function removeAuthQuery() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('code') && !url.searchParams.has('error_description')) return
  ;['code', 'error', 'error_code', 'error_description'].forEach((name) => url.searchParams.delete(name))
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
}

const readable = (error, fallback) => {
  if (!navigator.onLine) return 'You seem to be offline. Check your connection and try again.'
  return error?.message ? `${fallback} (${error.message})` : fallback
}

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

export function AuthProvider({ children }) {
  const [testAccount, setTestAccount] = useState(() => (readJson(TEST_SIGNED_IN_KEY) ? (readJson(TEST_ACCOUNT_KEY) ?? DEFAULT_TEST_ACCOUNT) : null))
  const [supabaseUser, setSupabaseUser] = useState(null)
  const [loading, setLoading] = useState(isAuthConfigured)
  // Bumped when a device-only photo changes, so the profile is read again.
  const [photoVersion, setPhotoVersion] = useState(0)

  useEffect(() => {
    if (!isAuthConfigured) return undefined
    let subscription = null
    let cancelled = false
    getSupabase()
      .then(async (supabase) => {
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        setSupabaseUser(data.session?.user ?? null)
        setLoading(false)
        removeAuthQuery()
        subscription = supabase.auth.onAuthStateChange((_event, session) => {
          setSupabaseUser(session?.user ?? null)
          removeAuthQuery()
        }).data.subscription
      })
      .catch((error) => {
        console.error('Sign-in could not be started:', error)
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [])

  const user = useMemo(
    () => (testAccount ? { ...DEFAULT_TEST_ACCOUNT, ...testAccount, isTest: true } : profileFromSupabase(supabaseUser)),
    // photoVersion: re-read a device-only photo after it changes.
    [testAccount, supabaseUser, photoVersion], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const value = useMemo(
    () => ({
      user,
      loading: !testAccount && loading,
      isConfigured: isAuthConfigured,

      // Test account: signs in instantly, only in this browser.
      signInWithTestAccount: () => {
        const account = readJson(TEST_ACCOUNT_KEY) ?? DEFAULT_TEST_ACCOUNT
        if (!writeJson(TEST_ACCOUNT_KEY, account) || !writeJson(TEST_SIGNED_IN_KEY, true)) {
          throw new Error('Your browser does not allow saving the test account.')
        }
        setTestAccount(account)
      },

      signInWithGoogle: async () => {
        const supabase = await getSupabase()
        if (!supabase) throw new Error('Sign-in is not connected yet.')
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: getRedirectUrl() } })
        if (error) throw new Error(readable(error, 'Google sign-in did not work. Please try again.'))
      },

      signInWithEmail: async (email) => {
        const supabase = await getSupabase()
        if (!supabase) throw new Error('Sign-in is not connected yet.')
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: getRedirectUrl() } })
        if (error) throw new Error(readable(error, 'The sign-in link could not be sent. Please try again.'))
      },

      // Change the name, email and picture. Returns a message to show (or null).
      updateProfile: async ({ name, email, avatar }) => {
        const cleanName = name.trim()
        const cleanEmail = email.trim()
        if (!cleanName) throw new Error('Enter a name.')
        if (!isValidEmail(cleanEmail)) throw new Error('Enter a valid email address.')

        if (user?.isTest) {
          const next = { ...user, name: cleanName, email: cleanEmail, avatar }
          if (!writeJson(TEST_ACCOUNT_KEY, next)) throw new Error('Your browser could not save the changes. Storage may be full.')
          setTestAccount(next)
          return null
        }

        const supabase = await getSupabase()
        if (!supabase || !user) throw new Error('You are not signed in.')
        if (avatar.kind === 'photo') {
          if (!writeJson(photoKey(user.id), avatar.photo)) throw new Error('Your browser could not save the photo. Storage may be full.')
        }
        const update = {
          data: { full_name: cleanName, avatar_kind: avatar.kind, avatar_plant: avatar.kind === 'plant' ? avatar.plantId : null },
        }
        const emailChanged = cleanEmail !== user.email
        if (emailChanged) update.email = cleanEmail
        const { data, error } = await supabase.auth.updateUser(update, { emailRedirectTo: getRedirectUrl() })
        if (error) throw new Error(readable(error, 'Your changes could not be saved. Please try again.'))
        setSupabaseUser(data.user)
        setPhotoVersion((value) => value + 1)
        return emailChanged ? `We sent a confirmation link to ${cleanEmail}. Your email changes once you open it.` : null
      },

      signOut: async () => {
        if (user?.isTest) {
          // Signing out keeps the test account's settings for next time.
          writeJson(TEST_SIGNED_IN_KEY, null)
          setTestAccount(null)
          return
        }
        const supabase = await getSupabase()
        if (!supabase) return
        const { error } = await supabase.auth.signOut()
        if (error) throw new Error(readable(error, 'Signing out did not work. Please try again.'))
        setSupabaseUser(null)
      },
    }),
    [user, loading, testAccount],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export const getInitials = (name) =>
  (name ?? '')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'

// Picture to show for an avatar setting, or null for initials.
export function getAvatarImage(avatar, googlePicture) {
  if (avatar?.kind === 'photo') return avatar.photo
  if (avatar?.kind === 'plant') return getPrerenderedThumbnail('plants', findItem('plants', avatar.plantId))
  if (avatar?.kind === 'google') return googlePicture
  return null
}
