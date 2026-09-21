import { useEffect, useRef, useState, useCallback } from 'react'
import { Globe, Loader2, X } from 'lucide-react'
import HudCard from '../ui/HudCard'

// A live, interactive remote browser session rendered inside a dashboard
// card — this is what makes "drag a tab in" real instead of a bookmark:
// the backend (remote-browser/server.js) runs an actual Chromium context
// for this tab, streams it as JPEG frames over WebSocket, and this
// component plays those frames into a <canvas> while forwarding the
// user's mouse/keyboard input back to the same session, so it behaves
// like the real site because it is the real site, just running on the
// server instead of the viewer's machine.
//
// VITE_REMOTE_BROWSER_URL / VITE_REMOTE_BROWSER_TOKEN point at that
// backend. Until it's deployed and configured, this card shows a clear
// "not connected" state rather than silently failing.

// `id` drives HudCard's focus/drag-sort identity and must match exactly
// what this card was registered under in DashboardGrid's order/
// SortableContext (the caller's `remote-${tab.id}` prefix). `sessionId`
// is the separate, unprefixed identity the remote-browser backend
// tracks its Chromium context under — deliberately kept as its own prop
// instead of reusing `id`, since collapsing the two together is exactly
// what caused a dropped tab's card to silently never mount (dnd-kit
// registered it under a different id than the grid's SortableContext
// items list expected).
// Render's free web service tier sleeps after ~15 min idle. A cold
// wake-up was measured live (raw WebSocket handshake via curl) at a full
// 60 seconds — long enough that browsers/most WS clients give up with a
// generic error well before the connection ever succeeds, which is why
// "Could not reach the server" fired instantly on every card even though
// the server itself was fine, just slow to wake. WAKE_TIMEOUT_MS is
// deliberately generous (90s) so a real cold start has room to finish;
// PREFLIGHT_POLL_MS drives a visible countdown instead of a silent hang.
const WAKE_TIMEOUT_MS = 90_000
const PREFLIGHT_POLL_MS = 1_000

export default function RemoteBrowserCard({ id, sessionId, title, startUrl, onClose }) {
  const canvasRef = useRef(null)
  const wsRef = useRef(null)
  const imgRef = useRef(new Image())
  const [status, setStatus] = useState('connecting') // waking | connecting | live | error | unconfigured
  const [error, setError] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  // Bumped to force the connect effect to re-run without changing any of
  // its real dependencies — the client-facing "Retry" button for when a
  // session errors out (server was asleep, hit capacity, network blip)
  // and simply trying again is enough, without deleting and re-dragging
  // the whole card back in.
  const [retryKey, setRetryKey] = useState(0)

  const backendUrl = import.meta.env.VITE_REMOTE_BROWSER_URL
  const token = import.meta.env.VITE_REMOTE_BROWSER_TOKEN

  useEffect(() => {
    if (!backendUrl || !token) { setStatus('unconfigured'); return }
    setStatus('waking')
    setError(null)
    setElapsedMs(0)

    let cancelled = false
    let ws = null
    const startedAt = Date.now()
    const tickInterval = setInterval(() => {
      if (!cancelled) setElapsedMs(Date.now() - startedAt)
    }, PREFLIGHT_POLL_MS)

    // The env var this reads (VITE_REMOTE_BROWSER_URL) was stored without
    // a scheme ("cc-remote-browser.onrender.com" instead of
    // "https://cc-remote-browser.onrender.com"), which an earlier
    // backendUrl.replace(/^http/, 'ws') silently no-opped on. Using the
    // URL API instead handles a missing scheme, a trailing slash, or
    // either http/https correctly no matter how the env var is set.
    let httpBase, wsUrl
    try {
      // Strip ANY existing scheme-like prefix before re-adding a clean
      // "https://" — a previous version only checked for a MISSING scheme
      // (/^https?:\/\//) and prepended "https://" when that didn't match,
      // which is exactly what turned a env var that was missing just its
      // leading "h" (stored as "ttps://cc-remote-browser.onrender.com"
      // instead of "https://...") into "https://ttps://..." — confirmed
      // directly in the browser console (net::ERR_NAME_NOT_RESOLVED on
      // that literal string). Stripping whatever scheme-shaped prefix is
      // there first makes this correct no matter how the stored value is
      // mangled, instead of only handling the one case of a fully absent
      // scheme.
      const withoutScheme = backendUrl.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
      httpBase = `https://${withoutScheme}`
      const parsed = new URL(httpBase)
      parsed.protocol = parsed.protocol === 'http:' ? 'ws:' : 'wss:'
      parsed.pathname = '/session'
      parsed.search = new URLSearchParams({ token, sessionId, url: startUrl }).toString()
      wsUrl = parsed.toString()
    } catch (e) {
      clearInterval(tickInterval)
      setStatus('error')
      setError(`Remote browser server URL is misconfigured: ${e.message}`)
      return
    }

    // A pre-flight plain HTTP GET to /health, retried with a generous
    // overall budget, before ever opening the WebSocket. This is what
    // actually solves the cold-start problem: it's what proves the
    // server has finished waking up (Render fully boots the instance to
    // answer any HTTP request, WebSocket included), and it drives a real
    // "waking up… Ns" indicator instead of an opaque hang on the WS
    // handshake itself, which browsers don't expose progress for.
    async function waitForServerAwake() {
      const deadline = Date.now() + WAKE_TIMEOUT_MS
      while (Date.now() < deadline) {
        if (cancelled) return false
        // Render doesn't reject a request instantly while the instance is
        // cold-booting — it holds the single in-flight request open and
        // makes IT wait the full wake time (confirmed live: a plain curl
        // GET took 53-60s and then succeeded). A short per-attempt abort
        // (previously 5s) guarantees every attempt gets killed while the
        // real request is still legitimately in flight and about to
        // succeed — the loop then fires a brand new request, which also
        // gets killed at 5s, forever, so the 90s budget expires having
        // never let a single attempt actually complete. The per-attempt
        // timeout must cover the remaining overall budget, not be
        // artificially short.
        const remaining = deadline - Date.now()
        try {
          const res = await fetch(`${httpBase.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(Math.max(remaining, 1000)) })
          if (res.ok) return true
        } catch { /* not awake yet, or a transient network hiccup — keep polling */ }
        await new Promise(r => setTimeout(r, PREFLIGHT_POLL_MS))
      }
      return false
    }

    ;(async () => {
      const awake = await waitForServerAwake()
      if (cancelled) return
      if (!awake) {
        clearInterval(tickInterval)
        setStatus('error')
        setError(`The remote browser server didn't wake up in time (waited ${Math.round(WAKE_TIMEOUT_MS / 1000)}s). It's likely just slow on this free hosting tier — try again in a moment.`)
        return
      }

      setStatus('connecting')
      ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => setStatus('connecting')
      ws.onerror = () => { if (!cancelled) { setStatus('error'); setError('Could not reach the remote browser server.') } }
      ws.onclose = (e) => {
        if (cancelled) return
        if (e.code === 4029) { setStatus('error'); setError('The remote browser is at capacity (free-tier limit: 1 session at a time). Close another remote tab and try again.') }
        else { setStatus('error'); setError('Session ended.') }
      }
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === 'ready') {
          clearInterval(tickInterval)
          setStatus('live')
        } else if (msg.type === 'frame') {
          const img = imgRef.current
          img.onload = () => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          }
          img.src = `data:image/jpeg;base64,${msg.data}`
        }
      }
    })()

    return () => {
      cancelled = true
      clearInterval(tickInterval)
      if (ws) {
        try { ws.send(JSON.stringify({ type: 'close' })) } catch { /* already gone */ }
        ws.close()
      }
    }
  }, [backendUrl, token, sessionId, startUrl, retryKey])

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(msg))
  }, [])

  function toCanvasCoords(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: Math.round((e.clientX - rect.left) * (canvas.width / rect.width)),
      y: Math.round((e.clientY - rect.top) * (canvas.height / rect.height)),
    }
  }

  function handleMouseMove(e) { send({ type: 'mousemove', ...toCanvasCoords(e), buttons: e.buttons }) }
  function handleMouseDown(e) { send({ type: 'mousedown', ...toCanvasCoords(e), button: ['left', 'middle', 'right'][e.button] || 'left' }) }
  function handleMouseUp(e) { send({ type: 'mouseup', ...toCanvasCoords(e), button: ['left', 'middle', 'right'][e.button] || 'left' }) }
  function handleWheel(e) { send({ type: 'wheel', ...toCanvasCoords(e), deltaX: e.deltaX, deltaY: e.deltaY }) }
  function handleKeyDown(e) { e.preventDefault(); send({ type: 'keydown', key: e.key, code: e.code, text: e.key.length === 1 ? e.key : '' }) }
  function handleKeyUp(e) { e.preventDefault(); send({ type: 'keyup', key: e.key, code: e.code }) }

  return (
    <HudCard id={id} title={title} icon={Globe} span="md:col-span-1" onClose={onClose}>
      {status === 'unconfigured' && (
        <div className="text-xs text-faint-c py-6 text-center">
          Remote browser isn't set up yet.<br />Deploy remote-browser/ and set VITE_REMOTE_BROWSER_URL + VITE_REMOTE_BROWSER_TOKEN.
        </div>
      )}
      {status === 'waking' && (
        <div className="py-6 text-center px-4">
          <Loader2 size={18} className="animate-spin mx-auto mb-2 text-faint-c" />
          <div className="text-xs text-body-c mb-2">
            Waking up the remote browser server… this can take up to a minute on the free tier.
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${Math.min(100, (elapsedMs / WAKE_TIMEOUT_MS) * 100)}%`, background: 'var(--accent-bright)' }}
            />
          </div>
          <div className="text-[11px] text-faint-c">{Math.round(elapsedMs / 1000)}s</div>
        </div>
      )}
      {status === 'error' && (
        <div className="py-6 text-center px-2">
          <div className="text-xs mb-3" style={{ color: 'var(--red)' }}>{error}</div>
          <button
            onClick={() => setRetryKey(k => k + 1)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-black"
            style={{ background: 'var(--accent-bright)' }}
          >
            Retry
          </button>
        </div>
      )}
      {(status === 'connecting' || status === 'live') && backendUrl && (
        <div className="relative">
          {status === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg z-10">
              <Loader2 size={20} className="animate-spin text-faint-c" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={1280}
            height={800}
            tabIndex={0}
            className="w-full h-auto rounded-lg cursor-default outline-none"
            style={{ aspectRatio: '1280 / 800' }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
          />
        </div>
      )}
    </HudCard>
  )
}
