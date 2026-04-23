// Async Server Component wrapper for ContentCards.
// Fetches access data once so the content cards can render server-side.

import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { ContentCards } from "@/components/dashboard/ContentCards";

export async function ContentCardsSection() {
  const access = await fetchDashboardAccess();
  return <ContentCards access={access} />;
}
