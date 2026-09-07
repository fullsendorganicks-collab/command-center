import { useState, useEffect } from 'react'
import { Bot, Terminal, Users2, Plus, ExternalLink, MessageSquare } from 'lucide-react'
import HudCard from '../ui/HudCard'
import { useFocus } from '../../context/FocusContext'
import { useClaudeChat, getLastSeenAt, markSeenNow } from '../../hooks/useClaudeChat'
import ClaudeChatView from './ClaudeChatView'
import { generateBriefing, briefingToPrompt } from '../../lib/briefing'
import { useWorkspace } from '../../context/WorkspaceContext'

const TABS = [
  { id: 'claude', label: 'Claude', icon: Bot },
  { id: 'code', label: 'Claude Code', icon: Terminal },
  { id: 'cowork', label: 'Cowork', icon: Users2 },
]

function useThreads() {
  const [threads, setThreads] = useState(() => [{ id: 't1', title: 'New conversation', messages: [] }])
  const [activeId, setActiveId] = useState('t1')
  const active = threads.find(t => t.id === activeId) || threads[0]

  function newThread() {
    const id = 't' + Date.now()
    setThreads(t => [{ id, title: 'New conversation', messages: [] }, ...t])
    setActiveId(id)
  }

  function updateActiveMessages(messages) {
    setThreads(ts => ts.map(t => t.id === activeId
      ? { ...t, messages, title: t.title === 'New conversation' && messages[0] ? messages[0].content.slice(0, 40) : t.title }
      : t))
  }

  return { threads, active, activeId, setActiveId, newThread, updateActiveMessages }
}

function ClaudeTab() {
  const { workspaceId } = useWorkspace()
  const { threads, active, activeId, setActiveId, newThread, updateActiveMessages } = useThreads()
  const chat = useClaudeChat(active.messages, workspaceId)

  useEffect(() => { updateActiveMessages(chat.messages) }, [chat.messages]) // eslint-disable-line react-hooks/exhaustive-deps

  // proactive briefing on first open of this session
  useEffect(() => {
    if (!workspaceId) return
    if (chat.messages.length > 0) return
    const lastSeen = getLastSeenAt()
    const briefing = generateBriefing({ lastSeenAt: lastSeen })
    const prompt = briefingToPrompt(briefing)
    if (prompt) {
      chat.send('(session start)', { system: prompt })
    }
    markSeenNow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex gap-4 h-[60vh]">
      <div className="w-48 shrink-0 border-r border-white/10 pr-3 hidden sm:flex flex-col">
        <button
          onClick={newThread}
          className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-body-c mb-2 transition-colors"
        >
          <Plus size={13} /> New thread
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {threads.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`w-full text-left flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${t.id === activeId ? 'bg-white/10 text-headline' : 'text-faint-c hover:bg-white/5'}`}
            >
              <MessageSquare size={12} className="shrink-0" />
              <span className="truncate">{t.title}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <ClaudeChatView messages={chat.messages} send={chat.send} sending={chat.sending} error={chat.error} />
      </div>
    </div>
  )
}

function LaunchTab({ label, description, deepLink, sessions }) {
  return (
    <div className="h-[60vh] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-body-c max-w-md">{description}</p>
        <a
          href={deepLink}
          className="flex items-center gap-1.5 text-xs px-3.5 py-2.5 rounded-lg font-semibold text-black shrink-0"
          style={{ background: 'var(--accent-bright)' }}
        >
          Launch {label} <ExternalLink size={13} />
        </a>
      </div>
      <div className="text-[11px] text-faint-c uppercase tracking-wide mb-2">Recent sessions</div>
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {sessions.length === 0 ? (
          <div className="text-xs text-faint-c py-6 text-center">
            No sessions available via API yet — this will populate once {label} session data can be fetched.
          </div>
        ) : sessions.map(s => (
          <div key={s.id} className="px-3 py-2.5 rounded-lg bg-white/[0.03] text-sm text-body-c">{s.title}</div>
        ))}
      </div>
    </div>
  )
}

export default function ClaudeCoworkPanel() {
  const { focusedId, focus } = useFocus()
  const { workspaceId } = useWorkspace()
  const isFocused = focusedId === 'claude-cowork'
  const [tab, setTab] = useState('claude')

  if (!isFocused) {
    return (
      <HudCard id="claude-cowork" title="Claude / Code / Cowork" icon={Bot} accentClass="accent-glow" span="md:col-span-2 xl:col-span-3">
        <div className="text-sm text-body-c mb-3">
          {workspaceId ? 'Chat, launch Claude Code, or check Cowork — click to expand.' : 'Add your Anthropic API key in Settings to enable the Claude tab.'}
        </div>
        <button
          onClick={() => focus('claude-cowork')}
          className="text-xs px-3 py-2 rounded-lg font-medium text-black"
          style={{ background: 'var(--accent-bright)' }}
        >
          Open panel
        </button>
      </HudCard>
    )
  }

  return (
    <HudCard id="claude-cowork" title="Claude / Code / Cowork" icon={Bot} accentClass="accent-glow" span="md:col-span-2 xl:col-span-3">
      <div className="flex gap-1.5 mb-4 border-b border-white/10 pb-3">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={active
                ? { background: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent-bright)' }
                : { color: 'var(--text-body)' }}
            >
              <Icon size={13} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'claude' && <ClaudeTab />}
      {tab === 'code' && (
        <LaunchTab
          label="Claude Code"
          description="Claude Code sessions and repos aren't fetchable via a public API yet. Launch the desktop app manually, or paste a claude:// deep link here once available."
          deepLink="claude://open"
          sessions={[]}
        />
      )}
      {tab === 'cowork' && (
        <LaunchTab
          label="Cowork"
          description="Cowork task status isn't fetchable via a public API yet. Launch Cowork manually for now."
          deepLink="https://claude.ai/cowork"
          sessions={[]}
        />
      )}
    </HudCard>
  )
}
