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
      <h1 className="font-syne font-extrabold text-2xl tracking-[-0.02em] text-white mb-1">
        Settings
      </h1>
      <p className="text-[13px] text-white/40 mb-8">
        Global configuration for the UStart platform.
      </p>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-6 py-5 mb-6">
        <h2 className="text-[13px] font-medium text-white mb-4">WhatsApp invite link</h2>
        <p className="text-[13px] text-white/50 mb-5 max-w-md">
          This link is shown to students on the community page after they agree to the rules.
          Paste the full invite URL from WhatsApp group settings.
        </p>
        <SettingsForm initialLink={currentLink} />
      </div>

      <PricingSection items={pricingItems} />
    </div>
  );
}
