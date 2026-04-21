import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import { ContactTriggerLink } from "@/components/ui/ContactTriggerLink";

const LAST_UPDATED = "March 20, 2026";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-[760px] bg-[var(--bg)] px-6 pb-20 pt-28 md-900:px-12">
        <div className="mb-12">
          <h1 className="mb-3 font-primary text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.03em] text-[var(--text)]">
            Privacy Policy
          </h1>
          <p className="text-[13px] text-[var(--text-muted)]">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10 font-primary text-[15px] leading-relaxed text-[var(--text)]">
          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">1. Who We Are</h2>
            <p>
              UStart (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the UStart platform, a paid-access
              resource portal helping international students navigate life in the United States — including
              banking, credit, tax filing, and government services. This Privacy Policy explains how we
              collect, use, disclose, and protect information about you when you use our website and
              services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">2. Information We Collect</h2>
            <p className="mb-3">We collect the following categories of information:</p>
            <ul className="list-disc space-y-2 pl-5 text-[var(--text)]">
              <li><span className="font-medium text-[var(--text)]">Account information</span> — your email address, first and last name, university name, phone number, and country of origin, provided when you create an account or update your profile.</li>
              <li><span className="font-medium text-[var(--text)]">Purchase information</span> — membership tier, purchase date, and subscription status. Payment card data is processed exclusively by Stripe and never stored on our servers.</li>
              <li><span className="font-medium text-[var(--text)]">Usage data</span> — pages visited, content accessed, and session timestamps, collected automatically to personalise your experience and improve the platform.</li>
              <li><span className="font-medium text-[var(--text)]">Communications</span> — messages you send via our contact form, including name, email address, and message content.</li>
              <li><span className="font-medium text-[var(--text)]">Parent account data</span> — if you purchase a Parent Pack, we create a separate linked account for the parent email address you provide.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Provide, operate, and maintain the UStart platform.</li>
              <li>Verify your membership tier and grant access to the appropriate content library.</li>
              <li>Process payments and manage billing through Stripe.</li>
              <li>Send transactional emails (sign-in links, purchase confirmations) via Resend.</li>
              <li>Respond to your support and contact requests.</li>
              <li>Analyse platform usage with PostHog to improve features and content.</li>
              <li>Comply with legal obligations and enforce our Terms of Service.</li>
            </ul>
            <p className="mt-3">We do not sell your personal information. We do not use your data for targeted advertising.</p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">4. Legal Basis for Processing</h2>
            <p>
              For users in the European Economic Area, United Kingdom, or other jurisdictions with similar
              requirements, our legal bases for processing personal data are: (a) contract performance —
              processing necessary to deliver the services you purchased; (b) legitimate interests — usage
              analytics and platform security; and (c) legal obligation — where required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">5. Data Sharing</h2>
            <p className="mb-3">We share your information only with service providers that help us operate the platform:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><span className="font-medium text-[var(--text)]">Supabase</span> — authentication and database hosting (United States).</li>
              <li><span className="font-medium text-[var(--text)]">Stripe</span> — payment processing. Stripe&apos;s privacy policy governs how they handle payment data.</li>
              <li><span className="font-medium text-[var(--text)]">Resend</span> — transactional email delivery.</li>
              <li><span className="font-medium text-[var(--text)]">PostHog</span> — product analytics (pseudonymised usage events only).</li>
              <li><span className="font-medium text-[var(--text)]">Vercel</span> — hosting and edge infrastructure.</li>
            </ul>
            <p className="mt-3">Each provider is bound by data processing agreements and is prohibited from using your data for their own commercial purposes.</p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">6. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. If you request
              account deletion, we will deactivate your account and delete or anonymise your personal data
              within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">7. Your Rights</h2>
            <p className="mb-3">Depending on your location, you may have the right to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Access a copy of the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Object to or restrict certain processing activities.</li>
              <li>Receive your data in a portable, machine-readable format.</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us using the form on our website or at the email address below.</p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies for session management and analytics. Analytics cookies
              collect pseudonymised usage data. You can disable non-essential cookies in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">9. Security</h2>
            <p>
              We implement industry-standard safeguards including encrypted connections, hashed session
              tokens, and role-based access controls. No method of transmission over the internet is 100%
              secure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">10. Children&apos;s Privacy</h2>
            <p>
              UStart is intended for users aged 18 and over. We do not knowingly collect personal information
              from children under 13.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last
              updated&rdquo; date at the top.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your data rights, please
              reach out via the <ContactTriggerLink /> on our website.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
