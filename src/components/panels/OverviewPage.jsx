import { useState } from 'react'
import { FocusProvider } from '../../context/FocusContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { supabase } from '../../lib/supabase'
import DashboardGrid from '../shell/DashboardGrid'
import SystemHealthPanel from './SystemHealthPanel'
import PropertiesPanel from './PropertiesPanel'
import InboxPanel from './InboxPanel'
import SocialPanel from './SocialPanel'
import ClaudeCoworkPanel from './ClaudeCoworkPanel'
import AddIntegrationCard from './AddIntegrationCard'

const CARDS = [
  { id: 'system-health', render: () => <SystemHealthPanel /> },
  { id: 'properties', render: () => <PropertiesPanel /> },
  { id: 'inbox', render: () => <InboxPanel /> },
  { id: 'social', render: () => <SocialPanel /> },
  { id: 'claude-cowork', render: () => <ClaudeCoworkPanel /> },
  { id: 'add-integration', render: () => <AddIntegrationCard /> },
]

export default function OverviewPage() {
  const { workspaceId } = useWorkspace()
  const [dropError, setDropError] = useState(null)

  // Dragging a browser tab/link onto the dashboard adds it as a tracked
  // site the same way the manual "Add site" form does (same table, same
  // shape) — it just skips typing the name/domain in by hand.
  async function handleDropUrl({ url, title }) {
    if (!workspaceId) return
    setDropError(null)
    let domain
    try {
      domain = new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return
    }
    const { data, error } = await supabase
      .from('cc_properties')
      .insert({ workspace_id: workspaceId, name: title || domain, domain })
      .select()
      .single()
    if (error) { setDropError(error.message); return }
    window.dispatchEvent(new CustomEvent('cc:property-added', { detail: { id: data.id } }))
  }

  return (
    <FocusProvider>
      {dropError && (
        <div className="mb-4 text-xs px-3 py-2 rounded-lg bg-white/[0.03]" style={{ color: 'var(--red)' }}>
          Couldn't add that site: {dropError}
        </div>
      )}
      <DashboardGrid cards={CARDS} onDropUrl={handleDropUrl} />
    </FocusProvider>
  )
}
