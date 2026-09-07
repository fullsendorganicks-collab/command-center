import { useState, useCallback, useRef } from 'react'
import { sendToClaude } from '../lib/anthropic'

const SEEN_KEY = 'cc_briefing_last_seen'

export function getLastSeenAt() {
  try { return localStorage.getItem(SEEN_KEY) } catch { return null }
}
export function markSeenNow() {
  try { localStorage.setItem(SEEN_KEY, new Date().toISOString()) } catch { /* ignore */ }
}

/**
 * Shared chat state/logic for both the full Claude panel and the floating
 * bubble. Conversation history is held in state here; persistence to
 * Supabase (cc_conversations / cc_messages) hooks in via onPersist once
 * auth exists — kept optional so this works standalone today.
 */
export function useClaudeChat(initialMessages = []) {
  const [messages, setMessages] = useState(initialMessages)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const send = useCallback(async (text, { system } = {}) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setSending(true)
    setError(null)
    try {
      const reply = await sendToClaude(nextMessages, { system })
      setMessages(m => [...m, { role: 'assistant', content: reply }])
      return reply
    } catch (e) {
      setError(e.message || 'Something went wrong talking to Claude.')
      return null
    } finally {
      setSending(false)
    }
  }, [messages])

  const reset = useCallback(() => setMessages([]), [])

  return { messages, setMessages, send, sending, error, reset }
}
