import { useState } from 'react'
import { Zap, Mail, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginScreen() {
  const { signInWithMagicLink, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)
    try {
      await signInWithMagicLink(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="hud-card accent-glow w-full max-w-sm p-6">
        <div className="hud-corner tl" /><div className="hud-corner br" />
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
            <Zap size={20} className="text-black" fill="black" />
          </div>
          <div>
            <div className="text-headline font-bold text-sm tracking-wide">COMMAND CENTER</div>
            <div className="text-faint-c text-[11px]">Sign in to continue</div>
          </div>
        </div>

        {!configured ? (
          <div className="text-sm text-body-c">
            Supabase isn't configured yet — add <code className="text-headline">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-headline">VITE_SUPABASE_ANON_KEY</code> to <code className="text-headline">.env.local</code>.
          </div>
        ) : sent ? (
          <div className="text-center py-4">
            <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: 'var(--lime-bright)' }} />
            <div className="text-headline text-sm font-medium mb-1">Check your email</div>
            <div className="text-body-c text-xs">We sent a magic sign-in link to {email}.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint-c" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-headline placeholder:text-faint-c focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            {error && <div className="text-xs" style={{ color: 'var(--red)' }}>{error}</div>}
            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-black disabled:opacity-50 transition-colors"
              style={{ background: 'var(--accent-bright)' }}
            >
              {sending ? 'Sending link…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
