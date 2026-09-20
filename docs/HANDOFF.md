# Handoff — command-center
Branch `master`, pushed, clean (untracked `chunk_*.json` pre-existing, unrelated). Last commit `5a330fb`.

## Issues this session
- Vercel not git-linked, nothing ever deployed: FIXED
- GA4 no data (Measurement ID vs Property ID mixup, API never built): FIXED
- GA4 property picker via Admin API: FIXED (code). Enabling the Admin API in Google Cloud Console: NOT STARTED, manual, needs account owner — console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=925099673042
- Dropped-tab cards never rendering (order-array sync + dnd-kit id mismatch): FIXED
- App going fully black on any render error, no error boundary anywhere: FIXED
- WebSocket crash from schemeless `VITE_REMOTE_BROWSER_URL`: FIXED
- "Could not reach the remote browser server" on every card: FIXED in two passes. First pass added a pre-flight `/health` poll (cold start is real — measured 53-60s live via curl, twice) but that poll itself had a bug: each attempt used a hard 5s `AbortSignal.timeout`, and Render holds the in-flight request open rather than rejecting fast while cold — so every attempt got killed mid-flight and restarted, guaranteeing 100% failure regardless of the 90s overall budget or how many times the user retried. Second pass makes each attempt's timeout cover the remaining overall budget instead. Also added GitHub Actions keep-alive (runs ~every 10min, confirmed one successful run, but schedule timing isn't exact so cold hits can still occur between pings — the real fix is the corrected timeout, keep-alive just reduces frequency).
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
User reported timeout still hit after the first cold-start fix (screenshot: all 3 cards hit "didn't wake up in time (waited 90s)" after 2 retries). Root-caused to the 5s-abort bug above and fixed in `5a330fb` — UNVERIFIED by user since this second fix deployed.

## Deploy state (verified this session)
- Vercel: commit `5a330fb` confirmed deployed via GitHub's own deployment-status API ("Deployment has completed", state success) — the Vercel API itself returned 403 when queried directly this session, likely transient.
- Render (`cc-remote-browser`): live on `2ccc748` (server.js unchanged in `5a330fb`, so no new Render deploy needed this round); `/health` confirmed returns `access-control-allow-origin: *` and responds in 53-60s cold.
- Supabase edge fn `cc-google-data`: version 9 as of last check — UNVERIFIED if newer exists.

## Next action
User hard-refreshes, retests drag-in cards against the corrected timeout fix, reports back with a screenshot if still broken.
