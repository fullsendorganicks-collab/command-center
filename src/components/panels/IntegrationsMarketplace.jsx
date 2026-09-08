import { useState, useEffect } from 'react'
import { Plug, Check, Link2 } from 'lucide-react'
import { INTEGRATIONS_CATALOG } from '../../data/mockData'
import { useWorkspace } from '../../context/WorkspaceContext'
import { hasGoogleConnection, buildGoogleDataAuthUrl, getGoogleDataRedirectUri } from '../../lib/googleData'

function GoogleDataCard() {
  const { workspaceId } = useWorkspace()
  const [connected, setConnected] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!workspaceId) return
    hasGoogleConnection(workspaceId).then(setConnected)
  }, [workspaceId])

  function handleConnect() {
    try {
      const url = buildGoogleDataAuthUrl({ workspaceId, redirectUri: getGoogleDataRedirectUri() })
      window.location.href = url
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="hud-card accent-glow p-4 flex flex-col items-start gap-3">
      <div className="hud-corner tl" /><div className="hud-corner br" />
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/8">
        <Link2 size={18} style={{ color: 'var(--accent-bright)' }} />
      </div>
      <div className="flex-1">
        <div className="text-headline text-sm font-semibold">Google Data</div>
        <div className="text-[11px] text-faint-c">Gmail, GA4, Search Console — real read access</div>
      </div>
      {connected ? (
        <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--lime-bright)' }}>
          <Check size={13} /> Connected
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={connected === null}
          className="text-xs px-3 py-1.5 rounded-lg font-medium text-black w-full disabled:opacity-50"
          style={{ background: 'var(--accent-bright)' }}
        >
          Connect
        </button>
      )}
      {error && <div className="text-[10px]" style={{ color: 'var(--red)' }}>{error}</div>}
    </div>
  )
}

/**
 * Data-driven integrations grid. Adding a new integration type is adding
 * an entry to INTEGRATIONS_CATALOG (src/data/mockData.js) — no new
 * component code needed for a new connector card. GoogleDataCard is a
 * real, wired connector shown first; everything else in the catalog is
 * still a placeholder until its own OAuth build lands.
 */
export default function IntegrationsMarketplace() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <GoogleDataCard />
      {INTEGRATIONS_CATALOG.filter(i => i.platform_type !== 'ga4').map(item => (
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
