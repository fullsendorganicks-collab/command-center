import { supabase, supabaseConfigured } from './supabase'

// Real Google data (Gmail/GA4/Search Console) via the cc-google-data and
// cc-google-oauth-callback edge functions. The browser never sees an
// access/refresh token — only the resulting data.

export const GOOGLE_DATA_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'openid',
  'email',
]

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

// Public-safe value: OAuth Client IDs are designed to be visible
// client-side (unlike the client secret, which never appears here or
// anywhere in this repo). Falls back to the env var when set locally.
const GOOGLE_CLIENT_ID_FALLBACK = '925099673042-6pdj9e5pi2ihvb2nd6otikgj8ointegk.apps.googleusercontent.com'

/**
 * Google requires the redirect_uri sent here to EXACTLY byte-match one of
 * the Authorized redirect URIs registered in Google Cloud Console — a
 * stray trailing slash is enough to trigger a redirect_uri_mismatch (400)
 * error. Centralizing the redirect URI here (instead of each call site
 * building its own from window.location) means there's exactly one place
 * this can go wrong, and it always strips any trailing slash so it
 * matches a registered URI with no trailing slash.
 */
export function getGoogleDataRedirectUri() {
  const origin = window.location.origin
  const path = window.location.pathname.replace(/\/+$/, '') // strip trailing slash(es)
  return origin + path
}

/** Builds the URL to send the browser to Google's consent screen. */
export function buildGoogleDataAuthUrl({ workspaceId, redirectUri }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK
  if (!clientId) {
    throw new Error('Google OAuth is not configured yet (VITE_GOOGLE_CLIENT_ID missing).')
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri || getGoogleDataRedirectUri(),
    response_type: 'code',
    scope: GOOGLE_DATA_SCOPES.join(' '),
    access_type: 'offline', // needed to get a refresh token
    prompt: 'consent',
    state: workspaceId,
  })
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
}

/** Exchanges the ?code=... from Google for tokens, stored server-side via edge function. */
export async function completeGoogleDataConnection({ code, workspaceId, redirectUri }) {
  const { data, error } = await supabase.functions.invoke('cc-google-oauth-callback', {
    body: { code, workspace_id: workspaceId, redirect_uri: redirectUri },
  })
  if (error) {
    const msg = error.context?.error || error.message || 'Google connection failed.'
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export async function hasGoogleConnection(workspaceId) {
  if (!supabaseConfigured || !workspaceId) return false
  const { data, error } = await supabase.rpc('cc_has_google_connection', { p_workspace_id: workspaceId })
  if (error) return false
  return Boolean(data)
}

async function fetchGoogleResource(workspaceId, resource) {
  const { data, error } = await supabase.functions.invoke('cc-google-data', {
    body: { workspace_id: workspaceId, resource },
  })
  if (error) {
    const msg = error.context?.error || error.message || 'Google data request failed.'
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export const getGmailSummary = (workspaceId) => fetchGoogleResource(workspaceId, 'gmail_summary')
export const getSearchConsoleSummary = (workspaceId) => fetchGoogleResource(workspaceId, 'search_console_summary')
export const getGa4Summary = (workspaceId) => fetchGoogleResource(workspaceId, 'ga4_summary')
