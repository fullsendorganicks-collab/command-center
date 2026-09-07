import Anthropic from '@anthropic-ai/sdk'

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

export const anthropicConfigured = Boolean(apiKey)

// NOTE: dangerouslyAllowBrowser is used here for local/dev convenience per
// the build order (get the chat panel live immediately, no backend yet).
// Before shipping this beyond personal/local use, proxy Anthropic calls
// through a small server or Supabase edge function so the API key is never
// shipped to the browser.
const client = anthropicConfigured
  ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  : null

export const DEFAULT_MODEL = 'claude-sonnet-4-6'

/**
 * Send a conversation to Claude. `messages` is [{role, content}, ...].
 * `system` is an optional system prompt (used for briefing context, etc).
 */
export async function sendToClaude(messages, { system, model = DEFAULT_MODEL, maxTokens = 1024 } = {}) {
  if (!client) {
    throw new Error('Anthropic API key not configured. Add VITE_ANTHROPIC_API_KEY in Settings/.env.local.')
  }
  const res = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })
  const textBlock = res.content.find(b => b.type === 'text')
  return textBlock ? textBlock.text : ''
}

/** One-shot helper for draft generation (compose modal, briefings, etc). */
export async function draftWithClaude(prompt, opts = {}) {
  return sendToClaude([{ role: 'user', content: prompt }], opts)
}
