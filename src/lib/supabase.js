import { createClient } from '@supabase/supabase-js'

// Public-safe fallbacks (Supabase URL + anon key are designed to be
// visible client-side) — Vercel's project env vars for these aren't
// set, so without a fallback here the app silently builds with
// Supabase completely disabled (auth, workspace, Google connect, and
// theme sync all become no-ops with no visible error).
const url = import.meta.env.VITE_SUPABASE_URL || 'https://cavznviysciikqfmiykq.supabase.co'
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdnpudml5c2NpaWtxZm1peWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODM2MzUsImV4cCI6MjEwMDc1OTYzNX0.LvPLhyJJv8X2o0wykoAEz37t3LSa1tbTCItD_dk2TjQ'

export const supabaseConfigured = Boolean(url && anonKey)

// When Supabase isn't configured yet, export a stub so the app can still
// run against mock data without crashing on import.
export const supabase = supabaseConfigured
  ? createClient(url, anonKey)
  : null
