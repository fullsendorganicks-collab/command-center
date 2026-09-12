// ============================================================
// Mock / seed data for Command Center.
// Shapes here mirror the intended Supabase schema so swapping
// mock -> live queries later is a data-source change, not a
// UI rewrite. See supabase/migrations/0001_init.sql for the
// real schema these shapes are based on.
// ============================================================

export const CURRENT_USER = {
  id: 'u_nick',
  name: 'Nick Baum',
  initials: 'NB',
  plan: 'Premium Plan',
}

// ---- Properties (sites/businesses) ----
export const PROPERTIES = [
  {
    id: 'prop_cdai',
    workspace_id: 'ws_1',
    name: 'Allocera / CDAI',
    domain: 'alloceraintelligence.com',
    accent_color: '#e8871e',
    stats: { sessions: 1247, users: 892, bounce_rate: 0.38, engagement_rate: 0.61 },
    sparkline: [820, 910, 870, 990, 1040, 1120, 1247],
  },
  {
    id: 'prop_fullsend',
    workspace_id: 'ws_1',
    name: 'FullSend Organicks',
    domain: 'fullsendorganicks.com',
    accent_color: '#a8e621',
    stats: { sessions: 3104, users: 2210, bounce_rate: 0.44, engagement_rate: 0.52 },
    sparkline: [2400, 2600, 2550, 2800, 2950, 3050, 3104],
  },
  {
    id: 'prop_dv8',
    workspace_id: 'ws_1',
    name: 'DV8 Motorsports',
    domain: 'dv8motorsportsfl.com',
    accent_color: '#7fb0e8',
    stats: { sessions: 561, users: 402, bounce_rate: 0.51, engagement_rate: 0.47 },
    sparkline: [410, 430, 470, 500, 490, 530, 561],
  },
]

// ---- Connections (generic platform_type + account_label rows) ----
function makeAccounts(platform_type, count, label, statuses) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${platform_type}_${i + 1}`,
    platform_type,
    account_label: `${label} ${i + 1}`,
    status: statuses[i % statuses.length],
    health: statuses[i % statuses.length] === 'ok' ? 85 + (i * 3) % 15 : statuses[i % statuses.length] === 'warn' ? 45 + i * 4 : 10,
    token_expires_in_days: statuses[i % statuses.length] === 'warn' ? 2 : 45,
  }))
}

export const CONNECTIONS = [
  ...makeAccounts('gmail', 7, 'Gmail —', ['ok', 'ok', 'ok', 'ok', 'ok', 'warn', 'ok']),
  ...makeAccounts('wordpress', 4, 'WordPress site', ['ok', 'ok', 'ok', 'ok']),
  ...makeAccounts('instagram', 7, 'Instagram', ['ok', 'ok', 'ok', 'warn', 'ok', 'ok', 'off']),
  ...makeAccounts('facebook', 2, 'Facebook Page', ['ok', 'ok']),
  ...makeAccounts('tiktok', 2, 'TikTok', ['off', 'off']),
  ...makeAccounts('linkedin', 2, 'LinkedIn', ['ok', 'warn']),
  ...makeAccounts('twitter', 2, 'X / Twitter', ['ok', 'off']),
  ...makeAccounts('search_console', 1, 'Search Console', ['ok']),
  ...makeAccounts('ga4', 1, 'Google Analytics', ['ok']),
  ...makeAccounts('supabase', 1, 'Supabase', ['ok']),
  ...makeAccounts('github', 1, 'GitHub', ['ok']),
  ...makeAccounts('claude_api', 1, 'Claude API', ['ok']),
]

// custom labels for the 7 gmail slots to feel real
const gmailLabels = ['main', 'fullsend', 'dv8', 'cdai-support', 'allocera-sales', 'personal', 'archive']
CONNECTIONS.filter(c => c.platform_type === 'gmail').forEach((c, i) => { c.account_label = `Gmail — ${gmailLabels[i]}` })
const wpLabels = ['alloceraintelligence.com', 'fullsendorganicks.com', 'dv8motorsportsfl.com', 'blog.alloceraintelligence.com']
CONNECTIONS.filter(c => c.platform_type === 'wordpress').forEach((c, i) => { c.account_label = wpLabels[i] })

export const HEALTH_SUMMARY = (() => {
  const total = CONNECTIONS.length
  const healthy = CONNECTIONS.filter(c => c.status === 'ok').length
  return { healthy, total, pct: Math.round((healthy / total) * 100) }
})()

// ---- Inbox (unified across Gmail accounts) ----
export const INBOX = [
  { id: 'e1', account: 'Gmail — main', sender: 'Shashank Shalabh', subject: 'Re: partnership terms — are nor...', preview: 'Following up on the last draft, a couple of small changes...', time: '9:41 AM', unread: true },
  { id: 'e2', account: 'Gmail — fullsend', sender: 'FullSend Wholesale Order', subject: 'New order #12847', preview: 'You have a new wholesale order awaiting fulfillment.', time: '8:15 AM', unread: true },
  { id: 'e3', account: 'Gmail — cdai-support', sender: 'Google Merchant Center', subject: 'Action required: Product feed issue', preview: 'One or more of your product feeds has an issue that needs attention.', time: '6:32 AM', unread: true },
  { id: 'e4', account: 'Gmail — dv8', sender: 'DV8 Build Request', subject: 'New build request — Marcus T.', preview: 'Lift kit + wheels inquiry for a 2022 F-150...', time: 'Yesterday', unread: false },
  { id: 'e5', account: 'Gmail — allocera-sales', sender: 'Forum Ventures', subject: 'Re: pitch follow-up', preview: 'Thanks for submitting, will be in touch by...', time: 'Yesterday', unread: false },
]

// ---- Social ----
export const SOCIAL_ACCOUNTS = [
  { id: 's_ig1', platform: 'instagram', label: 'Instagram — CDAI', followers: 57, delta: 12 },
  { id: 's_fb1', platform: 'facebook', label: 'Facebook — CDAI', followers: 400, delta: 5 },
  { id: 's_li1', platform: 'linkedin', label: 'LinkedIn — Nick Baum', followers: 1120, delta: 3 },
  { id: 's_ig2', platform: 'instagram', label: 'Instagram — FullSend', followers: 2340, delta: 8 },
  { id: 's_tt1', platform: 'tiktok', label: 'TikTok — FullSend', followers: 890, delta: -1 },
  { id: 's_ig3', platform: 'instagram', label: 'Instagram — DV8', followers: 4210, delta: 2 },
]

export const SOCIAL_FEED = [
  { id: 'sf1', platform: 'instagram', account: 'Instagram — DV8', type: 'comment', text: 'That lift kit looks insane 🔥', time: '32m ago' },
  { id: 'sf2', platform: 'linkedin', account: 'LinkedIn — Nick Baum', type: 'mention', text: 'mentioned you in a post about CDAI', time: '1h ago' },
  { id: 'sf3', platform: 'instagram', account: 'Instagram — FullSend', type: 'dm', text: 'Do you ship wholesale to Canada?', time: '3h ago' },
  { id: 'sf4', platform: 'facebook', account: 'Facebook — CDAI', type: 'like', text: 'New page like', time: '5h ago' },
]

// ---- Integrations catalog (marketplace) ----
// `connected` is intentionally always false here — every one of these is a
// "Coming soon" tile in IntegrationsMarketplace.jsx (no OAuth/API wired to
// any of them). Google is the only real, connectable integration today,
// and it's rendered separately (GoogleDataCard), not from this list.
export const INTEGRATIONS_CATALOG = [
  { platform_type: 'google_ads', display_name: 'Google Ads', category: 'analytics', connected: false },
  { platform_type: 'meta_ads', display_name: 'Meta Ads', category: 'analytics', connected: false },
  { platform_type: 'ga4', display_name: 'GA4', category: 'analytics', connected: false },
  { platform_type: 'hubspot', display_name: 'HubSpot', category: 'crm', connected: false },
  { platform_type: 'supabase', display_name: 'Supabase', category: 'infra', connected: false },
  { platform_type: 'github', display_name: 'GitHub', category: 'infra', connected: false },
  { platform_type: 'custom', display_name: 'Custom Integration', category: 'custom', connected: false },
]

export const THEME_PRESETS = [
  { id: 'glass', name: 'Glass HUD' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'terminal', name: 'Terminal' },
]

export const ACCENT_PRESETS = [
  { name: 'Orange', hex: '#e8871e', bright: '#ffb347' },
  { name: 'Lime', hex: '#a8e621', bright: '#b8f040' },
  { name: 'Blue', hex: '#7fb0e8', bright: '#7fb0e8' },
  { name: 'Amber', hex: '#f0a30a', bright: '#f0a30a' },
  { name: 'Red', hex: '#f05540', bright: '#f05540' },
]
