import { Users, Camera, ThumbsUp, Briefcase, AtSign } from 'lucide-react'
import HudCard from '../ui/HudCard'
import { useFocus } from '../../context/FocusContext'

// No social platform has a real OAuth/API integration built yet — showing
// fabricated accounts/followers/feed here was actively misleading. This
// is the honest state: real platforms listed, none connected, until each
// one gets its own real integration built (each is its own separate OAuth
// app + API, not a small add-on). Generic icons stand in for platform
// logos — lucide-react doesn't ship trademarked brand marks.
const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Camera },
  { key: 'facebook', label: 'Facebook', icon: ThumbsUp },
  { key: 'linkedin', label: 'LinkedIn', icon: Briefcase },
  { key: 'twitter', label: 'X / Twitter', icon: AtSign },
]

export default function SocialPanel() {
  const { focusedId } = useFocus()
  const isFocused = focusedId === 'social'

  return (
    <HudCard id="social" title="Social" icon={Users} span="md:col-span-1">
      <div className="text-xs text-faint-c mb-3">No social accounts connected yet</div>

      <div className={isFocused ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'}>
        {PLATFORMS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03]">
            <Icon size={15} className="text-faint-c shrink-0" />
            <div className="min-w-0 flex-1 text-xs text-faint-c truncate">{label}</div>
            <span className="text-[10px] text-faint-c shrink-0">Not built yet</span>
          </div>
        ))}
      </div>

      {isFocused && (
        <div className="text-[11px] text-faint-c mt-4 pt-3 border-t border-white/10">
          Each social platform needs its own OAuth app and API integration — none exist yet. This panel will show real accounts and activity once one is built and connected.
        </div>
      )}
    </HudCard>
  )
}
