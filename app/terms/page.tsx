import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import { ContactTriggerLink } from "@/components/ui/ContactTriggerLink";

const LAST_UPDATED = "March 20, 2026";

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-[760px] bg-[var(--bg)] px-6 pb-20 pt-28 md-900:px-12">
        <div className="mb-12">
          <h1 className="mb-3 font-primary text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.03em] text-[var(--text)]">
            Terms of Service
          </h1>
          <p className="text-[13px] text-[var(--text-muted)]">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10 font-primary text-[15px] leading-relaxed text-[var(--text)]">
          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">1. Agreement to Terms</h2>
            <p>
              By accessing or using UStart (&ldquo;the Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not access or use the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">2. Description of Service</h2>
            <p>
              UStart is a paid-access resource portal for international students navigating life in the
              United States. Content is provided for informational purposes only and does not constitute legal,
              financial, or tax advice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">3. Membership and Access</h2>
            <p className="mb-3">Access to the Platform is granted upon purchase of a membership tier or add-on:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><span className="font-medium text-[var(--text)]">Lite, Pro, and Premium</span> are lifetime memberships — you pay once and retain access permanently, subject to these Terms.</li>
              <li><span className="font-medium text-[var(--text)]">Parent Pack</span> is a lifetime add-on that creates a separate linked account for a parent or guardian.</li>
              <li><span className="font-medium text-[var(--text)]">Explore and Concierge</span> are recurring subscription add-ons available only to existing lifetime members.</li>
            </ul>
            <p className="mt-3">Membership is personal and non-transferable. Sharing account credentials with others is prohibited and may result in account suspension.</p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">4. Payments and Refunds</h2>
            <p className="mb-3">All purchases are processed by Stripe. By completing a purchase, you authorise the applicable charge.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><span className="font-medium text-[var(--text)]">Lifetime purchases</span> are final and non-refundable once access has been granted, except where required by applicable law.</li>
              <li><span className="font-medium text-[var(--text)]">Recurring subscriptions</span> may be cancelled at any time; access continues until the end of the current billing period.</li>
              <li>Price changes for recurring subscriptions will be communicated in advance.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">5. Content and Intellectual Property</h2>
            <p>
              All content on the Platform is owned by or licensed to UStart and protected by copyright law.
              Your membership grants you a personal, non-exclusive, non-transferable licence to access and use the content for your own informational purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">6. Prohibited Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Share your account login or make the Platform accessible to unauthorised users.</li>
              <li>Scrape, copy, or reproduce Platform content in bulk.</li>
              <li>Use the Platform for any unlawful purpose.</li>
              <li>Attempt to gain unauthorised access to any part of the Platform.</li>
              <li>Post or transmit offensive, defamatory, or harmful content in any community feature.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">7. Community Features</h2>
            <p>
              Participation in community spaces requires acceptance of the Community Rules displayed within the Platform. We reserve the right to remove any user from the community space for violating those rules.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">8. Disclaimers</h2>
            <p>
              The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind. Content on the Platform is for informational purposes only and does not constitute legal, financial, immigration, or tax advice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, UStart shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">10. Account Suspension and Termination</h2>
            <p>
              We may suspend or deactivate your account if we determine, in our sole discretion, that you have violated these Terms. You may request account deletion at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the United States.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-primary text-lg font-bold text-[var(--text)]">13. Contact</h2>
            <p>
              Questions about these Terms? Reach us via the <ContactTriggerLink /> on our website.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
