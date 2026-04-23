// Admin settings page — global links and pricing management.

import { fetchAdminSettingsValues } from "@/lib/admin/data";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PricingSection } from "@/components/admin/PricingSection";
import { getPricing } from "@/lib/config/getPricing";

export default async function AdminSettingsPage() {
  const [settings, pricingItems] = await Promise.all([
    fetchAdminSettingsValues(),
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
        <h2 className="mb-4 text-[13px] font-medium text-[var(--text)]">Platform links</h2>
        <p className="mb-5 max-w-md text-[13px] text-[var(--text-muted)]">
          Manage the external links used across the dashboard and Parent Pack flows.
        </p>
        <SettingsForm initialValues={settings} />
      </div>

      <PricingSection items={pricingItems} />
    </div>
  );
}
