// Async Server Component wrapper for AccountStrip.
// Owns the fetchDashboardAccess call so the account strip streams in
// independently rather than blocking behind the ContentCards pricing fetches.

import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { AccountStrip } from "@/components/dashboard/AccountStrip";

export async function AccountStripSection() {
  const access = await fetchDashboardAccess();
  return <AccountStrip access={access} />;
}
