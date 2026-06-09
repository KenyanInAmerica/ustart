// Shell layout for the admin portal — wraps all /admin/* pages.
// Renders the fixed 220px AdminSidebar and a scrollable main content area.
// Route protection lives in middleware.ts (is_admin check) so no auth guard here.

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { fetchPendingDocumentSubmissionCount } from "@/lib/admin/data";

export const metadata = {
  title: "UStart Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingDocumentCount = await fetchPendingDocumentSubmissionCount();

  return (
    <div className="min-h-screen bg-[var(--bg)] font-primary text-[var(--text)]">
      <AdminSidebar pendingDocumentCount={pendingDocumentCount} />
      <main className="ml-[220px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
