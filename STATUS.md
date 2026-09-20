# Command Center — Status

_Last updated: 2026-09-20. This is the current source of truth for what's
real, what's broken, and what's next. Read this before BUILD_PLAN.md,
which is now partially stale (written before the drag-in pivot below)._

## The current product direction (confirmed Sept 2026)

Overview keeps only three built-in cards — **System Status**, **Inbox**,
and **Claude / Code / Cowork**. Every other integration (Analytics,
Search Console, social platforms, anything else) is added by the user
dragging a link onto the dashboard, which opens it as a real, live,
logged-in browser session running server-side — not a bespoke
integration built per platform. This replaces the earlier
one-integration-at-a-time roadmap in BUILD_PLAN.md for anything that
doesn't need real read/write API access (see "What still needs its own
integration" below).

Properties (Search Console/GA4) and Social still exist as their own
pages, reachable from the sidebar (Sites, Social) — they were only
pulled off the Overview grid, not deleted.

## What's real and working right now

- **Auth**: Google OAuth + email magic link, both working.
- **Gmail (Inbox card)**: real unread count, real sender/subject, via
  `cc-google-data` edge function. Handles a revoked/expired token by
  showing a Connect button, not a dead error.
- **Search Console**: real verified-site lookup, same edge function.
- **GA4**: real Data API call (sessions/users/bounce/engagement) once a
  property is selected. Ships with a real property *picker* (calls
  Google's Analytics Admin API to list the account's actual GA4
  properties by name) instead of asking the user to find a numeric
  Property ID by hand — **this picker needs the Analytics Admin API
  enabled in Google Cloud Console before it'll return anything** (see
  Open Issues).
- **Claude chat** (Claude/Code/Cowork card + floating bubble): wired
  through a vault-secured edge function. The proactive greeting now
  pulls real Gmail data every session instead of repeating fixed mock
  text.
- **Client API keys**: Settings → API Keys already lets a client paste
  in their own Anthropic key, stored via Supabase Vault, never
  re-displayed. This is the existing pattern any future per-card key
  field should follow — not yet needed, since remote-browser cards use
  a live login inside the card itself, not an API key.
- **Drag-and-drop-in (remote browser cards)**: dragging a link onto
  Overview opens a real Chromium session (via `remote-browser/`, a
  small Node/Playwright backend deployed separately on Render) streamed
  into a card over WebSocket — genuine click/type/scroll, not a
  screenshot. Persists to `cc_remote_tabs` so it survives reload.
  Confirmed working end-to-end as of this doc.
- **Error boundaries**: added at the page level and per-card level. A
  crash in one card (or a whole page) now shows a real error message
  and, where applicable, a Remove/Retry button — instead of silently
  blanking the entire app, which is what happened before this existed.
- **Deploy pipeline**: `command-center` Vercel project is git-linked to
  `fullsendorganicks-collab/command-center` (`master` branch, auto-deploy
  on push). This was broken for most of this session (the project
  existed on Vercel but was never actually connected to the GitHub repo)
  — fixed by reconnecting it via Vercel's dashboard (Settings → Git →
  Connect Git Repository). **Known limitation**: the Vercel plan in use
  only runs one build at a time — pushing multiple commits in quick
  succession queues them rather than running in parallel or dropping
  any.

## Known open issues

1. **GA4 property picker returns "no properties found."** Root cause:
   the Google Analytics **Admin** API (different from the Data API,
   which already works) has never been enabled on the app's Google
   Cloud project. One-time fix, needs Nick: visit
   https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=925099673042
   and click Enable.
2. **`VITE_REMOTE_BROWSER_URL` is stored in Vercel without a URL
   scheme** (`cc-remote-browser.onrender.com` instead of
   `https://cc-remote-browser.onrender.com`). The code was made
   tolerant of this (handles both forms correctly via the URL API), so
   it's no longer breaking anything — but fixing the stored value
   itself in Vercel's dashboard would be cleaner. Low priority.
3. **Remote-browser backend free-tier limits**: Render free tier caps
   at 1 concurrent session and can take 10-30s to wake from idle.
   Dropping a 2nd link in while one session is active shows a clear
   "at capacity" error rather than failing silently — this is a real
   ceiling of the current $0 hosting, not a bug. Upgrading hosting
   later is a config change, not a rewrite (same code, more sessions).
4. **No formal multi-tenant isolation audit yet** (BUILD_PLAN.md Phase
   8) — still a hard gate before selling to a second client.
5. **Mobile scope for drag-and-drop-in is unconfirmed.** The feature
   was built and tested for desktop drag events; dragging a link in on
   mobile has not been tested and may not work the same way (no native
   drag-and-drop equivalent on touch in the same sense).

## What still needs its own integration (not solved by drag-in)

Drag-in gives a *view* of a site with real login, but doesn't give
Command Center itself programmatic read/write access to that site's
data (no "unread count" style summary, no send/reply from outside the
card). Anything that needs that — e.g. a real Gmail-style unread badge
for a second mailbox, or posting to social without opening the card —
still needs its own OAuth/API integration, same pattern as Gmail. None
of BUILD_PLAN.md's Phase 3-5c integrations are obsoleted by drag-in;
they're a different capability tier.

## Session history (most recent first)

- **2026-09-20**: Fixed the actual black-screen crash (malformed
  WebSocket URL from a schemeless env var) — root cause only became
  visible after error boundaries were added. Added a Retry button to a
  crashed remote-browser card. Removed Properties/Social/Add
  Integration from Overview per direction. Added error boundaries
  app-wide.
- **2026-09-18 to 19**: Found and fixed the deploy pipeline being
  completely disconnected from GitHub (root cause of "nothing I push
  ever goes live" for most of this session). Fixed GA4's Measurement-ID-
  vs-Property-ID confusion and built the real Data API call. Fixed two
  separate bugs in the drag-in card system: an `order` array that never
  synced when new cards were added, and an id mismatch between
  dnd-kit's SortableContext and the card component's own id. Found and
  fixed a `supabase-js` error-body-parsing bug that was silently
  discarding the "please reconnect Google" signal on every call.
  Replaced manual GA4 Property ID entry with a real picker.
- **2026-09-16 to 17**: Built the remote-browser backend
  (`remote-browser/`, Playwright + WebSocket screencast) and the
  drag-and-drop-in mechanism from scratch. Fixed the original Google
  token-revocation handling (edge function crash on
  `.rpc().catch()`).
