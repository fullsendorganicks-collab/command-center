import { useState } from 'react'
import { Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { THEME_PRESETS, ACCENT_PRESETS } from '../../data/mockData'

export default function ThemeSettingsPanel() {
  const { theme, accent, setTheme, setAccent } = useTheme()
  const [customHex, setCustomHex] = useState('')

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <div className="text-headline text-sm font-semibold mb-3">Visual theme</div>
        <div className="grid grid-cols-3 gap-2">
          {THEME_PRESETS.map(t => {
            const active = theme === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="hud-card p-3 text-left relative"
                style={active ? { borderColor: 'var(--accent)' } : undefined}
              >
                {active && <Check size={13} className="absolute top-2 right-2" style={{ color: 'var(--accent-bright)' }} />}
                <div className="text-headline text-xs font-medium">{t.name}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="text-headline text-sm font-semibold mb-3">Accent color</div>
        <div className="flex gap-2 flex-wrap items-center">
          {ACCENT_PRESETS.map(p => {
            const active = accent === p.hex
            return (
              <button
                key={p.hex}
                onClick={() => setAccent(p.hex, p.bright)}
                className="w-9 h-9 rounded-full border-2 transition-transform"
                style={{ backgroundColor: p.hex, borderColor: active ? '#fff' : 'transparent', transform: active ? 'scale(1.1)' : 'scale(1)' }}
                title={p.name}
              />
            )
          })}
          <div className="flex items-center gap-1.5 ml-2">
            <input
              type="text"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="#hex"
              className="w-24 rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5 text-xs text-headline placeholder:text-faint-c focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={() => { if (/^#([0-9a-f]{3}){1,2}$/i.test(customHex)) setAccent(customHex, customHex) }}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white/8 text-body-c hover:bg-white/12"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-faint-c">
        Your theme and accent color are saved to your account and follow you across devices.
      </div>
    </div>
  )
}
