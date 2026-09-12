import { supabase, supabaseConfigured } from './supabase'

// Anthropic calls are proxied through the cc-claude-proxy Supabase Edge
// Function. The browser NEVER holds or sends an Anthropic API key directly
// — each workspace's own key lives encrypted in Supabase Vault and is only
// decrypted server-side, inside the edge function, per request. This is
// what makes it safe to resell: a client's key is never visible in
// devtools/network tab, and Nick's own key is never billed for other
// people's usage.

export const DEFAULT_MODEL = 'claude-sonnet-5'

/**
 * True once we at least know which workspace to ask the proxy about.
 * The proxy itself reports "no key configured" per-workspace at call time.
 */
export function anthropicReady(workspaceId) {
  return Boolean(supabaseConfigured && workspaceId)
}

async function callProxy(payload) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured, so the Claude proxy is unavailable.')
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('You must be signed in to use Claude.')
  }

  const { data, error } = await supabase.functions.invoke('cc-claude-proxy', {
    body: payload,
  })

  if (error) {
    // supabase-js surfaces non-2xx as `error`; try to pull the real message
    const msg = error.context?.error || error.message || 'Claude request failed.'
    throw new Error(msg)
  }
  if (data?.error) {
    throw new Error(data.error)
  }
  const textBlock = data?.content?.find(b => b.type === 'text')
  return textBlock ? textBlock.text : ''
}

/**
 * Send a conversation to Claude via the workspace's own key.
 * `messages` is [{role, content}, ...]. `system` is optional context
 * (used for briefings). `workspaceId` selects whose key/vault entry to use.
 */
export async function sendToClaude(messages, { system, model = DEFAULT_MODEL, maxTokens = 1024, workspaceId } = {}) {
  if (!workspaceId) {
    throw new Error('No workspace selected — cannot determine which API key to use.')
  }
  return callProxy({
    workspace_id: workspaceId,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    system,
    model,
    max_tokens: maxTokens,
  })
}

/** One-shot helper for draft generation (compose modal, briefings, etc). */
export async function draftWithClaude(prompt, opts = {}) {
  return sendToClaude([{ role: 'user', content: prompt }], opts)
}

/** Save (or replace) this workspace's Anthropic API key. Value goes straight into Vault via RPC — never stored in a plain column. */
export async function saveAnthropicKey(workspaceId, apiKey) {
  const { error } = await supabase.rpc('cc_set_workspace_secret', {
    p_workspace_id: workspaceId,
    p_secret_type: 'anthropic_api_key',
    p_secret_value: apiKey,
  })
  if (error) throw error
}

/** Boolean only — never returns the key itself. */
export async function hasAnthropicKey(workspaceId) {
  const { data, error } = await supabase.rpc('cc_has_workspace_secret', {
    p_workspace_id: workspaceId,
    p_secret_type: 'anthropic_api_key',
  })
  if (error) throw error
  return Boolean(data)
}
