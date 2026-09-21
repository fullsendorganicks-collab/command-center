import { WebSocketServer } from 'ws'
import { chromium } from 'playwright'
import http from 'node:http'
import crypto from 'node:crypto'

// cc-remote-browser — a small, self-hosted remote-browser backend.
//
// One Chromium process stays running for the life of the server. Each
// dragged-in tab gets its own Playwright BrowserContext (isolated
// cookies/storage/login — invisible to every other context, same
// isolation as separate incognito windows) rather than its own full
// browser process, which is what keeps this cheap: a context costs KBs,
// a whole extra Chromium process costs hundreds of MBs. See
// AUTH_TOKEN below for why this can't be opened by anyone but our own
// frontend.
//
// Per session: Page.startScreencast (CDP) streams JPEG frames of the
// live page over the session's WebSocket; the browser sends back
// mouse/keyboard events, which are replayed into the page via
// Input.dispatchMouseEvent / Input.dispatchKeyEvent. This is the same
// mechanism Browserbase's "Live View" and similar products use — there
// is no other way for a server-side browser to be both interactive and
// visible to a client.

const PORT = process.env.PORT || 8080
const AUTH_TOKEN = process.env.REMOTE_BROWSER_TOKEN
if (!AUTH_TOKEN) {
  console.error('REMOTE_BROWSER_TOKEN is required — refusing to start with an open, unauthenticated remote browser.')
  process.exit(1)
}

const MAX_CONCURRENT_SESSIONS = Number(process.env.MAX_CONCURRENT_SESSIONS || 1)

let browserPromise = null
function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })
  }
  return browserPromise
}

// sessionId -> { context, page, cdp, ws }
const sessions = new Map()

async function createSession(sessionId, startUrl) {
  const browser = await getBrowser()
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' }).catch(() => {})
  const session = { context, page, cdp, ws: null }
  sessions.set(sessionId, session)
  return session
}

async function destroySession(sessionId) {
  const s = sessions.get(sessionId)
  if (!s) return
  sessions.delete(sessionId)
  try { await s.cdp.detach() } catch { /* already gone */ }
  try { await s.context.close() } catch { /* already gone */ }
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    // The frontend fetches this cross-origin (commandcenter.alloceraintelligence.com
    // -> cc-remote-browser.onrender.com) as a pre-flight "is the server
    // actually awake yet" check before opening the WebSocket — without
    // CORS headers here the fetch fails silently in the browser, distinct
    // from the token-gated /session WebSocket route which doesn't need them.
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
    res.end(JSON.stringify({ ok: true, sessions: sessions.size, maxSessions: MAX_CONCURRENT_SESSIONS }))
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ server, path: '/session' })

wss.on('connection', async (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams
  const token = params.get('token')
  const startUrl = params.get('url')
  const sessionId = params.get('sessionId') || crypto.randomUUID()

  if (token !== AUTH_TOKEN) {
    ws.close(4001, 'Unauthorized')
    return
  }
  if (!startUrl) {
    ws.close(4000, 'url is required')
    return
  }
  if (!sessions.has(sessionId) && sessions.size >= MAX_CONCURRENT_SESSIONS) {
    ws.close(4029, 'Too many concurrent sessions for this server')
    return
  }

  // First-ever session on this instance launches Chromium from cold (real
  // measured cost on free-tier CPU: well past 20s), then opens a context,
  // a page, and navigates — all before this handler previously sent a
  // single byte back. Confirmed live: every /session request was silently
  // killed at ~20s with zero server-side connection-handler logs at all,
  // meaning something upstream (Render's own proxy, most likely) was
  // timing out an idle WebSocket that never received its first message.
  // Sending an immediate "starting" ack the instant the socket opens gives
  // any such idle-timeout a real message to reset against.
  try { ws.send(JSON.stringify({ type: 'starting' })) } catch { /* client already gone */ }
  const keepaliveInterval = setInterval(() => {
    try { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'keepalive' })) } catch { /* client already gone */ }
  }, 8000)

  let session
  try {
    session = sessions.get(sessionId) || await createSession(sessionId, startUrl)
  } catch (e) {
    clearInterval(keepaliveInterval)
    console.error('Failed to create session', e)
    ws.close(1011, 'Failed to start browser session')
    return
  }
  clearInterval(keepaliveInterval)
  session.ws = ws

  function send(type, data) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type, ...data }))
  }

  session.cdp.on('Page.screencastFrame', async ({ data, sessionId: frameSessionId }) => {
    send('frame', { data })
    try { await session.cdp.send('Page.screencastFrameAck', { sessionId: frameSessionId }) } catch { /* session may have closed */ }
  })

  try {
    await session.cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: 1280, maxHeight: 800, everyNthFrame: 1 })
  } catch (e) {
    console.error('Failed to start screencast', e)
  }

  send('ready', { sessionId })

  ws.on('message', async (raw) => {
    let msg
    try { msg = JSON.parse(raw.toString()) } catch { return }
    try {
      if (msg.type === 'mousemove') {
        await session.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: msg.x, y: msg.y, buttons: msg.buttons || 0 })
      } else if (msg.type === 'mousedown') {
        await session.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: msg.x, y: msg.y, button: msg.button || 'left', clickCount: 1 })
      } else if (msg.type === 'mouseup') {
        await session.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: msg.x, y: msg.y, button: msg.button || 'left', clickCount: 1 })
      } else if (msg.type === 'wheel') {
        await session.cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: msg.x, y: msg.y, deltaX: msg.deltaX || 0, deltaY: msg.deltaY || 0 })
      } else if (msg.type === 'keydown') {
        await session.cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: msg.key, code: msg.code, text: msg.text, unmodifiedText: msg.text })
      } else if (msg.type === 'keyup') {
        await session.cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: msg.key, code: msg.code })
      } else if (msg.type === 'navigate') {
        await session.page.goto(msg.url, { waitUntil: 'domcontentloaded' }).catch(() => {})
      } else if (msg.type === 'close') {
        await destroySession(sessionId)
        ws.close(1000, 'Session closed')
      }
    } catch (e) {
      // A closed/crashed page throws on any CDP call — don't let one bad
      // input event tear down the whole WebSocket connection.
      console.error('Input dispatch failed', e.message)
    }
  })

  ws.on('close', async () => {
    // Sessions intentionally outlive a dropped WebSocket for a short
    // grace period — a page refresh or brief network blip shouldn't
    // force the user to log back in. A stale session is swept below.
    setTimeout(() => {
      const s = sessions.get(sessionId)
      if (s && s.ws === ws) destroySession(sessionId)
    }, 5 * 60 * 1000)
  })
})

server.listen(PORT, () => {
  console.log(`cc-remote-browser listening on :${PORT} (max ${MAX_CONCURRENT_SESSIONS} concurrent session(s))`)
})

process.on('SIGTERM', async () => {
  for (const id of sessions.keys()) await destroySession(id)
  process.exit(0)
})
