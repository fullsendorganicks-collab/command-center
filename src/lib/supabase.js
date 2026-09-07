import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

// When Supabase isn't configured yet, export a stub so the app can still
// run against mock data without crashing on import.
export const supabase = supabaseConfigured
  ? createClient(url, anonKey)
  : null
