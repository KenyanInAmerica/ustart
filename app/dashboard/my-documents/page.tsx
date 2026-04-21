import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserDocuments } from "@/lib/dashboard/content";
import { ContentGrid } from "@/components/dashboard/ContentGrid";

// My Documents page — shows all PDFs individually assigned to this user
// by an admin via user_content_items. Unlike the tier pages, any authenticated
// user can reach this route (the nav item is never locked).
export default async function MyDocumentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const documents = await fetchUserDocuments(user.id);

  return (
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        My Documents
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        PDFs assigned to you directly by UStart.
      </p>
      <ContentGrid items={documents} />
    </div>
  );
}
