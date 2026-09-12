import { ShieldCheck, RefreshCw } from 'lucide-react'
import HudCard from '../ui/HudCard'
import GaugeDial from '../ui/GaugeDial'
import StatusDot from '../ui/StatusDot'
import { useFocus } from '../../context/FocusContext'
import { useSystemHealth } from '../../hooks/useSystemHealth'

// Only Google is a real, buildable connection today. Every other platform
// listed here has no OAuth/API integration at all — showing them as
// "off" (not fake "ok") is the honest state, not a bug.
const PLATFORM_LABELS = {
  google: 'Google (Gmail/Analytics/Search Console)',
  google_ads: 'Google Ads', meta_ads: 'Meta Ads', hubspot: 'HubSpot',
  instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn',
  twitter: 'X / Twitter', tiktok: 'TikTok',
}

export default function SystemHealthPanel() {
  const { focusedId } = useFocus()
  const isFocused = focusedId === 'system-health'
  const { googleConnected, checking, pct } = useSystemHealth()

  const connections = [
    { platform_type: 'google', status: checking ? 'checking' : googleConnected ? 'ok' : 'off' },
    { platform_type: 'google_ads', status: 'off' },
    { platform_type: 'meta_ads', status: 'off' },
    { platform_type: 'hubspot', status: 'off' },
    { platform_type: 'instagram', status: 'off' },
    { platform_type: 'facebook', status: 'off' },
    { platform_type: 'linkedin', status: 'off' },
    { platform_type: 'twitter', status: 'off' },
    { platform_type: 'tiktok', status: 'off' },
  ]
  const healthy = connections.filter(c => c.status === 'ok').length
  const total = connections.length

  return (
    <HudCard id="system-health" title="System Status" icon={ShieldCheck} accentClass="accent-glow" span="md:col-span-2 xl:col-span-2">
      {!isFocused ? (
        <>
          <div className="flex justify-center mb-2">
            <GaugeDial value={pct ?? 0} label={checking ? 'Checking…' : 'Connected'} sublabel={checking ? '' : `${healthy} of ${total} platforms`} size={140} />
          </div>
          <div className="text-center text-xs text-faint-c pt-1 border-t border-white/10">
            {checking ? 'Checking connection status…' : googleConnected ? 'Google is connected. Everything else needs its own integration built.' : 'Nothing connected yet — start with Google in Settings → Integrations.'}
          </div>
        </>
      ) : (
        <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-1">
          {connections.map(c => (
            <a
              key={c.platform_type}
              href="/app?nav=integrations"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            >
              {c.status === 'checking' ? (
                <RefreshCw size={12} className="animate-spin text-faint-c shrink-0" />
              ) : (
                <StatusDot status={c.status} pulse={c.status === 'ok'} />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm text-headline truncate">{PLATFORM_LABELS[c.platform_type] || c.platform_type}</div>
              </div>
              <span className="text-[11px] text-faint-c shrink-0">
                {c.status === 'ok' ? 'Connected' : c.status === 'checking' ? 'Checking…' : 'Go to Integrations →'}
              </span>
            </a>
          ))}
        </div>
      )}
    </HudCard>
  )
}
