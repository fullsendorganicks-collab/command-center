import { useState, useEffect } from 'react'
import { KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useWorkspace } from '../../context/WorkspaceContext'
import { saveAnthropicKey, hasAnthropicKey } from '../../lib/anthropic'

/**
 * Where a client pastes their OWN Anthropic key. The value goes straight
 * to Supabase Vault via an RPC call (cc_set_workspace_secret) and is never
 * stored in a plain table column or sent anywhere else — this component
 * never even re-displays a saved key, only whether one is configured.
 */
export default function ApiKeysSettings() {
  const { workspaceId, loading: wsLoading, error: wsError } = useWorkspace()
  const [hasKey, setHasKey] = useState(null)
  const [input, setInput] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!workspaceId) return
    hasAnthropicKey(workspaceId).then(setHasKey).catch(() => setHasKey(false))
  }, [workspaceId])

  async function handleSave() {
    if (!input.trim() || !workspaceId) return
    setSaving(true)
    setError(null)
    try {
      await saveAnthropicKey(workspaceId, input.trim())
      setHasKey(true)
      setSaved(true)
      setInput('')
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message || 'Could not save the key.')
    } finally {
      setSaving(false)
    }
  }

  if (wsError) {
    return <div className="text-sm" style={{ color: 'var(--red)' }}>Couldn't load your workspace: {wsError}</div>
  }
  if (wsLoading || !workspaceId) {
    return <div className="text-sm text-faint-c">Loading workspace…</div>
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <KeyRound size={15} style={{ color: 'var(--accent-bright)' }} />
          <div className="text-headline text-sm font-semibold">Anthropic API key</div>
          {hasKey && (
            <span className="flex items-center gap-1 text-[11px] font-medium ml-auto" style={{ color: 'var(--lime-bright)' }}>
              <CheckCircle2 size={12} /> Configured
            </span>
          )}
        </div>
        <p className="text-xs text-body-c mb-3">
          Powers the Claude chat tab, floating assistant, and drafting tools. Your key is used only for
          your own account's requests — it's encrypted at rest and never sent to or visible by anyone else,
          including us. Get one at{' '}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--accent-bright)' }}>
            console.anthropic.com/settings/keys
          </a>.
        </p>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={show ? 'text' : 'password'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={hasKey ? 'Replace saved key…' : 'sk-ant-...'}
              autoComplete="off"
              className="w-full rounded-lg bg-white/[0.04] border border-white/10 pl-3 pr-9 py-2.5 text-sm text-headline placeholder:text-faint-c focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={() => setShow(s => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint-c"
              tabIndex={-1}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!input.trim() || saving}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-black disabled:opacity-40 shrink-0"
            style={{ background: 'var(--accent-bright)' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {error && <div className="text-xs mt-2" style={{ color: 'var(--red)' }}>{error}</div>}
        {saved && <div className="text-xs mt-2" style={{ color: 'var(--lime-bright)' }}>Key saved securely.</div>}
      </div>

      <div className="text-[11px] text-faint-c border-t border-white/10 pt-3">
        Never paste API keys into a chat message, email, or support ticket — including to us. This field is the only
        place your key should ever be entered.
      </div>
    </div>
  )
}
