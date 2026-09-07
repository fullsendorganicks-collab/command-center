import { useState } from 'react'
import { X, Sparkles, Send } from 'lucide-react'
import { draftWithClaude } from '../../lib/anthropic'

/**
 * Generic compose modal used for both email replies and social post drafts.
 * Claude can generate draft text; the Send/Post button is ALWAYS a manual,
 * explicit user click. Nothing here ever auto-sends or auto-posts.
 */
export default function ComposeModal({ type, context, onClose }) {
  const [draft, setDraft] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState(null)

  const isEmail = type === 'email'
  const title = isEmail ? `Reply to ${context.sender}` : `Draft post — ${context.label}`

  async function handleDraft() {
    setDrafting(true)
    setError(null)
    try {
      const prompt = isEmail
        ? `Draft a short, professional reply to this email.\nFrom: ${context.sender}\nSubject: ${context.subject}\nPreview: ${context.preview}\n\nWrite only the reply body, no subject line.`
        : `Draft a short, engaging ${context.platform} caption/post for the account "${context.label}". Keep it on-brand and concise.`
      const text = await draftWithClaude(prompt)
      setDraft(text)
    } catch (e) {
      setError(e.message || 'Could not reach Claude — check your API key in Settings.')
    } finally {
      setDrafting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in" onClick={onClose}>
      <div className="hud-card accent-glow w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline font-semibold text-sm">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={16} className="text-body-c" />
          </button>
        </div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={7}
          placeholder="Write your own, or let Claude draft it..."
          className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-headline placeholder:text-faint-c focus:outline-none focus:border-[var(--accent)] resize-none"
        />
        {error && <div className="text-xs mt-2" style={{ color: 'var(--red)' }}>{error}</div>}

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={handleDraft}
            disabled={drafting}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/8 text-body-c hover:bg-white/12 transition-colors disabled:opacity-50"
          >
            <Sparkles size={13} style={{ color: 'var(--accent-bright)' }} />
            {drafting ? 'Drafting…' : 'Draft with Claude'}
          </button>

          <button
            onClick={onClose}
            disabled={!draft.trim()}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-semibold text-black disabled:opacity-40 transition-colors"
            style={{ background: 'var(--accent-bright)' }}
            title="This is a manual action — nothing sends automatically"
          >
            <Send size={13} /> {isEmail ? 'Send' : 'Post'}
          </button>
        </div>
        <div className="text-[10px] text-faint-c mt-2 text-center">
          {isEmail ? 'Sending' : 'Posting'} always requires this explicit click — Claude never sends on its own.
        </div>
      </div>
    </div>
  )
}
