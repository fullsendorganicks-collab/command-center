import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

// React only supports error boundaries via class components — there is no
// hook equivalent. Without one anywhere in the app, a single uncaught
// render-phase error in ANY component (a bad prop, a null dereference)
// unmounts the entire React tree and leaves a blank page with no visible
// cause — exactly what happened when the app went fully black after a
// hard refresh with no server-side errors logged anywhere. This renders a
// visible, specific error message instead, and — critically — is meant to
// wrap individual risky pieces (a single dashboard card) as well as the
// whole app, so one broken card can never take down everything else again.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught a render error:', error, info)
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error)
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg, #040506)' }}>
          <div className="max-w-md text-center">
            <AlertTriangle size={28} className="mx-auto mb-3" style={{ color: 'var(--red, #ff5c5c)' }} />
            <h1 className="text-headline text-lg font-semibold mb-2">Something broke</h1>
            <p className="text-body-c text-sm mb-4">{this.state.error?.message || String(this.state.error)}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs px-4 py-2 rounded-lg font-medium text-black"
              style={{ background: 'var(--accent-bright, #ffb347)' }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
