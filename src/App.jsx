import { useState } from 'react'
import Sidebar from './components/shell/Sidebar'
import TopBar from './components/shell/TopBar'
import SearchModal from './components/shell/SearchModal'
import FloatingChatBubble from './components/shell/FloatingChatBubble'
import LoginScreen from './components/shell/LoginScreen'
import OverviewPage from './components/panels/OverviewPage'
import ClaudePage from './components/panels/ClaudePage'
import SitesPage from './components/panels/SitesPage'
import SocialPage from './components/panels/SocialPage'
import SettingsPage from './components/panels/SettingsPage'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
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
  const notifications = staleConnections.map(c => `${c.account_label} needs attention (${c.status})`)

  return (
    <div className="flex min-h-screen">
      <div className="grid-overlay" />
      <Sidebar active={nav} onNavigate={setNav} systemOk={HEALTH_SUMMARY.pct >= 85} />

      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <TopBar onOpenSearch={() => setSearchOpen(true)} notifications={notifications} />
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
  return <AppShell />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  )
}
