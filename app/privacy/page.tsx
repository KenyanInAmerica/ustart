// Static Privacy Policy page — placeholder copy pending legal review.
// No auth required; accessible to all visitors.

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { ContactTriggerLink } from "@/components/ui/ContactTriggerLink";

const LAST_UPDATED = "March 20, 2026";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <main className="pt-28 pb-20 px-6 md-900:px-12 max-w-[760px] mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-syne font-extrabold text-[clamp(28px,4vw,40px)] tracking-[-0.03em] text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-[13px] text-white/40">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose-section space-y-10 font-dm-sans text-[15px] text-white/70 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">1. Who We Are</h2>
            <p>
              UStart (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the UStart platform, a paid-access
              resource portal helping international students navigate life in the United States — including
              banking, credit, tax filing, and government services. This Privacy Policy explains how we
              collect, use, disclose, and protect information about you when you use our website and
              services.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-white/90 font-medium">Account information</span> — your email address,
                first and last name, university name, phone number, and country of origin, provided when you
                create an account or update your profile.
              </li>
              <li>
                <span className="text-white/90 font-medium">Purchase information</span> — membership tier,
                purchase date, and subscription status. Payment card data is processed exclusively by Stripe
                and never stored on our servers.
              </li>
              <li>
                <span className="text-white/90 font-medium">Usage data</span> — pages visited, content
                accessed, and session timestamps, collected automatically to personalise your experience and
                improve the platform.
              </li>
              <li>
                <span className="text-white/90 font-medium">Communications</span> — messages you send via our
                contact form, including name, email address, and message content.
              </li>
              <li>
                <span className="text-white/90 font-medium">Parent account data</span> — if you purchase a
                Parent Pack, we create a separate linked account for the parent email address you provide.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, operate, and maintain the UStart platform.</li>
              <li>Verify your membership tier and grant access to the appropriate content library.</li>
              <li>Process payments and manage billing through Stripe.</li>
              <li>Send transactional emails (sign-in links, purchase confirmations) via Resend.</li>
              <li>Respond to your support and contact requests.</li>
              <li>Analyse platform usage with PostHog to improve features and content.</li>
              <li>Comply with legal obligations and enforce our Terms of Service.</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information. We do not use your data for targeted advertising.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">4. Legal Basis for Processing</h2>
            <p>
              For users in the European Economic Area, United Kingdom, or other jurisdictions with similar
              requirements, our legal bases for processing personal data are: (a) contract performance —
              processing necessary to deliver the services you purchased; (b) legitimate interests — usage
              analytics and platform security; and (c) legal obligation — where required by applicable law.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">5. Data Sharing</h2>
            <p className="mb-3">
              We share your information only with service providers that help us operate the platform:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-white/90 font-medium">Supabase</span> — authentication and database
                hosting (United States).
              </li>
              <li>
                <span className="text-white/90 font-medium">Stripe</span> — payment processing. Stripe&apos;s
                privacy policy governs how they handle payment data.
              </li>
              <li>
                <span className="text-white/90 font-medium">Resend</span> — transactional email delivery.
              </li>
              <li>
                <span className="text-white/90 font-medium">PostHog</span> — product analytics (pseudonymised
                usage events only).
              </li>
              <li>
                <span className="text-white/90 font-medium">Vercel</span> — hosting and edge infrastructure.
              </li>
            </ul>
            <p className="mt-3">
              Each provider is bound by data processing agreements and is prohibited from using your data for
              their own commercial purposes.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. If you request
              account deletion, we will deactivate your account and delete or anonymise your personal data
              within 30 days, except where retention is required by law (for example, financial records that
              must be kept for tax purposes).
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access a copy of the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Request deletion of your personal data (&ldquo;right to be forgotten&rdquo;).</li>
              <li>Object to or restrict certain processing activities.</li>
              <li>Receive your data in a portable, machine-readable format.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us using the form on our website or at the email
              address below.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies for session management (essential) and analytics
              (PostHog). Analytics cookies collect pseudonymised usage data. You can disable non-essential
              cookies in your browser settings; this will not affect your access to paid content.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">9. Security</h2>
            <p>
              We implement industry-standard safeguards including encrypted connections (TLS), hashed session
              tokens, and role-based access controls. No method of transmission over the internet is 100%
              secure. We will notify you promptly in the event of a breach that affects your personal data.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>
              UStart is intended for users aged 18 and over. We do not knowingly collect personal information
              from children under 13. If you believe a child has provided us with personal data, please
              contact us immediately.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last
              updated&rdquo; date at the top. Continued use of the platform after changes constitutes your
              acceptance of the revised policy.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your data rights, please
              reach out via the <ContactTriggerLink /> on our website. We will respond within 5 business days.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}
