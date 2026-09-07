import { FocusProvider } from '../../context/FocusContext'
import PropertiesPanel from './PropertiesPanel'
import SystemHealthPanel from './SystemHealthPanel'

export default function SitesPage() {
  return (
    <FocusProvider>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <PropertiesPanel />
        <SystemHealthPanel />
      </div>
    </FocusProvider>
  )
}
