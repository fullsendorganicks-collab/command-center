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

export default function RemoteBrowserCard({ id, title, startUrl, onClose }) {
  const canvasRef = useRef(null)
  const wsRef = useRef(null)
  const imgRef = useRef(new Image())
  const [status, setStatus] = useState('connecting') // connecting | live | error | unconfigured
  const [error, setError] = useState(null)

  const backendUrl = import.meta.env.VITE_REMOTE_BROWSER_URL
  const token = import.meta.env.VITE_REMOTE_BROWSER_TOKEN

  useEffect(() => {
    if (!backendUrl || !token) { setStatus('unconfigured'); return }

    const wsUrl = `${backendUrl.replace(/^http/, 'ws')}/session?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(id)}&url=${encodeURIComponent(startUrl)}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setStatus('connecting')
    ws.onerror = () => { setStatus('error'); setError('Could not reach the remote browser server.') }
    ws.onclose = (e) => {
      if (e.code === 4029) { setStatus('error'); setError('The remote browser is at capacity (free-tier limit: 1 session at a time). Close another remote tab and try again.') }
      else if (status !== 'error') { setStatus('error'); setError('Session ended.') }
    }
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'ready') {
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

    return () => {
      try { ws.send(JSON.stringify({ type: 'close' })) } catch { /* already gone */ }
      ws.close()
    }
  }, [backendUrl, token, id, startUrl])

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
      {status === 'error' && (
        <div className="text-xs py-6 text-center px-2" style={{ color: 'var(--red)' }}>{error}</div>
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
