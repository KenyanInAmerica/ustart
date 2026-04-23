import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentCardsSection } from "@/components/dashboard/ContentCardsSection";

export default async function DashboardContentPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();

  const profile = profileData as { role: "student" | "parent" | null } | null;

  if (profile?.role === "parent") {
    redirect("/dashboard/parent/content");
  }

  return (
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        My Content
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Access your UStart resources.
      </p>
      <ContentCardsSection />
    </div>
  );
}
