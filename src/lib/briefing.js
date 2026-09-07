import { CONNECTIONS, INBOX, SOCIAL_FEED, CURRENT_USER } from '../data/mockData'

/**
 * generate_briefing() — builds a structured summary of what's new since
 * last_seen_at, to be fed to Claude as context so it phrases the greeting
 * naturally rather than reciting a template.
 *
 * Real version (once Supabase + live connections exist) would query:
 *  - unread email count across all Gmail connections
 *  - social events where created_at > last_seen_at
 *  - connections where token_expires_at < now() + 72h OR status != 'ok'
 *
 * This mock version approximates the same shape from seed data so the UI
 * and Claude prompt wiring can be built and tested before real data exists.
 */
export function generateBriefing({ lastSeenAt } = {}) {
  const unread = INBOX.filter(e => e.unread)
  const mostRecentUnread = unread[0]

  const staleConnections = CONNECTIONS.filter(c => c.status !== 'ok')

  // "new since last visit" — mock treats the whole feed as recent since we
  // have no real timestamps to diff against last_seen_at yet.
  const recentSocial = lastSeenAt ? SOCIAL_FEED.slice(0, 2) : SOCIAL_FEED.slice(0, 1)

  const parts = []
  if (unread.length > 0) {
    parts.push(`${unread.length} unread email${unread.length === 1 ? '' : 's'}, most recent from ${mostRecentUnread.sender} ("${mostRecentUnread.subject}")`)
  }
  if (recentSocial.length > 0) {
    parts.push(`Recent social activity: ${recentSocial.map(f => `${f.account} — ${f.text}`).join('; ')}`)
  }
  if (staleConnections.length > 0) {
    parts.push(`Connections needing attention: ${staleConnections.map(c => `${c.account_label} (${c.status})`).join(', ')}`)
  }

  return {
    hasContent: parts.length > 0,
    userName: CURRENT_USER.name.split(' ')[0],
    structuredSummary: parts,
  }
}

export function briefingToPrompt(briefing) {
  if (!briefing.hasContent) return null
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return `You are Claude, greeting ${briefing.userName} at the start of a session in their "Command Center" dashboard. It is currently ${timeOfDay}.
Deliver a short, warm, spoken-style briefing (2-4 sentences max) using ONLY the facts below — do not invent anything, and skip any category with nothing to report:

${briefing.structuredSummary.map(s => `- ${s}`).join('\n')}

Phrase it naturally, like a proactive assistant (Jarvis-style), not a bulleted report. Address them by first name once.`
}
