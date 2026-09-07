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
        <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm hud-card accent-glow p-4 animate-in flex flex-col" style={{ height: '440px' }}>
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={16} style={{ color: 'var(--accent-bright)' }} />
              <span className="text-headline text-sm font-semibold">Quick Claude</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10">
              <X size={15} className="text-body-c" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <ClaudeChatView messages={chat.messages} send={chat.send} sending={chat.sending} error={chat.error} compact />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-250 hover:scale-105"
        style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}
        aria-label="Open Claude chat"
      >
        <Bot size={24} className="text-black" />
      </button>
    </>
  )
}
