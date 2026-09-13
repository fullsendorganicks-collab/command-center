# Command Center

A unified operations dashboard that consolidates email, analytics, and site management behind one login — built to kill the daily tab-switching between Gmail, GA4, Search Console, social, and WordPress.

## Architecture

The product is deliberately split into two capability tiers, and that split — not pricing — is what drives the build order:

- **Read-only tier**: real live data from connected accounts (unread count, real subjects, GA4 numbers, social follower counts, site stats). No writes anywhere. Low risk, ships first.
- **Full tier**: read-only tier + write capabilities (send email, publish posts, upload product photos, post to social). Real ongoing risk (a bad write hits a live inbox or a live store), so every integration ships its read scope first, proven working, before write scope is even started. See [BUILD_PLAN.md](BUILD_PLAN.md) for the full reasoning and current status.

## What's real today

- Google OAuth + email magic-link auth
- Supabase schema (workspaces / properties / connections / secrets) with row-level security scoping every table to its own workspace
- Claude-powered chat assistant, wired through a Supabase edge function so the Anthropic key never reaches the client
- Desktop shell: sidebar, top bar, focus mode, drag-to-reorder dashboard grid, theme system

`BUILD_PLAN.md` also documents, without spin, what's still mock/placeholder data as of the last update — the plan exists specifically to close that gap integration by integration rather than reskin the mock data.

## Stack

React 19 · Vite · Supabase (Postgres + Auth + Edge Functions) · Anthropic API · Tailwind CSS

## Setup

```bash
npm install
cp .env.example .env   # Supabase URL/anon key, Google OAuth client
npm run dev
```
