import { useState } from 'react'
import { Layers, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import HudCard from '../ui/HudCard'
import Sparkline from '../ui/Sparkline'
import { useFocus } from '../../context/FocusContext'
import { PROPERTIES } from '../../data/mockData'

function StatBlock({ label, value }) {
  return (
    <div>
      <div className="text-lg font-bold text-headline">{value}</div>
      <div className="text-[11px] text-faint-c uppercase tracking-wide">{label}</div>
    </div>
  )
}

export default function PropertiesPanel() {
  const { focusedId } = useFocus()
  const isFocused = focusedId === 'properties'
  const [selected, setSelected] = useState(PROPERTIES[0].id)
  const prop = PROPERTIES.find(p => p.id === selected) || PROPERTIES[0]

  return (
    <HudCard id="properties" title="Your Properties" icon={Layers} accentClass="accent-glow" span="md:col-span-2 xl:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-faint-c">{PROPERTIES.length} sites tracked</div>
        <button className="text-xs flex items-center gap-1 text-body-c hover:text-headline transition-colors">
          Manage Sites <ExternalLink size={11} />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {PROPERTIES.map(p => {
          const active = p.id === selected
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-250"
              style={active
                ? { background: `color-mix(in srgb, ${p.accent_color} 18%, transparent)`, borderColor: p.accent_color, color: p.accent_color }
                : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-body)' }}
            >
              {p.name}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-3">
        <StatBlock label="Sessions" value={prop.stats.sessions.toLocaleString()} />
        <StatBlock label="Users" value={prop.stats.users.toLocaleString()} />
        <StatBlock label="Bounce" value={`${Math.round(prop.stats.bounce_rate * 100)}%`} />
        <StatBlock label="Engagement" value={`${Math.round(prop.stats.engagement_rate * 100)}%`} />
      </div>

      <div className="flex items-center justify-between text-xs text-faint-c mb-1">
        <span>Total Sessions</span>
        <span className="flex items-center gap-1" style={{ color: 'var(--lime-bright)' }}>
          <TrendingUp size={12} /> 12% vs last 7 days
        </span>
      </div>
      <Sparkline data={prop.sparkline} color={prop.accent_color} height={isFocused ? 220 : 90} />

      {isFocused && (
        <div className="mt-4 text-xs text-faint-c">
          Domain: <span className="text-body-c">{prop.domain}</span> · Sourced from Google Analytics / Search Console once connected.
        </div>
      )}
    </HudCard>
  )
}
