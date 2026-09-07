import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { ACCENT_PRESETS } from '../data/mockData'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'cc_theme_prefs'

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { theme: 'glass', accent: ACCENT_PRESETS[0].hex, accentBright: ACCENT_PRESETS[0].bright }
}

export function ThemeProvider({ children }) {
  const [prefs, setPrefs] = useState(loadLocal)

  // apply to <html>
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', prefs.theme)
    root.style.setProperty('--accent', prefs.accent)
    root.style.setProperty('--accent-bright', prefs.accentBright)
  }, [prefs])

  // persist locally always; persist to Supabase when configured + authed
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
    if (!supabaseConfigured) return
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('layout_prefs').upsert({
        user_id: user.id,
        theme: prefs.theme,
        accent_color: prefs.accent,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    })()
  }, [prefs])

  // pull remote prefs on mount if available
  useEffect(() => {
    if (!supabaseConfigured) return
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('layout_prefs').select('theme, accent_color').eq('user_id', user.id).maybeSingle()
      if (data) {
        const preset = ACCENT_PRESETS.find(a => a.hex === data.accent_color)
        setPrefs(p => ({ ...p, theme: data.theme, accent: data.accent_color, accentBright: preset?.bright || data.accent_color }))
      }
    })()
  }, [])

  const setTheme = useCallback((theme) => setPrefs(p => ({ ...p, theme })), [])
  const setAccent = useCallback((hex, bright) => setPrefs(p => ({ ...p, accent: hex, accentBright: bright || hex })), [])

  return (
    <ThemeContext.Provider value={{ ...prefs, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
