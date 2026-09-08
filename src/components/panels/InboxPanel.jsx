import { useState, useEffect } from 'react'
import { Mail, Circle, PenSquare, RefreshCw, Link2 } from 'lucide-react'
import HudCard from '../ui/HudCard'
import { useFocus } from '../../context/FocusContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { INBOX } from '../../data/mockData'
import ComposeModal from '../ui/ComposeModal'
import { hasGoogleConnection, getGmailSummary, buildGoogleDataAuthUrl } from '../../lib/googleData'

export default function InboxPanel() {
  const { focusedId } = useFocus()
  const isFocused = focusedId === 'inbox'
  const { workspaceId } = useWorkspace()
  const [composeFor, setComposeFor] = useState(null)

  const [connected, setConnected] = useState(null) // null = checking
  const [gmail, setGmail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!workspaceId) return
    hasGoogleConnection(workspaceId).then(setConnected)
  }, [workspaceId])

  useEffect(() => {
    if (!connected || !workspaceId) return
    setLoading(true)
    setError(null)
    getGmailSummary(workspaceId)
      .then(setGmail)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [connected, workspaceId])

  function handleConnect() {
    try {
      const url = buildGoogleDataAuthUrl({ workspaceId, redirectUri: window.location.origin + window.location.pathname })
      window.location.href = url
    } catch (e) {
      setError(e.message)
    }
  }

  // Real data once connected; mock data (clearly labeled) otherwise.
  const usingRealData = connected && gmail && !error
  const emails = usingRealData
    ? gmail.recent.map(e => ({ id: e.id, account: gmail.account, sender: e.from, subject: e.subject, preview: e.snippet, time: '', unread: true }))
    : INBOX
  const unreadCount = usingRealData ? gmail.unread_count : INBOX.filter(e => e.unread).length
  const visible = isFocused ? emails : emails.slice(0, 3)

  return (
    <HudCard id="inbox" title="Inbox" icon={Mail} span="md:col-span-1">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-faint-c">
          {connected === null ? 'Checking connection…' : usingRealData ? `${unreadCount} unread · ${gmail.account}` : `${unreadCount} unread · sample data`}
        </div>
        {loading && <RefreshCw size={12} className="animate-spin text-faint-c" />}
      </div>

      {connected === false && (
        <button
          onClick={handleConnect}
          className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium text-black mb-2"
          style={{ background: 'var(--accent-bright)' }}
        >
          <Link2 size={12} /> Connect Gmail for real data
        </button>
      )}
      {error && <div className="text-[11px] mb-2" style={{ color: 'var(--red)' }}>{error}</div>}

      <div className="space-y-1.5">
        {visible.map(e => (
          <div key={e.id} className="flex gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
            {e.unread && <Circle size={7} fill="var(--accent-bright)" style={{ color: 'var(--accent-bright)' }} className="mt-1.5 shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-headline font-medium truncate">{e.sender}</span>
                {e.time && <span className="text-[11px] text-faint-c shrink-0">{e.time}</span>}
              </div>
              <div className="text-xs text-body-c truncate">{e.subject}</div>
              {isFocused && (
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-faint-c">{e.account}</span>
                  <button
                    onClick={() => setComposeFor(e)}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-black font-medium"
                    style={{ background: 'var(--accent-bright)' }}
                  >
                    <PenSquare size={11} /> Draft reply
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {composeFor && <ComposeModal type="email" context={composeFor} onClose={() => setComposeFor(null)} />}
    </HudCard>
  )
}
