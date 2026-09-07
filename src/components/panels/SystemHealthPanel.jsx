import { ShieldCheck, RefreshCw } from 'lucide-react'
import HudCard from '../ui/HudCard'
import GaugeDial from '../ui/GaugeDial'
import StatusDot from '../ui/StatusDot'
import { useFocus } from '../../context/FocusContext'
import { CONNECTIONS, HEALTH_SUMMARY } from '../../data/mockData'

// Compact view: aggregate gauges for a handful of headline platforms.
const HEADLINE_PLATFORMS = [
  { key: 'gmail', label: 'Gmail (7)' },
  { key: 'wordpress', label: 'WordPress (4)' },
  { key: 'search_console', label: 'Search Console' },
]

function aggregateHealth(platform_type) {
  const rows = CONNECTIONS.filter(c => c.platform_type === platform_type)
  if (rows.length === 0) return 0
  const okCount = rows.filter(r => r.status === 'ok').length
  return Math.round((okCount / rows.length) * 100)
}

const PLATFORM_LABELS = {
  gmail: 'Gmail', wordpress: 'WordPress', instagram: 'Instagram', facebook: 'Facebook',
  tiktok: 'TikTok', linkedin: 'LinkedIn', twitter: 'X / Twitter', search_console: 'Search Console',
  ga4: 'Google Analytics', supabase: 'Supabase', github: 'GitHub', claude_api: 'Claude API',
}

export default function SystemHealthPanel() {
  const { focusedId } = useFocus()
  const isFocused = focusedId === 'system-health'

  return (
    <HudCard id="system-health" title="System Status" icon={ShieldCheck} accentClass="accent-glow" span="md:col-span-2 xl:col-span-2">
      {!isFocused ? (
        <>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {HEADLINE_PLATFORMS.map(p => (
              <GaugeDial key={p.key} value={aggregateHealth(p.key)} label={p.label} size={100} />
            ))}
          </div>
          <div className="text-center text-sm text-body-c pt-1 border-t border-white/10">
            <span className="font-semibold text-headline">{HEALTH_SUMMARY.healthy} of {HEALTH_SUMMARY.total}</span> connections healthy
          </div>
        </>
      ) : (
        <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-1">
          {CONNECTIONS.map(c => (
            <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
              <StatusDot status={c.status} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-headline truncate">{c.account_label}</div>
                <div className="text-[11px] text-faint-c">{PLATFORM_LABELS[c.platform_type] || c.platform_type}</div>
              </div>
              {c.status !== 'ok' ? (
                <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium text-black shrink-0" style={{ background: 'var(--accent-bright)' }}>
                  <RefreshCw size={12} /> Reconnect
                </button>
              ) : (
                <span className="text-[11px] text-faint-c shrink-0">OK</span>
              )}
            </div>
          ))}
        </div>
      )}
    </HudCard>
  )
}
