import { Plus, ExternalLink } from 'lucide-react'

export default function AddIntegrationCard() {
  return (
    <div className="hud-card p-4 h-full">
      <div className="hud-corner tl" /><div className="hud-corner br" />
      <div className="flex items-center gap-2 mb-1">
        <Plus size={16} style={{ color: 'var(--accent)' }} />
        <h3 className="text-headline font-semibold text-sm">Add Integration</h3>
      </div>
      <div className="text-xs text-faint-c mb-3">
        Only Google (Gmail, Analytics, Search Console) is connectable today. Everything else is coming soon.
      </div>
      <a
        href="/app?nav=integrations"
        className="flex items-center gap-1 text-xs text-body-c hover:text-headline transition-colors"
      >
        View Integrations <ExternalLink size={11} />
      </a>
    </div>
  )
}
