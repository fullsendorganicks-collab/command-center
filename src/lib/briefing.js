import { CURRENT_USER } from '../data/mockData'
import { hasGoogleConnection, getGmailSummary } from './googleData'

/**
 * generateBriefing() — builds a structured summary of what's new, to be
 * fed to Claude as context so it phrases the greeting naturally rather
 * than reciting a template. Pulls real Gmail data via the same
 * cc-google-data edge function the Inbox card uses — no mock/social data
 * mixed in, since Social has no real integration yet (an earlier version
 * of this used fixed mockData.js fixtures, which is why the greeting
 * repeated the same fake names/subjects every session regardless of what
 * was actually happening).
 */
export async function generateBriefing({ workspaceId } = {}) {
  const parts = []

  if (workspaceId) {
    const connected = await hasGoogleConnection(workspaceId)
    if (connected) {
      try {
        const gmail = await getGmailSummary(workspaceId)
        if (gmail.unread_count > 0) {
          const mostRecent = gmail.recent?.[0]
          parts.push(
            mostRecent
              ? `${gmail.unread_count} unread email${gmail.unread_count === 1 ? '' : 's'} in ${gmail.account}, most recent from ${mostRecent.from} ("${mostRecent.subject}")`
              : `${gmail.unread_count} unread email${gmail.unread_count === 1 ? '' : 's'} in ${gmail.account}`
          )
        }
      } catch {
        // Gmail fetch failing (e.g. a revoked token) shouldn't block the
        // greeting entirely — it just means no email line gets added.
      }
    } else {
      parts.push('Gmail is not connected yet — connect it from the Inbox card to get real email summaries here.')
    }
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
