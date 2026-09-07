import { useState } from 'react'
import { Mail, Circle, PenSquare } from 'lucide-react'
import HudCard from '../ui/HudCard'
import { useFocus } from '../../context/FocusContext'
import { INBOX } from '../../data/mockData'
import ComposeModal from '../ui/ComposeModal'

export default function InboxPanel() {
  const { focusedId } = useFocus()
  const isFocused = focusedId === 'inbox'
  const [composeFor, setComposeFor] = useState(null)

  const unreadCount = INBOX.filter(e => e.unread).length
  const visible = isFocused ? INBOX : INBOX.filter(e => e.unread).slice(0, 3)

  return (
    <HudCard id="inbox" title="Inbox" icon={Mail} span="md:col-span-1">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-faint-c">{unreadCount} unread · 7 accounts</div>
      </div>

      <div className="space-y-1.5">
        {visible.map(e => (
          <div key={e.id} className="flex gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
            {e.unread && <Circle size={7} fill="var(--accent-bright)" style={{ color: 'var(--accent-bright)' }} className="mt-1.5 shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-headline font-medium truncate">{e.sender}</span>
                <span className="text-[11px] text-faint-c shrink-0">{e.time}</span>
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
