// Google OAuth (Gmail read, GA4 read, Search Console read) for Command Center.
//
// Flow: client clicks "Connect Google" in Settings/Integrations -> redirected
// to Google's own login+consent screen -> comes back to our redirect URI with
// an auth code -> the code is exchanged for tokens SERVER-SIDE (edge function
// cc-google-oauth-callback, not yet deployed) so the client secret and the
// resulting access/refresh tokens never touch the browser. Only a
// cc_connections row (status + which scopes) is visible client-side.
//
// This file only builds the "start the flow" redirect URL — nothing here
// ever handles a client secret or token.

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

// Minimum scopes for: Gmail (read inbox), GA4 (read reporting), Search Console (read).
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'openid',
  'email',
]

export function buildGoogleAuthUrl({ workspaceId, redirectUri }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('Google OAuth is not configured yet (VITE_GOOGLE_CLIENT_ID missing).')
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline', // request a refresh token
    prompt: 'consent',
    state: workspaceId, // ties the callback back to the right workspace
  })
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
}

export const googleOAuthConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
