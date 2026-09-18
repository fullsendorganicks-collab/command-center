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
    // Same fix as fetchGoogleResource below: error.context is a Response,
    // not a parsed body — must be awaited via .json().
    let body = null
    try { body = await error.context?.json?.() } catch { /* body wasn't JSON */ }
    const msg = body?.error || error.message || 'Google connection failed.'
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
    // error.context on a FunctionsHttpError is the raw fetch Response, not
    // a parsed body — supabase-js does not parse it for you (see its own
    // FunctionsClient.js doc comment: `await error.context.json()`).
    // Treating context as an already-parsed object silently swallowed
    // reauth_required on every call, which is why a revoked Google token
    // kept showing a dead-end error instead of a Connect button.
    let body = null
    try { body = await error.context?.json?.() } catch { /* body wasn't JSON */ }
    const msg = body?.error || error.message || 'Google data request failed.'
    const err = new Error(msg)
    if (body?.reauth_required) err.reauthRequired = true
    throw err
  }
  if (data?.error) {
    const err = new Error(data.error)
    if (data.reauth_required) err.reauthRequired = true
    throw err
  }
  return data
}

async function fetchGoogleResourceWithParams(workspaceId, resource, params) {
  const { data, error } = await supabase.functions.invoke('cc-google-data', {
    body: { workspace_id: workspaceId, resource, ...params },
  })
  if (error) {
    let body = null
    try { body = await error.context?.json?.() } catch { /* body wasn't JSON */ }
    const msg = body?.error || error.message || 'Google data request failed.'
    const err = new Error(msg)
    if (body?.reauth_required) err.reauthRequired = true
    throw err
  }
  if (data?.error) {
    const err = new Error(data.error)
    if (data.reauth_required) err.reauthRequired = true
    throw err
  }
  return data
}

export const getGmailSummary = (workspaceId) => fetchGoogleResource(workspaceId, 'gmail_summary')
export const getSearchConsoleSummary = (workspaceId) => fetchGoogleResource(workspaceId, 'search_console_summary')

/**
 * GA4's Data API (what actually returns sessions/users/bounce rate) is
 * read by numeric Property ID, NOT the "G-XXXXXXXXXX" Measurement ID
 * gtag.js uses to send data in — different IDs, same GA4 property, two
 * different purposes. property_id here must be the numeric one.
 */
export const getGa4Summary = (workspaceId, propertyId) =>
  fetchGoogleResourceWithParams(workspaceId, 'ga4_summary', { property_id: propertyId })

/** A GA4 Property ID is numeric only — a "G-..." value is a Measurement ID (used by gtag.js to send data), not what the Data API reads from. */
export function isValidGa4PropertyId(value) {
  return /^\d+$/.test(String(value || '').trim())
}

/**
 * GA4 needs a per-site numeric Property ID (found in GA4 Admin > Property
 * Settings) before any traffic data can be fetched — there's no way to
 * look this up automatically, the user has to paste it in themselves.
 * Stored on cc_properties.analytics_source_id (see schema).
 */
export async function saveGa4PropertyId(propertyId, analyticsSourceId) {
  const { error } = await supabase
    .from('cc_properties')
    .update({ analytics_source_id: analyticsSourceId })
    .eq('id', propertyId)
  if (error) throw error
}
