import { ArrowLeft, Zap } from 'lucide-react'

const LAST_UPDATED = 'September 9, 2026'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <div className="grid-overlay" />
      <div className="relative z-10 max-w-2xl mx-auto px-5 py-10">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
            <Zap size={18} className="text-black" fill="black" />
          </div>
          <div className="text-headline font-bold text-sm tracking-wide">COMMAND CENTER</div>
        </div>

        {/* Plain <a> (full page load) not React Router's Link — avoids a
            known black-screen bug when navigating client-side back into
            the authenticated app shell from a public page like this. */}
        <a href="/" className="inline-flex items-center gap-1.5 text-xs text-faint-c hover:text-body-c transition-colors mb-6">
          <ArrowLeft size={13} /> Back to dashboard
        </a>

        <h1 className="text-headline text-2xl font-bold mb-1">Privacy Policy</h1>
        <p className="text-faint-c text-xs mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-6 text-sm text-body-c leading-relaxed">
          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Overview</h2>
            <p>Command Center ("the App", "we", "us") is a dashboard that lets you connect your own accounts (Google, and other services you choose to connect) so you can view and act on your own data in one place, instead of switching between many separate apps and tabs. This policy explains what data we access, how it is stored, and how you can remove it.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">What we access</h2>
            <p className="mb-2">When you connect a Google Account to Command Center, depending on which features you enable, we may request access to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-headline">Gmail (read-only, and send when you explicitly enable it):</span> to show a summary of your inbox and, only when you enable it, to send a reply you have personally written and approved.</li>
              <li><span className="text-headline">Google Analytics (read-only):</span> to display traffic and engagement metrics for properties you choose to connect.</li>
              <li><span className="text-headline">Search Console (read-only):</span> to display search performance data for sites you have verified ownership of.</li>
              <li><span className="text-headline">Google Drive (only files you pick, when this feature is enabled):</span> to let you attach a file or image you select to an email draft or a chat message. We do not browse or access your Drive beyond the specific file you choose through Google's file picker.</li>
              <li><span className="text-headline">Basic profile info (name, email address):</span> to identify your account when you sign in.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">What we never do</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>We never send an email, publish a post, or take any write action on your behalf without you personally reviewing the exact content and clicking an explicit "Send" or "Post" button yourself.</li>
              <li>We never sell, rent, or share your data with advertisers or data brokers.</li>
              <li>We never use the content of your emails, documents, or analytics data to train AI models.</li>
              <li>Your connected account's access tokens are encrypted at rest and are never sent to or readable by your browser — only our server-side functions can use them, and only to fulfill the specific action you requested.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">How your data is stored</h2>
            <p>Account connection tokens are stored encrypted using Supabase Vault, a dedicated secrets-encryption system, in a private database that only the App's server-side functions can access. Data shown on your dashboard (like email summaries or analytics numbers) is fetched live when you view it and is not permanently copied into a separate marketing database.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Multi-tenant isolation</h2>
            <p>If you use Command Center as part of an organization or agency account, your data is isolated to your specific workspace. Other workspaces on the same platform cannot see your connections, data, or conversations, and this is enforced at the database level, not just in the app's interface.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Revoking access</h2>
            <p>You can disconnect any connected account at any time from Command Center's Settings page, which deletes the stored tokens. You can also revoke Command Center's access directly from your Google Account's <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--accent-bright)' }}>third-party access settings</a> at any time — this takes effect immediately regardless of what you've done in the App.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Contact</h2>
            <p>Questions about this policy or your data can be sent to <a href="mailto:fullsendorganicks@gmail.com" className="underline" style={{ color: 'var(--accent-bright)' }}>fullsendorganicks@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Changes to this policy</h2>
            <p>If this policy changes in a material way, the "Last updated" date above will change and, for significant changes, we will make reasonable efforts to notify active users.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
