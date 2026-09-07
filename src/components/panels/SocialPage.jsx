import { FocusProvider } from '../../context/FocusContext'
import SocialPanel from './SocialPanel'

export default function SocialPage() {
  return (
    <FocusProvider>
      <div className="grid grid-cols-1">
        <SocialPanel />
      </div>
    </FocusProvider>
  )
}
