import { useState } from 'react'
import { Zap, Mail, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function GoogleIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.9 11.9 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12 12 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )
}

export default function LoginScreen() {
  const { signInWithMagicLink, signInWithGoogle, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

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

  async function handleGoogle() {
    setError(null)
    try {
      await signInWithGoogle()
      // browser navigates away to Google — nothing more to do here
    } catch (err) {
      setError(err.message)
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
          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-semibold bg-white text-[#1f1f1f] hover:bg-white/90 transition-colors"
            >
              <GoogleIcon /> Continue with Google
            </button>

            {error && <div className="text-xs text-center" style={{ color: 'var(--red)' }}>{error}</div>}

            {!showEmailForm ? (
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full text-center text-xs text-faint-c hover:text-body-c transition-colors py-1"
              >
                Use email instead
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 pt-1 border-t border-white/10 mt-1">
                <div className="relative mt-3">
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
        )}
      </div>
    </div>
  )
}
