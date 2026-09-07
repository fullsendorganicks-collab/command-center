import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(supabaseConfigured)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signInWithMagicLink(email) {
    if (!supabaseConfigured) throw new Error('Supabase is not configured yet.')
    // Explicitly send people back to wherever this app is actually running
    // (window.location.origin) instead of relying on Supabase's Site URL
    // default, which is localhost until changed in the dashboard — without
    // this, the magic link always redirects to localhost regardless of
    // where it was requested from.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signInWithGoogle() {
    if (!supabaseConfigured) throw new Error('Supabase is not configured yet.')
    // No password to set or manage — Google handles auth entirely, and
    // Supabase completes the handshake server-side via the redirect URI
    // registered in Google Cloud Console. Same origin-based redirect
    // reasoning as the magic-link fix: always send back to wherever this
    // app is actually running, not a hardcoded localhost default.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut() {
    if (!supabaseConfigured) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithMagicLink, signInWithGoogle, signOut, configured: supabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
