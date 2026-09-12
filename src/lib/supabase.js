import { createClient } from '@supabase/supabase-js'

// Public-safe fallbacks (Supabase URL + anon key are designed to be
// visible client-side) — Vercel's project env vars for these aren't
// set, so without a fallback here the app silently builds with
// Supabase completely disabled (auth, workspace, Google connect, and
// theme sync all become no-ops with no visible error).
const url = import.meta.env.VITE_SUPABASE_URL || 'https://cavznviysciikqfmiykq.supabase.co'
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdnpudml5c2NpaWtxZm1peWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODM2MzUsImV4cCI6MjEwMDc1OTYzNX0.LvPLhyJJv8X2o0wykoAEz37t3LSa1tbTCItD_dk2TjQ'

export const supabaseConfigured = Boolean(url && anonKey)

// When Supabase isn't configured, `supabase` below is null and the app
// runs against mock data without crashing on import.
// Explicit auth options (rather than relying on the SDK's defaults) —
// the OAuth/magic-link redirect lands on /app with the session in the
// URL's #hash fragment, and being explicit here avoids a race where
// AuthContext's getSession()/getUser() call can fire before the client
// has finished parsing that fragment into a stored session, which
// surfaces as a confusing "Invalid API key" error on first render.
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'implicit',
      },
    })
  : null
