import { FocusProvider } from '../../context/FocusContext'
import ClaudeCoworkPanel from './ClaudeCoworkPanel'

export default function ClaudePage() {
  return (
    <FocusProvider>
      <div className="grid grid-cols-1">
        <ClaudeCoworkPanel />
      </div>
    </FocusProvider>
  )
}
