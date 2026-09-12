import { useState, useEffect, useCallback } from 'react'
import { Layers, Plus, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import HudCard from '../ui/HudCard'
import { useFocus } from '../../context/FocusContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { supabase } from '../../lib/supabase'
import { getSearchConsoleSummary, getGa4Summary, saveGa4PropertyId, hasGoogleConnection } from '../../lib/googleData'

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

  useEffect(() => {
    if (!workspaceId) return
    hasGoogleConnection(workspaceId).then(setGoogleConnected)
  }, [workspaceId])

  const prop = properties.find(p => p.id === selected) || null

  useEffect(() => {
    if (!googleConnected || !workspaceId) return
    setLoadingData(true)
    setDataError(null)
    Promise.all([
      getSearchConsoleSummary(workspaceId).catch(e => ({ error: e.message })),
      getGa4Summary(workspaceId).catch(e => ({ error: e.message })),
    ]).then(([gscRes, ga4Res]) => {
      setGsc(gscRes)
      setGa4(ga4Res)
      setLoadingData(false)
    })
  }, [googleConnected, workspaceId])

  async function handleSaveGa4() {
    if (!prop || !ga4Input.trim()) return
    setSavingGa4(true)
    try {
      await saveGa4PropertyId(prop.id, ga4Input.trim())
      await loadProperties()
      setGa4Input('')
    } catch (e) {
      setDataError(e.message)
    } finally {
      setSavingGa4(false)
    }
  }

  const matchingGscSite = gsc?.sites?.find(s => prop && s.siteUrl?.includes(prop.domain))

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
            <div className="text-xs text-faint-c py-3 px-3 rounded-lg bg-white/[0.03] mb-3">
              Connect Google (Settings → Integrations) to pull real Analytics and Search Console data for your sites.
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
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={ga4Input}
                      onChange={(e) => setGa4Input(e.target.value)}
                      placeholder="GA4 Property ID (e.g. 123456789)"
                      className="flex-1 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-1.5 text-xs text-headline placeholder:text-faint-c focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      onClick={handleSaveGa4}
                      disabled={savingGa4 || !ga4Input.trim()}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium text-black disabled:opacity-50 shrink-0"
                      style={{ background: 'var(--accent-bright)' }}
                    >
                      Save
                    </button>
                  </div>
                )}
                <div className="text-[10px] text-faint-c mt-1.5">
                  Find this in GA4 → Admin → Property Settings → Property ID.
                </div>
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
