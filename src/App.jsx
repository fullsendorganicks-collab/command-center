import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/shell/Sidebar'
import TopBar from './components/shell/TopBar'
import SearchModal from './components/shell/SearchModal'
import FloatingChatBubble from './components/shell/FloatingChatBubble'
import LoginScreen from './components/shell/LoginScreen'
import GoogleOAuthCallback from './components/shell/GoogleOAuthCallback'
import OverviewPage from './components/panels/OverviewPage'
import ClaudePage from './components/panels/ClaudePage'
import SitesPage from './components/panels/SitesPage'
import SocialPage from './components/panels/SocialPage'
import SettingsPage from './components/panels/SettingsPage'
import PrivacyPolicy from './components/pages/PrivacyPolicy'
import TermsOfService from './components/pages/TermsOfService'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import { HEALTH_SUMMARY, CONNECTIONS } from './data/mockData'

const PAGES = {
  overview: OverviewPage,
  claude: ClaudePage,
  sites: SitesPage,
  social: SocialPage,
  integrations: SettingsPage,
  settings: SettingsPage,
}

const PAGE_TITLES = {
  overview: 'Overview',
  claude: 'Claude / Code / Cowork',
  sites: 'Sites',
  social: 'Social',
  integrations: 'Integrations',
  settings: 'Settings',
}

function AppShell() {
  const [nav, setNav] = useState('overview')
  const [searchOpen, setSearchOpen] = useState(false)
  const Page = PAGES[nav]

  const staleConnections = CONNECTIONS.filter(c => c.status !== 'ok')
  // Structured so each notification can navigate somewhere on click —
  // stale connections point at Sites (where System Status lives) rather
  // than being inert text.
  const notifications = staleConnections.map(c => ({
    text: `${c.account_label} needs attention (${c.status})`,
    page: 'sites',
  }))

  return (
    <div className="flex min-h-screen">
      <div className="grid-overlay" />
      <Sidebar active={nav} onNavigate={setNav} systemOk={HEALTH_SUMMARY.pct >= 85} />

      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <TopBar onOpenSearch={() => setSearchOpen(true)} notifications={notifications} onNavigate={setNav} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <h1 className="text-headline text-xl font-bold mb-4 md:hidden">{PAGE_TITLES[nav]}</h1>
          <Page />
        </main>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      <FloatingChatBubble />
    </div>
  )
}

function Gate() {
  const { user, loading, configured } = useAuth()

  // If Supabase isn't configured, or before auth is ready, still let the
  // user see the fully clickable mock UI rather than blocking on login —
  // per build order, the shell + mock data should work before real auth.
  if (!configured) return <AppShell />
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-faint-c text-sm">Loading…</div>
  }
  if (!user) return <LoginScreen />
  return (
    <WorkspaceProvider>
      <GoogleCallbackGate />
    </WorkspaceProvider>
  )
}

function GoogleCallbackGate() {
  // Google's data-connection redirect uses ?code=...&state=<workspaceId>.
  // Supabase's own auth redirect (magic link / login) also uses `code`,
  // but never sets our `state` param this way, so checking for both
  // together safely distinguishes "Google data connection" from a
  // Supabase auth callback that already resolved before we got here.
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')

  if (code && state) {
    return <GoogleOAuthCallback code={code} workspaceId={state} onDone={() => window.location.replace(window.location.pathname)} />
  }
  return <AppShell />
}

export default function App() {
  return (
    <ThemeProvider>
      {/* /privacy and /terms are real, standalone, public URLs — Google's
          OAuth verification review loads these directly, so they must
          render on their own without requiring login or the app shell. */}
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route
          path="*"
          element={
            <AuthProvider>
              <Gate />
            </AuthProvider>
          }
        />
      </Routes>
    </ThemeProvider>
  )
}
