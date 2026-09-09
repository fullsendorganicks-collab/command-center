import { Link } from 'react-router-dom'
import { ArrowLeft, Zap } from 'lucide-react'

const LAST_UPDATED = 'September 9, 2026'

export default function TermsOfService() {
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

        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-faint-c hover:text-body-c transition-colors mb-6">
          <ArrowLeft size={13} /> Back to dashboard
        </Link>

        <h1 className="text-headline text-2xl font-bold mb-1">Terms of Service</h1>
        <p className="text-faint-c text-xs mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-6 text-sm text-body-c leading-relaxed">
          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Agreement</h2>
            <p>By using Command Center ("the App"), you agree to these terms. If you are using the App on behalf of a company or client, you confirm you have the authority to connect that organization's accounts and agree to these terms on its behalf.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">What the App does</h2>
            <p>Command Center is a dashboard that displays data from services you connect (such as Gmail, Google Analytics, and Search Console) and lets you take actions on those services — such as replying to an email or posting to a connected social account — only after you personally review and approve the exact content.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Your responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for the content of anything you choose to send or publish through the App — the App only sends what you have personally written or explicitly approved.</li>
              <li>You must have the legal right to connect any account you connect (your own, or one you're authorized to manage on behalf of a client or employer).</li>
              <li>You are responsible for keeping your login credentials secure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">No unauthorized automated sending</h2>
            <p>The App will never send an email, publish a post, or perform any other write action on a connected account without an explicit, manual confirmation from you for that specific piece of content, every time. There is no setting that enables fully automatic sending or posting.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Service availability</h2>
            <p>The App is provided "as is." We aim for high availability but do not guarantee uninterrupted access, and features that depend on third-party services (such as Google APIs) are subject to those services' own availability and rate limits.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Account termination</h2>
            <p>You may stop using the App and disconnect all accounts at any time. We may suspend or terminate access for use that violates these terms or the terms of any connected third-party service.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Limitation of liability</h2>
            <p>To the fullest extent permitted by law, Command Center is not liable for indirect, incidental, or consequential damages arising from use of the App, including content sent or published by you using the App's tools.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Changes to these terms</h2>
            <p>If these terms change materially, the "Last updated" date above will change and we will make reasonable efforts to notify active users.</p>
          </section>

          <section>
            <h2 className="text-headline font-semibold text-base mb-2">Contact</h2>
            <p>Questions about these terms can be sent to <a href="mailto:fullsendorganicks@gmail.com" className="underline" style={{ color: 'var(--accent-bright)' }}>fullsendorganicks@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
