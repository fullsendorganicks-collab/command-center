import { Zap, Mail, BarChart3, Bot, ShieldCheck } from 'lucide-react'

const FEATURES = [
  { icon: Mail, title: 'Gmail in one place', desc: 'See your real unread inbox without leaving the dashboard.' },
  { icon: BarChart3, title: 'Search Console', desc: 'Real Search Console data for your connected sites.' },
  { icon: Bot, title: 'Claude built in', desc: 'Draft email replies with Claude, right where you work.' },
  { icon: ShieldCheck, title: 'You stay in control', desc: 'Nothing sends without your explicit click.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="grid-overlay" />
      <div className="relative z-10 max-w-3xl mx-auto px-5 py-14">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
            <Zap size={20} className="text-black" fill="black" />
          </div>
          <div className="text-headline font-bold tracking-wide">COMMAND CENTER</div>
        </div>

        <h1 className="text-headline text-3xl md:text-4xl font-bold mb-4 leading-tight">
          One dashboard for the accounts you use every day.
        </h1>
        <p className="text-body-c text-base mb-8 max-w-xl leading-relaxed">
          Command Center connects your own Gmail and Search Console into a single, real view —
          so you stop switching tabs to check them. Claude can draft an email reply for your
          review; nothing is ever sent without you clicking send yourself. More integrations
          are being built one at a time.
        </p>

        <a
          href="/app"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-black mb-14 transition-transform hover:scale-[1.02]"
          style={{ background: 'var(--accent-bright)' }}
        >
          Sign in to Command Center
        </a>

        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="hud-card p-4">
              <div className="hud-corner tl" /><div className="hud-corner br" />
              <Icon size={18} style={{ color: 'var(--accent-bright)' }} className="mb-2" />
              <div className="text-headline text-sm font-semibold mb-1">{title}</div>
              <div className="text-body-c text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[11px] text-faint-c border-t border-white/10 pt-6">
          <a href="/privacy" className="hover:text-body-c transition-colors underline">Privacy Policy</a>
          <a href="/terms" className="hover:text-body-c transition-colors underline">Terms of Service</a>
        </div>
      </div>
    </div>
  )
}
