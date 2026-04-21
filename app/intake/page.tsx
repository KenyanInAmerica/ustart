import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { brand } from "@/lib/config/brand";
import { createClient } from "@/lib/supabase/server";
import { IntakeForm } from "./IntakeForm";

type ProfileRow = {
  intake_completed_at: string | null;
};

export default async function IntakePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data } = await supabase
    .from("profiles")
    .select("intake_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileRow | null;

  if (profile?.intake_completed_at) {
    return redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-16">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="mb-6 block text-center font-primary text-2xl font-bold tracking-[-0.03em] text-[var(--accent)]"
        >
          {brand.name}
        </Link>
        <Card
          className="border border-[var(--border)]"
          padding="lg"
        >
          <IntakeForm />
        </Card>
      </div>
    </main>
  );
}
