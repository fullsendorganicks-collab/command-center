import { Plug, Check } from 'lucide-react'
import { INTEGRATIONS_CATALOG } from '../../data/mockData'

/**
 * Data-driven integrations grid. Adding a new integration type is adding
 * an entry to INTEGRATIONS_CATALOG (src/data/mockData.js) — no new
 * component code needed for a new connector card.
 */
export default function IntegrationsMarketplace() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {INTEGRATIONS_CATALOG.map(item => (
        <div key={item.platform_type} className="hud-card p-4 flex flex-col items-start gap-3">
          <div className="hud-corner tl" /><div className="hud-corner br" />
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/8">
            <Plug size={18} style={{ color: 'var(--accent-bright)' }} />
          </div>
          <div className="flex-1">
            <div className="text-headline text-sm font-semibold">{item.display_name}</div>
            <div className="text-[11px] text-faint-c capitalize">{item.category}</div>
          </div>
          {item.connected ? (
            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--lime-bright)' }}>
              <Check size={13} /> Connected
            </div>
          ) : (
            <button className="text-xs px-3 py-1.5 rounded-lg font-medium text-black w-full" style={{ background: 'var(--accent-bright)' }}>
              Connect
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
