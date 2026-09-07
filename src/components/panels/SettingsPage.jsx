import { useState } from 'react'
import { Palette, Plug, KeyRound } from 'lucide-react'
import ThemeSettingsPanel from './ThemeSettingsPanel'
import IntegrationsMarketplace from './IntegrationsMarketplace'
import ApiKeysSettings from './ApiKeysSettings'

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'account', label: 'API Keys', icon: KeyRound },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('appearance')

  return (
    <div className="hud-card accent-glow p-5">
      <div className="hud-corner tl" /><div className="hud-corner br" />
      <h2 className="text-headline text-lg font-bold mb-4">Settings</h2>
      <div className="flex gap-1.5 mb-6 border-b border-white/10 pb-3">
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
      {tab === 'appearance' && <ThemeSettingsPanel />}
      {tab === 'integrations' && <IntegrationsMarketplace />}
      {tab === 'account' && <ApiKeysSettings />}
    </div>
  )
}
