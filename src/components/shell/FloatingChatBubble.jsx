import { useState, useEffect } from 'react'
import { Bot, X } from 'lucide-react'
import { useClaudeChat, getLastSeenAt, markSeenNow } from '../../hooks/useClaudeChat'
import ClaudeChatView from '../panels/ClaudeChatView'
import { generateBriefing, briefingToPrompt } from '../../lib/briefing'
import { useWorkspace } from '../../context/WorkspaceContext'

export default function FloatingChatBubble() {
  const { workspaceId } = useWorkspace()
  const [open, setOpen] = useState(false)
  const chat = useClaudeChat([], workspaceId)
  const [briefed, setBriefed] = useState(false)

  useEffect(() => {
    if (!open || briefed || !workspaceId) return
    setBriefed(true)
    if (chat.messages.length === 0) {
      const lastSeen = getLastSeenAt()
      const briefing = generateBriefing({ lastSeenAt: lastSeen })
      const prompt = briefingToPrompt(briefing)
      if (prompt) chat.send('(session start)', { system: prompt })
      markSeenNow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      {open && (
        // Full-screen sheet on mobile (so the close button can never be
        // covered by the bottom tab bar or anything else), a floating
        // panel on desktop. z-[60] keeps it above the mobile bottom nav
        // (z-40) and the round toggle button below.
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-[60] md:w-full md:max-w-sm h-[100dvh] max-h-[100dvh] md:h-[440px] md:max-h-[440px] hud-card accent-glow p-4 animate-in flex flex-col md:rounded-lg rounded-none">
          <div className="flex items-center justify-between mb-2 shrink-0 pt-[env(safe-area-inset-top)]">
            <div className="flex items-center gap-2">
              <Bot size={16} style={{ color: 'var(--accent-bright)' }} />
              <span className="text-headline text-sm font-semibold">Quick Claude</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 active:bg-white/15"
              aria-label="Close chat"
            >
              <X size={20} className="text-body-c" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <ClaudeChatView messages={chat.messages} send={chat.send} sending={chat.sending} error={chat.error} compact />
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-250 hover:scale-105"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}
          aria-label="Open Claude chat"
        >
          <Bot size={24} className="text-black" />
        </button>
      )}
    </>
  )
}
