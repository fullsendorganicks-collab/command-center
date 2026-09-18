import { useState, useEffect, useCallback } from 'react'
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
import RemoteBrowserCard from './RemoteBrowserCard'

const STATIC_CARDS = [
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
  const [remoteTabs, setRemoteTabs] = useState([])

  const loadRemoteTabs = useCallback(async () => {
    if (!workspaceId) return
    const { data, error } = await supabase
      .from('cc_remote_tabs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true })
    if (!error && data) setRemoteTabs(data)
  }, [workspaceId])

  useEffect(() => { loadRemoteTabs() }, [loadRemoteTabs])

  // Dragging a browser tab/link onto the dashboard opens it as a real,
  // live, interactive remote browser card (see RemoteBrowserCard) — a
  // genuine logged-in session running server-side, not a bookmark. The
  // row in cc_remote_tabs is just what makes it a card at all (id, title,
  // start url) and what makes it survive a page reload; the actual
  // browsing happens in remote-browser/server.js, not here.
  async function handleDropUrl({ url, title }) {
    if (!workspaceId) return
    setDropError(null)
    const { data, error } = await supabase
      .from('cc_remote_tabs')
      .insert({ workspace_id: workspaceId, title: title || new URL(url).hostname, start_url: url })
      .select()
      .single()
    if (error) { setDropError(error.message); return }
    setRemoteTabs(prev => [...prev, data])
  }

  async function handleCloseRemoteTab(tabId) {
    setRemoteTabs(prev => prev.filter(t => t.id !== tabId))
    const { error } = await supabase.from('cc_remote_tabs').delete().eq('id', tabId)
    if (error) setDropError(error.message)
  }

  const cards = [
    ...STATIC_CARDS,
    ...remoteTabs.map(tab => ({
      id: `remote-${tab.id}`,
      render: () => (
        // HudCard's id prop drives both useFocus AND dnd-kit's
        // useSortable — it must exactly match the id this card was
        // registered under in DashboardGrid's `order`/SortableContext
        // (the same `remote-${tab.id}` prefix used above), or dnd-kit
        // never mounts it into the sortable list correctly. Passing the
        // raw tab.id here (no prefix) was the actual reason a dropped
        // tab's row existed in the database but never visually appeared.
        <RemoteBrowserCard
          id={`remote-${tab.id}`}
          sessionId={tab.id}
          title={tab.title}
          startUrl={tab.start_url}
          onClose={() => handleCloseRemoteTab(tab.id)}
        />
      ),
    })),
  ]

  return (
    <FocusProvider>
      {dropError && (
        <div className="mb-4 text-xs px-3 py-2 rounded-lg bg-white/[0.03]" style={{ color: 'var(--red)' }}>
          Couldn't add that tab: {dropError}
        </div>
      )}
      <DashboardGrid cards={cards} onDropUrl={handleDropUrl} />
    </FocusProvider>
  )
}
