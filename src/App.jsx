import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/shell/Sidebar'
import ErrorBoundary from './components/shell/ErrorBoundary'
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
import HomePage from './components/pages/HomePage'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import { useSystemHealth } from './hooks/useSystemHealth'

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
  // Read the initial tab from ?nav=<tab> so links/bookmarks can deep-link
  // into a specific page (e.g. AddIntegrationCard's "View Integrations"
  // link, or a notification pointing at Sites) instead of always landing
  // on Overview. Falls back to 'overview' for an unknown/missing value.
  const initialNav = new URLSearchParams(window.location.search).get('nav')
  const [nav, setNav] = useState(PAGES[initialNav] ? initialNav : 'overview')
  const [searchOpen, setSearchOpen] = useState(false)
  const Page = PAGES[nav]

  function navigateTo(page) {
    setNav(page)
    const url = new URL(window.location.href)
    url.searchParams.set('nav', page)
    window.history.replaceState({}, '', url)
  }

  // Real Google connection status drives the "needs attention" notification
  // — CONNECTIONS (mock data) previously drove this list, which meant it
  // could show fabricated stale-connection alerts unrelated to anything
  // actually true about the account.
  const { googleConnected, checking } = useSystemHealth()
  const notifications = (!checking && !googleConnected)
    ? [{ text: 'Google is not connected — set it up in Settings → Integrations', page: 'integrations' }]
    : []

  return (
    <div className="flex min-h-screen">
      <div className="grid-overlay" />
      <Sidebar active={nav} onNavigate={navigateTo} systemOk={Boolean(googleConnected)} />

      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <TopBar onOpenSearch={() => setSearchOpen(true)} notifications={notifications} onNavigate={navigateTo} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <h1 className="text-headline text-xl font-bold mb-4 md:hidden">{PAGE_TITLES[nav]}</h1>
          <ErrorBoundary key={nav} fallback={(error) => (
            <div className="text-xs px-3 py-3 rounded-lg bg-white/[0.03]" style={{ color: 'var(--red)' }}>
              This page hit an error: {error?.message || String(error)}
            </div>
          )}>
            <Page />
          </ErrorBoundary>
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
      {/* / is a real, public marketing page — Google's OAuth verification
          requires the app's home page to explain what it does and be
          viewable without logging in. /privacy and /terms are the same:
          standalone public pages, no auth required. The actual app lives
          at /app, behind the Gate (login required). */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route
          path="/app"
          element={
            <AuthProvider>
              <Gate />
            </AuthProvider>
          }
        />
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
