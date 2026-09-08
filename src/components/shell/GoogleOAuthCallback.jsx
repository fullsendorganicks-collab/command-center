import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { completeGoogleDataConnection, getGoogleDataRedirectUri } from '../../lib/googleData'

/**
 * Rendered when the URL has ?code=...&state=<workspaceId> from Google's
 * OAuth redirect. Completes the token exchange server-side, then cleans
 * the URL so a refresh doesn't try to re-consume the (single-use) code.
 */
export default function GoogleOAuthCallback({ code, workspaceId, onDone }) {
  const [status, setStatus] = useState('working') // working | done | error
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const redirectUri = getGoogleDataRedirectUri()
        await completeGoogleDataConnection({ code, workspaceId, redirectUri })
        if (!cancelled) setStatus('done')
      } catch (e) {
        if (!cancelled) { setError(e.message); setStatus('error') }
      } finally {
        // strip ?code&state from the URL either way, so refreshing doesn't
        // try to reuse a single-use authorization code
        window.history.replaceState({}, '', window.location.pathname)
      }
    })()
    return () => { cancelled = true }
  }, [code, workspaceId])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="hud-card accent-glow w-full max-w-sm p-6 text-center">
        <div className="hud-corner tl" /><div className="hud-corner br" />
        {status === 'working' && (
          <>
            <Loader2 size={32} className="mx-auto mb-3 animate-spin" style={{ color: 'var(--accent-bright)' }} />
            <div className="text-headline text-sm font-medium">Connecting your Google account…</div>
          </>
        )}
        {status === 'done' && (
          <>
            <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: 'var(--lime-bright)' }} />
            <div className="text-headline text-sm font-medium mb-3">Google connected</div>
            <button
              onClick={onDone}
              className="text-xs px-4 py-2 rounded-lg font-semibold text-black"
              style={{ background: 'var(--accent-bright)' }}
            >
              Back to dashboard
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={32} className="mx-auto mb-3" style={{ color: 'var(--red)' }} />
            <div className="text-headline text-sm font-medium mb-1">Connection failed</div>
            <div className="text-body-c text-xs mb-3">{error}</div>
            <button
              onClick={onDone}
              className="text-xs px-4 py-2 rounded-lg font-semibold text-black"
              style={{ background: 'var(--accent-bright)' }}
            >
              Back to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
