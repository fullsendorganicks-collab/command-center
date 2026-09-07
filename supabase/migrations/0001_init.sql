-- Command Center — initial schema
-- Designed to be white-label/repeatable: every business-scoped table
-- hangs off workspace_id, so onboarding a new client is inserting rows,
-- not writing code.

create extension if not exists "pgcrypto";

-- ============================================================
-- WORKSPACES — one per business/client. Nick's own usage = workspace #1.
-- ============================================================
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

-- membership: which auth users belong to which workspace, and their role
create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ============================================================
-- PROPERTIES — sites/businesses tracked per workspace (generic, N-able)
-- ============================================================
create table properties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  domain text not null,
  accent_color text not null default '#e8871e',
  analytics_source_id text, -- GA4 property id / GSC site url, once wired
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CONNECTIONS — generic integration accounts per workspace.
-- Arbitrary count per platform_type (7 gmail, 4 wordpress, etc).
-- Never store raw secrets here — credentials_ref points at
-- Supabase Vault (or an external secret store); this table only
-- carries status/metadata.
-- ============================================================
create table connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform_type text not null, -- 'gmail' | 'wordpress' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter' | 'search_console' | 'ga4' | 'supabase' | 'github' | 'claude_api' | ...
  account_label text not null, -- human nickname, e.g. "Gmail — fullsend"
  status text not null default 'off' check (status in ('ok', 'warn', 'off')),
  credentials_ref text, -- vault secret id / external token store key — never a raw token
  token_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index connections_workspace_platform_idx on connections (workspace_id, platform_type);

-- ============================================================
-- INTEGRATIONS CATALOG — the marketplace list (global, not per-workspace)
-- ============================================================
create table integrations_catalog (
  platform_type text primary key,
  display_name text not null,
  icon text, -- icon name/key rendered client-side
  category text not null check (category in ('email', 'social', 'analytics', 'crm', 'infra', 'shipping', 'inventory', 'custom')),
  created_at timestamptz not null default now()
);

insert into integrations_catalog (platform_type, display_name, icon, category) values
  ('google_ads', 'Google Ads', 'google-ads', 'analytics'),
  ('meta_ads', 'Meta Ads', 'meta', 'analytics'),
  ('ga4', 'GA4', 'bar-chart', 'analytics'),
  ('hubspot', 'HubSpot', 'hubspot', 'crm'),
  ('supabase', 'Supabase', 'supabase', 'infra'),
  ('github', 'GitHub', 'github', 'infra'),
  ('custom', 'Custom Integration', 'plug', 'custom');

-- ============================================================
-- CONVERSATIONS + MESSAGES — Claude chat history per user/workspace
-- ============================================================
create table conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, created_at);

-- ============================================================
-- LAYOUT PREFS — per-user card positions + theme choice
-- ============================================================
create table layout_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  card_positions jsonb not null default '{}'::jsonb,
  theme text not null default 'glass' check (theme in ('glass', 'minimal', 'terminal')),
  accent_color text not null default '#e8871e',
  updated_at timestamptz not null default now()
);

-- ============================================================
-- BRIEFING STATE — tracks last_seen_at per user for proactive briefing
-- ============================================================
create table briefing_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security — scoped to workspace membership.
-- Enabled from day one; policies allow the workspace's own members only.
-- ============================================================
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table properties enable row level security;
alter table connections enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table layout_prefs enable row level security;
alter table briefing_state enable row level security;

create or replace function is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

create policy "members can view their workspace" on workspaces
  for select using (is_workspace_member(id));

create policy "members can view membership rows" on workspace_members
  for select using (is_workspace_member(workspace_id));

create policy "members can manage their properties" on properties
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

create policy "members can manage their connections" on connections
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

create policy "users manage their own conversations" on conversations
  for all using (user_id = auth.uid() and is_workspace_member(workspace_id))
  with check (user_id = auth.uid() and is_workspace_member(workspace_id));

create policy "users manage messages in their conversations" on messages
  for all using (
    exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

create policy "users manage their own layout prefs" on layout_prefs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users manage their own briefing state" on briefing_state
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- integrations_catalog is global reference data — public read, no RLS needed
-- beyond disabling writes from the client (writes happen via migrations only).
