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

/** Builds the URL to send the browser to Google's consent screen. */
export function buildGoogleDataAuthUrl({ workspaceId, redirectUri }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('Google OAuth is not configured yet (VITE_GOOGLE_CLIENT_ID missing).')
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
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
