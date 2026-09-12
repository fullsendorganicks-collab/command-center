import { useEffect, useState } from 'react'
import { useWorkspaceOptional } from '../context/WorkspaceContext'
import { hasGoogleConnection } from '../lib/googleData'

/**
 * Single source of truth for "system health" across the whole shell
 * (TopBar banner, Sidebar dot, SystemHealthPanel's gauge). Previously
 * TopBar/Sidebar read HEALTH_SUMMARY — a percentage computed entirely from
 * mock data — while SystemHealthPanel separately computed a real number
 * from actual connection state. That's how a fabricated "0% SYSTEM
 * OPERATIONAL" banner ended up on screen next to a real, different number
 * in the System Status card. Everything now reads from here instead.
 *
 * Only Google is a real, checkable connection today (see
 * SystemHealthPanel's PLATFORM_LABELS comment) — every other platform is
 * correctly counted as "off" until it has a real integration, not
 * silently fabricated as "ok".
 */
const OTHER_PLATFORM_COUNT = 8 // google_ads, meta_ads, hubspot, instagram, facebook, linkedin, twitter, tiktok — all "off" until built

export function useSystemHealth() {
  const { workspaceId } = useWorkspaceOptional()
  const [googleConnected, setGoogleConnected] = useState(null) // null = checking

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    hasGoogleConnection(workspaceId).then(v => { if (!cancelled) setGoogleConnected(v) })
    return () => { cancelled = true }
  }, [workspaceId])

  const checking = googleConnected === null
  const healthy = googleConnected ? 1 : 0
  const total = 1 + OTHER_PLATFORM_COUNT
  // While still checking, this is genuinely unknown — callers should show
  // a loading state instead of treating `pct` as a real 0%.
  const pct = checking ? null : Math.round((healthy / total) * 100)

  return { checking, googleConnected, healthy, total, pct }
}
