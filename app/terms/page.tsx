// Static Terms of Service page — placeholder copy pending legal review.
// No auth required; accessible to all visitors.

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { ContactTriggerLink } from "@/components/ui/ContactTriggerLink";

const LAST_UPDATED = "March 20, 2026";

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <main className="pt-28 pb-20 px-6 md-900:px-12 max-w-[760px] mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-syne font-extrabold text-[clamp(28px,4vw,40px)] tracking-[-0.03em] text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-[13px] text-white/40">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10 font-dm-sans text-[15px] text-white/70 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using UStart (&ldquo;the Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;,
              or &ldquo;us&rdquo;), you agree to be bound by these Terms of Service. If you do not agree,
              do not access or use the Platform. These Terms apply to all users, including visitors,
              registered members, and administrators.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">2. Description of Service</h2>
            <p>
              UStart is a paid-access resource portal for international students navigating life in the
              United States. The Platform provides educational content, PDF guides, and community resources
              covering topics including banking, credit cards, Social Security Numbers, taxes, and related
              subjects. Content is provided for informational purposes only and does not constitute legal,
              financial, or tax advice.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">3. Membership and Access</h2>
            <p className="mb-3">
              Access to the Platform is granted upon purchase of a membership tier or add-on:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-white/90 font-medium">Lite, Pro, and Premium</span> are lifetime
                memberships — you pay once and retain access permanently, subject to these Terms.
              </li>
              <li>
                <span className="text-white/90 font-medium">Parent Pack</span> is a lifetime add-on that
                creates a separate linked account for a parent or guardian. It is not transferable.
              </li>
              <li>
                <span className="text-white/90 font-medium">Explore and Concierge</span> are recurring
                subscription add-ons available only to existing lifetime members. Access is contingent on
                your subscription remaining active and payments being up to date.
              </li>
            </ul>
            <p className="mt-3">
              Membership is personal and non-transferable. Sharing account credentials with others is
              prohibited and may result in account suspension.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">4. Payments and Refunds</h2>
            <p className="mb-3">
              All purchases are processed by Stripe. By completing a purchase, you authorise the applicable
              charge.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-white/90 font-medium">Lifetime purchases</span> are final and
                non-refundable once access has been granted, except where required by applicable consumer
                protection law.
              </li>
              <li>
                <span className="text-white/90 font-medium">Recurring subscriptions</span> (Explore,
                Concierge) are billed monthly or annually as selected at checkout. You may cancel at any
                time; access continues until the end of the current billing period.
              </li>
              <li>
                Price changes for recurring subscriptions will be communicated at least 14 days in advance.
                Continued use after a price change constitutes acceptance.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">5. Content and Intellectual Property</h2>
            <p className="mb-3">
              All content on the Platform — including guides, PDFs, text, graphics, and course materials —
              is owned by or licensed to UStart and protected by copyright law.
            </p>
            <p>
              Your membership grants you a personal, non-exclusive, non-transferable licence to access and
              use the content for your own informational purposes. You may not copy, redistribute, resell,
              republish, or create derivative works from any Platform content without our express written
              consent.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">6. Prohibited Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Share your account login or make the Platform accessible to unauthorised users.</li>
              <li>Scrape, copy, or reproduce Platform content in bulk by automated or manual means.</li>
              <li>Use the Platform for any unlawful purpose or in violation of any applicable law.</li>
              <li>Attempt to gain unauthorised access to any part of the Platform or its infrastructure.</li>
              <li>Post or transmit offensive, defamatory, or harmful content in any community feature.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">7. Community Features</h2>
            <p>
              Certain membership tiers include access to a community space (for example, a private group
              chat). Participation requires acceptance of the Community Rules displayed within the Platform.
              We reserve the right to remove any user from the community space for violating those rules,
              without affecting their access to other paid content.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">8. Disclaimers</h2>
            <p className="mb-3">
              The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
              of any kind, express or implied, including but not limited to warranties of merchantability,
              fitness for a particular purpose, or non-infringement.
            </p>
            <p>
              Content on the Platform is for informational purposes only. UStart is not a law firm,
              financial adviser, or tax professional. Nothing on the Platform constitutes legal, financial,
              immigration, or tax advice. Always consult a qualified professional for advice specific to your
              situation.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, UStart shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising out of or related to your use
              of the Platform, even if we have been advised of the possibility of such damages. Our total
              liability to you for any claim arising out of or relating to these Terms or the Platform shall
              not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">10. Account Suspension and Termination</h2>
            <p>
              We may suspend or deactivate your account if we determine, in our sole discretion, that you
              have violated these Terms. For lifetime memberships, we will attempt to remedy the issue with
              a warning before suspension. Subscription add-ons may be terminated immediately upon a
              material breach. You may request account deletion at any time by contacting us.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the United States.
              Any disputes arising under these Terms shall be resolved through binding arbitration in
              accordance with the rules of the American Arbitration Association, except where prohibited by
              law.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we do, we will update the &ldquo;Last
              updated&rdquo; date at the top of this page. If a change materially affects your rights, we
              will notify you by email. Continued use of the Platform after changes take effect constitutes
              your acceptance of the revised Terms.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="font-syne font-bold text-lg text-white mb-3">13. Contact</h2>
            <p>
              Questions about these Terms? Reach us via the <ContactTriggerLink /> on our website. We aim to respond within 5 business days.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}
