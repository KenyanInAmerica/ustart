// Admin settings page — WhatsApp invite link and pricing management.
// Pre-fills the WhatsApp form with the current stored value from the config table.

import { fetchAdminWhatsappLink } from "@/lib/admin/data";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PricingSection } from "@/components/admin/PricingSection";
import { getPricing } from "@/lib/config/getPricing";

export default async function AdminSettingsPage() {
  // Fetch whatsapp link and all pricing rows in parallel.
  const [currentLink, pricingItems] = await Promise.all([
    fetchAdminWhatsappLink(),
    getPricing(),
  ]);

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
        Settings
      </h1>
      <p className="mb-8 text-[13px] text-[var(--text-muted)]">
        Global configuration for the UStart platform.
      </p>

      <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-5">
        <h2 className="mb-4 text-[13px] font-medium text-[var(--text)]">WhatsApp invite link</h2>
        <p className="mb-5 max-w-md text-[13px] text-[var(--text-muted)]">
          This link is shown to students on the community page after they agree to the rules.
          Paste the full invite URL from WhatsApp group settings.
        </p>
        <SettingsForm initialLink={currentLink} />
      </div>

      <PricingSection items={pricingItems} />
    </div>
  );
}
