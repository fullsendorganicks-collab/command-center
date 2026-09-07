import { LayoutGrid, Code2, Globe, Users, Plug, Settings, Zap } from 'lucide-react'
import { CURRENT_USER } from '../../data/mockData'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'claude', label: 'Claude / Code / Cowork', icon: Code2 },
  { id: 'sites', label: 'Sites', icon: Globe },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ active, onNavigate, systemOk = true }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
            <Zap size={18} className="text-black" fill="black" />
          </div>
          <div className="min-w-0">
            <div className="text-headline font-bold text-sm leading-tight tracking-wide">COMMAND CENTER</div>
            <div className="text-faint-c text-[11px] leading-tight">Allocera Intelligence · v2.0</div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-250',
                  isActive
                    ? 'text-black font-semibold'
                    : 'text-body-c hover:bg-white/5 hover:text-headline',
                ].join(' ')}
                style={isActive ? { background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' } : undefined}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </nav>

        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-body-c">
            <span className={`w-2 h-2 rounded-full ${systemOk ? 'bg-[var(--lime-bright)] status-pulse' : 'bg-[var(--red)]'}`} />
            System Operational
            <span className="ml-auto text-faint-c">All systems online</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-white/10">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-headline bg-white/10 border border-white/10 shrink-0">
            {CURRENT_USER.initials}
          </div>
          <div className="min-w-0">
            <div className="text-headline text-sm font-medium truncate">{CURRENT_USER.name}</div>
            <div className="text-[11px] font-medium" style={{ color: 'var(--accent-bright)' }}>{CURRENT_USER.plan}</div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/70 backdrop-blur-xl flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0"
            >
              <Icon size={20} style={{ color: isActive ? 'var(--accent-bright)' : 'var(--text-faint)' }} />
              <span className={`text-[10px] truncate max-w-[60px] ${isActive ? 'text-headline' : 'text-faint-c'}`}>{label.split(' / ')[0]}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
