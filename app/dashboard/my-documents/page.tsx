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
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-1">
        My Documents
      </h1>
      <p className="font-dm-sans text-sm text-white/45 mb-8">
        PDFs assigned to you directly by UStart.
      </p>
      <ContentGrid items={documents} />
    </div>
  );
}
