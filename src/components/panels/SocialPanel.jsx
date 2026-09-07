import { useState } from 'react'
import { Users, TrendingUp, TrendingDown, PenSquare, Camera, ThumbsUp, Briefcase, AtSign, Music2 } from 'lucide-react'
import HudCard from '../ui/HudCard'
import { useFocus } from '../../context/FocusContext'
import { SOCIAL_ACCOUNTS, SOCIAL_FEED } from '../../data/mockData'
import ComposeModal from '../ui/ComposeModal'

// Generic geometric icons stand in for platform logos (lucide-react
// dropped trademarked brand marks) — fine for a white-label product
// where per-platform branding isn't the point anyway.
const PLATFORM_ICON = { instagram: Camera, facebook: ThumbsUp, linkedin: Briefcase, twitter: AtSign, tiktok: Music2 }
const PLATFORM_COLOR = { instagram: '#e8871e', facebook: '#7fb0e8', linkedin: '#7fb0e8', twitter: '#b0ada6', tiktok: '#f0ede6' }

export default function SocialPanel() {
  const { focusedId } = useFocus()
  const isFocused = focusedId === 'social'
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [composeAccount, setComposeAccount] = useState(null)

  const platforms = ['all', ...new Set(SOCIAL_ACCOUNTS.map(a => a.platform))]
  const filteredFeed = filterPlatform === 'all' ? SOCIAL_FEED : SOCIAL_FEED.filter(f => f.platform === filterPlatform)
  const filteredAccounts = filterPlatform === 'all' ? SOCIAL_ACCOUNTS : SOCIAL_ACCOUNTS.filter(a => a.platform === filterPlatform)

  return (
    <HudCard id="social" title="Social" icon={Users} span="md:col-span-1">
      <div className="text-xs text-faint-c mb-2">{SOCIAL_ACCOUNTS.length} accounts · 3+ platforms</div>

      {isFocused && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => setFilterPlatform(p)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border capitalize transition-colors"
              style={filterPlatform === p
                ? { background: 'color-mix(in srgb, var(--accent) 18%, transparent)', borderColor: 'var(--accent)', color: 'var(--accent-bright)' }
                : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-body)' }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {isFocused && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {filteredAccounts.map(a => {
            const Icon = PLATFORM_ICON[a.platform] || Users
            return (
              <div key={a.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03]">
                <Icon size={15} style={{ color: PLATFORM_COLOR[a.platform] }} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-headline truncate">{a.label}</div>
                  <div className="flex items-center gap-1 text-[11px] text-faint-c">
                    {a.followers.toLocaleString()} followers
                    <span className="flex items-center gap-0.5" style={{ color: a.delta >= 0 ? 'var(--lime-bright)' : 'var(--red)' }}>
                      {a.delta >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(a.delta)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setComposeAccount(a)}
                  className="p-1.5 rounded-md bg-white/8 hover:bg-white/14 shrink-0"
                  title="Draft post"
                >
                  <PenSquare size={12} className="text-body-c" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-1.5">
        {(isFocused ? filteredFeed : filteredFeed.slice(0, 3)).map(f => {
          const Icon = PLATFORM_ICON[f.platform] || Users
          return (
            <div key={f.id} className="flex gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03]">
              <Icon size={14} style={{ color: PLATFORM_COLOR[f.platform] }} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-body-c truncate">
                  <span className="text-headline font-medium">{f.account}</span> — {f.text}
                </div>
                <div className="text-[10px] text-faint-c">{f.time}</div>
              </div>
            </div>
          )
        })}
      </div>

      {composeAccount && (
        <ComposeModal type="social" context={composeAccount} onClose={() => setComposeAccount(null)} />
      )}
    </HudCard>
  )
}
