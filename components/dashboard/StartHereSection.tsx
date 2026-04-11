// Async Server Component wrapper for StartHere.
// Owns the fetchDashboardAccess call so StartHere streams in independently
// rather than blocking on the page-level Promise.all.

import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { StartHere } from "@/components/dashboard/StartHere";

export async function StartHereSection() {
  const access = await fetchDashboardAccess();
  return (
    <StartHere
      hasMembership={access.hasMembership}
      hasAccessedContent={access.hasAccessedContent}
      hasAgreedToCommunity={access.hasAgreedToCommunity}
      role={access.role}
    />
  );
}
