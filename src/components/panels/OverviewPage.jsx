import { FocusProvider } from '../../context/FocusContext'
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
  return (
    <FocusProvider>
      <DashboardGrid cards={CARDS} />
    </FocusProvider>
  )
}
