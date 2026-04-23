import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/components/ui/Footer";
import { ParentMobileNav } from "@/components/dashboard/ParentMobileNav";
import { ParentSidebar } from "@/components/dashboard/ParentSidebar";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

interface ParentShellProps {
  studentFirstName: string;
  studentLastName: string | null;
  children: React.ReactNode;
}

export async function ParentShell({
  studentFirstName,
  studentLastName,
  children,
}: ParentShellProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const studentDisplayName = studentLastName
    ? `${studentFirstName} ${studentLastName}`
    : studentFirstName;

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <ParentSidebar
        parentEmail={user?.email ?? ""}
        studentFirstName={studentFirstName}
      />

      <ParentMobileNav
        parentEmail={user?.email ?? ""}
        studentFirstName={studentFirstName}
      />

      <main className="flex flex-1 flex-col bg-[var(--bg)] px-5 pb-0 pt-[80px] min-[860px]:ml-[240px] min-[860px]:px-[56px] min-[860px]:pt-[48px]">
        <div className="mx-auto flex-1 w-full max-w-5xl pb-8">
          <div className="mb-6 hidden justify-end border-b border-[var(--border)] px-6 py-4 min-[860px]:flex">
            <div className="w-fit">
              <SignOutButton />
            </div>
          </div>
          <div className="mb-6 hidden min-[860px]:block">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
              Parent View
            </p>
            <p className="font-primary text-2xl font-bold text-[var(--text)]">
              {studentDisplayName}&apos;s UStart
            </p>
          </div>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
