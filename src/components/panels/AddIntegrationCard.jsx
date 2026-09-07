import { Plus, ExternalLink } from 'lucide-react'
import { INTEGRATIONS_CATALOG } from '../../data/mockData'

const QUICK_ADD = INTEGRATIONS_CATALOG.filter(i => !i.connected).slice(0, 4)

export default function AddIntegrationCard() {
  return (
    <div className="hud-card p-4 h-full">
      <div className="hud-corner tl" /><div className="hud-corner br" />
      <div className="flex items-center gap-2 mb-1">
        <Plus size={16} style={{ color: 'var(--accent)' }} />
        <h3 className="text-headline font-semibold text-sm">Add Integration</h3>
      </div>
      <div className="text-xs text-faint-c mb-3">Connect a new service</div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {QUICK_ADD.map(i => (
          <div key={i.platform_type} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] text-xs text-body-c">
            {i.display_name}
          </div>
        ))}
      </div>
      <button className="flex items-center gap-1 text-xs text-body-c hover:text-headline transition-colors">
        View All Integrations <ExternalLink size={11} />
      </button>
    </div>
  )
}
