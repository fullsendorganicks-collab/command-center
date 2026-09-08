import { useState, useEffect, useRef } from 'react'
import { Search, Bell, Move } from 'lucide-react'
import { CURRENT_USER, HEALTH_SUMMARY } from '../../data/mockData'

function statusColor(pct) {
  if (pct >= 85) return { bg: 'rgba(184,240,64,0.12)', fg: 'var(--lime-bright)', border: 'rgba(184,240,64,0.3)' }
  if (pct >= 60) return { bg: 'rgba(240,163,10,0.12)', fg: 'var(--amber)', border: 'rgba(240,163,10,0.3)' }
  return { bg: 'rgba(240,85,64,0.12)', fg: 'var(--red)', border: 'rgba(240,85,64,0.3)' }
}

export default function TopBar({ onOpenSearch, notifications = [], onNavigate }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])

  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef(null)
  useEffect(() => {
    function onClick(e) { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const c = statusColor(HEALTH_SUMMARY.pct)
  const unreadCount = notifications.length

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 py-3.5 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border"
        style={{ background: c.bg, color: c.fg, borderColor: c.border }}
      >
        <span className="w-1.5 h-1.5 rounded-full status-pulse" style={{ backgroundColor: c.fg }} />
        {HEALTH_SUMMARY.pct}% SYSTEM OPERATIONAL
      </div>

      <div className="hidden lg:flex items-center gap-1.5 text-faint-c text-xs">
        <Move size={13} />
        DRAG <span className="opacity-60">⠿</span> TO REARRANGE
      </div>

      <div className="flex-1" />

      <button
        onClick={onOpenSearch}
        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-body-c text-sm hover:bg-white/8 transition-colors w-56 lg:w-72"
      >
        <Search size={15} className="text-faint-c" />
        <span className="flex-1 text-left text-faint-c">Search anything...</span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-faint-c">⌘K</kbd>
      </button>
      <button onClick={onOpenSearch} className="sm:hidden p-2 rounded-lg bg-white/5 border border-white/10">
        <Search size={17} className="text-body-c" />
      </button>

      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifs(s => !s)}
          className="relative p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
        >
          <Bell size={17} className="text-body-c" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-black" style={{ backgroundColor: 'var(--accent-bright)' }}>
              {unreadCount}
            </span>
          )}
        </button>
        {showNotifs && (
          <div className="absolute right-0 mt-2 w-72 hud-card accent-glow p-2 animate-in">
            <div className="text-headline text-sm font-semibold px-2 py-1.5">Notifications</div>
            {notifications.length === 0 ? (
              <div className="text-faint-c text-xs px-2 py-3">You're all caught up.</div>
            ) : notifications.map((n, i) => (
              <button
                key={i}
                onClick={() => { onNavigate?.(n.page); setShowNotifs(false) }}
                className="w-full text-left px-2 py-2 rounded hover:bg-white/8 text-xs text-body-c transition-colors"
              >
                {n.text}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-headline bg-white/10 border border-white/10 shrink-0" title={CURRENT_USER.name}>
        {CURRENT_USER.initials}
      </div>
    </header>
  )
}
