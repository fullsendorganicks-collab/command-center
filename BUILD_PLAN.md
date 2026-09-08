# Command Center — Build Plan (honest status + path to "Jarvis, not mockup")

_Written Sept 2026. Supersedes ad-hoc fixes — this is the ordered plan._

## The core problem to solve

Right now the dashboard *looks* right but shows **mock/stale data**. A
tab-replacement product that shows fake data is worse than the tabs it
replaces — the user checks it, doesn't trust it, opens the tabs anyway.
Every phase below exists to close that gap for real, not just visually.

## What's actually real today (don't rebuild these)

- Shell: sidebar, top bar, focus mode, drag-reorder (desktop only)
- Auth: Google OAuth + email magic link, both working
- Supabase schema: workspaces/properties/connections/secrets, RLS-scoped
- Claude chat: wired through a vault-secured edge function (CORS fixed)
- Theme/accent system (desktop)

## What's mock/fake right now (the actual problem)

- Every Gmail, GA4, Search Console, social, WordPress number/message on
  screen is hardcoded sample data — zero live connections
- Notifications reference stale-connection mock rows, not real state
- Integrations marketplace "Connect" buttons don't do anything yet

## Phase 1 — Make the loudest bugs stop being bugs (in progress / next)
- [x] Fix magic-link redirect (shipped)
- [x] Add Google OAuth login button (shipped)
- [x] Fix Claude edge function CORS failure (shipped)
- [ ] Mobile: floating chat bubble needs a visible close button always
      (not just re-tapping the bubble)
- [ ] Mobile: every "leaves the dashboard" action needs to actually be
      tappable — audit every button/link on real mobile viewport widths
- [ ] Notification bell: already fixed to be clickable; verify on mobile too
- [ ] Glass/blur rendering: verify `backdrop-filter` actually renders on
      Nick's real device/browser — if not, diagnose (Safari/iOS has known
      backdrop-filter quirks) and fix, don't just assume CSS is right

## Phase 2 — First real integration: Google (Gmail + GA4 + Search Console)
Google OAuth app already exists (Sept 2026) for login. Extending it to
these read scopes is the SAME app, more scopes — no new app needed.
- [ ] Server-side OAuth token exchange (edge function — never in browser)
- [ ] Store refresh tokens encrypted (Vault, same pattern as Anthropic key)
- [ ] Gmail: real unread count + real recent senders in Inbox panel
- [ ] GA4: real sessions/users/bounce/engagement in Properties panel
- [ ] Search Console: replace the one mock "Search Console" health row
- [ ] Token refresh + expiry handling — this is what "stale connection"
      notifications should actually mean once this ships

## Phase 3 — Target client's real stack (confirm with Nick before starting)
Building generically first risks building the wrong thing twice. Need:
- Her exact platforms: WordPress (confirmed) + which social platforms +
  which ad platform (Google Ads / Meta Ads / both) + which CRM (if any)
- Wire those specific integrations for her first, generalize after

## Phase 4 — Social platforms (Meta first, likely highest client value)
- [ ] Meta Developer app (Instagram + Facebook) — Nick creates app,
      I wire the OAuth + Graph API calls
- [ ] Real follower counts, real recent comments/DMs in Social panel
- [ ] Draft-post flow already built (Claude drafts, manual Post button) —
      wire actual posting via Graph API once connected
- [ ] LinkedIn, TikTok, X — same pattern, each its own dev app, lower
      priority unless the target client needs them

## Phase 5 — WordPress connection
- [ ] Likely a lightweight plugin (or REST API + application password)
      on her WP site reporting basic stats back — needs its own design
      pass, WP doesn't have a universal OAuth like Google/Meta

## Phase 6 — Mobile-first pass (real decision needed from Nick — see below)
- [ ] Drag-to-reorder cards works via touch, not just mouse
- [ ] Theme/accent picker fully usable on mobile
- [ ] Voice chat (mic + speaker) confirmed working on mobile Chrome
- [ ] Every panel's focused view fits and scrolls correctly on small screens

## Phase 7 — Stripe billing on the dashboard
- [ ] Stripe account decision (see below)
- [ ] Settings > Billing panel: current plan, invoice history, "Update
      payment method" — Stripe Customer Portal embed is the fast path
- [ ] Webhook (edge function) to sync subscription status into
      `cc_workspaces` so plan tier reads happen locally, not live-Stripe
      every page load

## Phase 8 — Multi-tenant isolation audit (before selling to a second client)
- [ ] Formal RLS audit: create a second test workspace, confirm zero
      cross-workspace data leakage in every table, every query path
- [ ] Confirm Nick's own admin account can see all workspaces (support
      access) while regular client accounts cannot see each other's
- [ ] This phase is a hard gate — don't sell to client #2 before it's done

---

## Open decisions — need answers to sequence this correctly

1. **Target client's stack** (Phase 3) — her exact social/ad/CRM platforms
2. **Stripe account** — new account for Command Center itself, or reuse
   an existing one? (Needs to be separate from FullSend/DV8/CDAI Stripe —
   different product, different billing)
3. **Mobile scope for v1** — full feature parity on mobile (more work,
   more time) vs. a lighter "view + chat" mobile experience now, full
   parity later
4. **Pace** — this is easily 4-8 weeks of real work across all phases,
   even working efficiently. Worth being clear-eyed about that up front
   rather than discovering it phase by phase.
