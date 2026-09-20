# Handoff — command-center
Branch `master`, pushed, clean (untracked `chunk_*.json` pre-existing, unrelated). Last commit `2ccc748`.

## Issues this session
- Vercel not git-linked, nothing ever deployed: FIXED
- GA4 no data (Measurement ID vs Property ID mixup, API never built): FIXED
- GA4 property picker via Admin API: FIXED (code). Enabling the Admin API in Google Cloud Console: NOT STARTED, manual, needs account owner — console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=925099673042
- Dropped-tab cards never rendering (order-array sync + dnd-kit id mismatch): FIXED
- App going fully black on any render error, no error boundary anywhere: FIXED
- WebSocket crash from schemeless `VITE_REMOTE_BROWSER_URL`: FIXED
- "Could not reach the remote browser server" on every card: FIXED — root cause was a real 60s cold-start handshake (measured via curl), not a code bug. Added pre-flight `/health` poll + GitHub Actions keep-alive.
- Overview trimmed to System Status / Inbox / Claude per user direction: FIXED
- Client-addable API keys beyond Anthropic: NOT STARTED (no current consumer — drag-in cards use live login, not API keys)

## Files changed
`remote-browser/server.js`, `RemoteBrowserCard.jsx`, `OverviewPage.jsx`, `DashboardGrid.jsx`,
`shell/ErrorBoundary.jsx` (new), `.github/workflows/keep-remote-browser-warm.yml` (new),
`lib/googleData.js`, `STATUS.md` (new, fuller detail than this file).

## Decisions
- Drag-a-link-in replaces per-platform Overview cards (user direction); Sites/Social pages untouched.
- No paid Render cron (user is $0 budget) — free GitHub Actions used for keep-alive instead.
- This Vercel plan builds one deploy at a time — pushes queue, don't fail.

## Open bugs
Pre-fix error, verbatim: `"Could not reach the remote browser server."` — should be resolved; UNVERIFIED by user since the fix deployed.

## Deploy state (verified this session)
- Vercel: live on `2ccc748`, `target: production`, `state: READY` (checked via API).
- Render (`cc-remote-browser`): live on `2ccc748`; `/health` confirmed returns `access-control-allow-origin: *`.
- Supabase edge fn `cc-google-data`: version 9 as of this session — UNVERIFIED if newer exists.

## Next action
User hard-refreshes, retests drag-in cards against the cold-start fix, reports back with a screenshot if still broken.
