import { useState, useEffect, useCallback } from 'react'
import { Layers, Plus, ExternalLink, Loader2, RefreshCw, Link2 } from 'lucide-react'
import HudCard from '../ui/HudCard'
import { useFocus } from '../../context/FocusContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { supabase } from '../../lib/supabase'
import { getSearchConsoleSummary, getGa4Summary, getGa4Properties, saveGa4PropertyId, hasGoogleConnection, buildGoogleDataAuthUrl, getGoogleDataRedirectUri } from '../../lib/googleData'

function StatBlock({ label, value }) {
  return (
    <div>
      <div className="text-lg font-bold text-headline">{value}</div>
      <div className="text-[11px] text-faint-c uppercase tracking-wide">{label}</div>
    </div>
  )
}

function AddPropertyForm({ workspaceId, onAdded, onCancel }) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (!name.trim() || !domain.trim()) return
    setSaving(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('cc_properties')
      .insert({ workspace_id: workspaceId, name: name.trim(), domain: domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '') })
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    onAdded(data)
  }

  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/10 p-3 mb-3 space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Site name (e.g. My Website)"
        className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-headline placeholder:text-faint-c focus:outline-none focus:border-[var(--accent)]"
      />
      <input
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="Domain (e.g. mysite.com)"
        className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-headline placeholder:text-faint-c focus:outline-none focus:border-[var(--accent)]"
      />
      {error && <div className="text-xs" style={{ color: 'var(--red)' }}>{error}</div>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !domain.trim()}
          className="text-xs px-3 py-1.5 rounded-lg font-medium text-black disabled:opacity-50"
          style={{ background: 'var(--accent-bright)' }}
        >
          {saving ? 'Adding…' : 'Add site'}
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-lg text-body-c hover:text-headline">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function PropertiesPanel() {
  const { focusedId } = useFocus()
  const isFocused = focusedId === 'properties'
  const { workspaceId } = useWorkspace()

  const [properties, setProperties] = useState([])
  const [loadingProps, setLoadingProps] = useState(true)
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)

  const [googleConnected, setGoogleConnected] = useState(null)
  const [gsc, setGsc] = useState(null)
  const [ga4, setGa4] = useState(null)
  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState(null)

  const [ga4Properties, setGa4Properties] = useState(null) // null = not fetched yet, [] = fetched, none found
  const [ga4Input, setGa4Input] = useState('')
  const [savingGa4, setSavingGa4] = useState(false)

  const loadProperties = useCallback(async () => {
    if (!workspaceId) return
    setLoadingProps(true)
    const { data, error } = await supabase
      .from('cc_properties')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true })
    setLoadingProps(false)
    if (!error && data) {
      setProperties(data)
      setSelected(sel => sel || data[0]?.id || null)
    }
  }, [workspaceId])

  useEffect(() => { loadProperties() }, [loadProperties])

  // A site can also be added from outside this card — dragging a browser
  // tab onto the dashboard (see DashboardGrid's onDropUrl) inserts
  // directly into cc_properties and fires this event so the card picks
  // the new row up and switches to it, instead of only refreshing the
  // next time this panel happens to remount.
  useEffect(() => {
    function onPropertyAdded(e) {
      loadProperties()
      if (e.detail?.id) setSelected(e.detail.id)
    }
    window.addEventListener('cc:property-added', onPropertyAdded)
    return () => window.removeEventListener('cc:property-added', onPropertyAdded)
  }, [loadProperties])

  useEffect(() => {
    if (!workspaceId) return
    hasGoogleConnection(workspaceId).then(setGoogleConnected)
  }, [workspaceId])

  const prop = properties.find(p => p.id === selected) || null

  useEffect(() => {
    if (!googleConnected || !workspaceId) return
    setLoadingData(true)
    setDataError(null)
    const calls = [getSearchConsoleSummary(workspaceId).catch(e => ({ error: e.message, reauthRequired: e.reauthRequired }))]
    // GA4 is per-property, not per-workspace — only fetch it once a
    // property is selected and has a valid numeric Property ID saved.
    calls.push(
      prop?.analytics_source_id
        ? getGa4Summary(workspaceId, prop.analytics_source_id).catch(e => ({ error: e.message, reauthRequired: e.reauthRequired }))
        : Promise.resolve(null)
    )
    Promise.all(calls).then(([gscRes, ga4Res]) => {
      // A revoked/expired refresh token means the stored connection no
      // longer works — fall back to the "not connected" prompt instead of
      // leaving a dead-end red error banner forever.
      if (gscRes.reauthRequired || ga4Res?.reauthRequired) {
        setGoogleConnected(false)
        setLoadingData(false)
        return
      }
      setGsc(gscRes)
      setGa4(ga4Res)
      setLoadingData(false)
    })
  }, [googleConnected, workspaceId, prop?.id, prop?.analytics_source_id])

  // Fetches the account's real GA4 properties once, so the user picks
  // their site by name from a dropdown instead of hunting for a numeric
  // Property ID in GA4's own settings screen and pasting it in.
  useEffect(() => {
    if (!googleConnected || !workspaceId || ga4Properties !== null) return
    getGa4Properties(workspaceId)
      .then(res => setGa4Properties(res.properties || []))
      .catch(() => setGa4Properties([]))
  }, [googleConnected, workspaceId, ga4Properties])

  async function handleSaveGa4(propertyId) {
    if (!prop || !propertyId) return
    setSavingGa4(true)
    setDataError(null)
    try {
      await saveGa4PropertyId(prop.id, propertyId)
      await loadProperties()
      setGa4Input('')
    } catch (e) {
      setDataError(e.message)
    } finally {
      setSavingGa4(false)
    }
  }

  const matchingGscSite = gsc?.sites?.find(s => prop && s.siteUrl?.includes(prop.domain))

  function handleConnectGoogle() {
    try {
      window.location.href = buildGoogleDataAuthUrl({ workspaceId, redirectUri: getGoogleDataRedirectUri() })
    } catch (e) {
      setDataError(e.message)
    }
  }

  return (
    <HudCard id="properties" title="Your Properties" icon={Layers} accentClass="accent-glow" span="md:col-span-2 xl:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-faint-c">{properties.length} site{properties.length === 1 ? '' : 's'} tracked</div>
        <button onClick={() => setAdding(a => !a)} className="text-xs flex items-center gap-1 text-body-c hover:text-headline transition-colors">
          <Plus size={12} /> Add site
        </button>
      </div>

      {adding && (
        <AddPropertyForm
          workspaceId={workspaceId}
          onCancel={() => setAdding(false)}
          onAdded={(newProp) => { setProperties(p => [...p, newProp]); setSelected(newProp.id); setAdding(false) }}
        />
      )}

      {loadingProps ? (
        <div className="text-xs text-faint-c py-6 text-center flex items-center justify-center gap-2">
          <Loader2 size={13} className="animate-spin" /> Loading your sites…
        </div>
      ) : properties.length === 0 ? (
        <div className="text-xs text-faint-c py-6 text-center">
          No sites added yet. Click "Add site" to track your first website.
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap mb-4">
            {properties.map(p => {
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

          {googleConnected === false && (
            <div className="flex items-center justify-between gap-3 text-xs text-faint-c py-3 px-3 rounded-lg bg-white/[0.03] mb-3">
              <span>Connect Google to pull real Analytics and Search Console data for your sites.</span>
              <button
                onClick={handleConnectGoogle}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-black shrink-0"
                style={{ background: 'var(--accent-bright)' }}
              >
                <Link2 size={12} /> Connect
              </button>
            </div>
          )}

          {googleConnected && loadingData && (
            <div className="text-xs text-faint-c py-6 text-center flex items-center justify-center gap-2">
              <Loader2 size={13} className="animate-spin" /> Loading Google data…
            </div>
          )}

          {googleConnected && !loadingData && prop && (
            <>
              <div className="mb-4">
                <div className="text-[11px] text-faint-c uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  Search Console
                  {loadingData && <RefreshCw size={10} className="animate-spin" />}
                </div>
                {matchingGscSite ? (
                  <div className="text-xs text-body-c">
                    Verified site found: <span className="text-headline">{matchingGscSite.siteUrl}</span>
                    {matchingGscSite.permissionLevel && <span className="text-faint-c"> · {matchingGscSite.permissionLevel}</span>}
                  </div>
                ) : gsc?.sites?.length > 0 ? (
                  <div className="text-xs text-faint-c">No Search Console property matches "{prop.domain}" yet — add it in Search Console first.</div>
                ) : gsc?.error ? (
                  <div className="text-xs" style={{ color: 'var(--red)' }}>{gsc.error}</div>
                ) : (
                  <div className="text-xs text-faint-c">No Search Console sites found on this Google account yet. Search data can take a day to process on a newly verified site.</div>
                )}
              </div>

              <div>
                <div className="text-[11px] text-faint-c uppercase tracking-wide mb-1.5">Google Analytics (GA4)</div>
                {prop.analytics_source_id ? (
                  ga4?.note ? (
                    <div className="text-xs text-faint-c">GA4 property <span className="text-headline">{prop.analytics_source_id}</span> saved. {ga4.note}</div>
                  ) : ga4?.error ? (
                    <div className="text-xs" style={{ color: 'var(--red)' }}>{ga4.error}</div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      <StatBlock label="Sessions" value={ga4?.sessions?.toLocaleString?.() ?? '—'} />
                      <StatBlock label="Users" value={ga4?.users?.toLocaleString?.() ?? '—'} />
                      <StatBlock label="Bounce" value={ga4?.bounce_rate != null ? `${Math.round(ga4.bounce_rate * 100)}%` : '—'} />
                      <StatBlock label="Engagement" value={ga4?.engagement_rate != null ? `${Math.round(ga4.engagement_rate * 100)}%` : '—'} />
                    </div>
                  )
                ) : ga4Properties === null ? (
                  <div className="text-xs text-faint-c flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" /> Loading your GA4 properties…
                  </div>
                ) : ga4Properties.length === 0 ? (
                  <div className="text-xs text-faint-c">
                    No GA4 properties found on this Google account — make sure you're connected with the account that has access to this site's Google Analytics.
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={ga4Input}
                      onChange={(e) => setGa4Input(e.target.value)}
                      className="flex-1 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-1.5 text-xs text-headline focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="">Select your GA4 property…</option>
                      {ga4Properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.account_name})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSaveGa4(ga4Input)}
                      disabled={savingGa4 || !ga4Input}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium text-black disabled:opacity-50 shrink-0"
                      style={{ background: 'var(--accent-bright)' }}
                    >
                      Save
                    </button>
                  </div>
                )}
                {dataError && (
                  <div className="text-[11px] mt-1.5" style={{ color: 'var(--red)' }}>{dataError}</div>
                )}
              </div>
            </>
          )}

          {isFocused && (
            <div className="mt-4 text-xs text-faint-c flex items-center gap-1">
              Domain: <span className="text-body-c">{prop?.domain}</span>
              <a href={`https://${prop?.domain}`} target="_blank" rel="noreferrer" className="ml-1 hover:text-body-c">
                <ExternalLink size={11} />
              </a>
            </div>
          )}
        </>
      )}
    </HudCard>
  )
}
