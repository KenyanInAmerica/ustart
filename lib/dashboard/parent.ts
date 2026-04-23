import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface ParentStudentContext {
  studentId: string | null;
  studentFirstName: string;
  studentLastName: string | null;
  shareTasks: boolean;
  shareCalendar: boolean;
  shareContent: boolean;
  membershipTier: string | null;
  membershipRank: number;
}

type ParentProfileRow = {
  role: "student" | "parent" | null;
  student_id: string | null;
};

export async function fetchParentStudentContext(): Promise<ParentStudentContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const service = createServiceClient();
  const { data: parentProfileData } = await service
    .from("profiles")
    .select("role, student_id")
    .eq("id", user.id)
    .maybeSingle();

  const parentProfile = parentProfileData as ParentProfileRow | null;

  if (parentProfile?.role !== "parent") redirect("/dashboard");

  if (!parentProfile.student_id) {
    return {
      studentId: null,
      studentFirstName: "Your student",
      studentLastName: null,
      shareTasks: false,
      shareCalendar: false,
      shareContent: false,
      membershipTier: null,
      membershipRank: 0,
    };
  }

  const [{ data: studentProfileData }, { data: sharingData }, { data: accessData }] =
    await Promise.all([
      service
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", parentProfile.student_id)
        .maybeSingle(),
      service
        .from("parent_invitations")
        .select("share_tasks, share_calendar, share_content")
        .eq("student_id", parentProfile.student_id)
        .eq("status", "accepted")
        .maybeSingle(),
      service
        .from("user_access")
        .select("membership_tier, membership_rank")
        .eq("id", parentProfile.student_id)
        .maybeSingle(),
    ]);

  const studentProfile = studentProfileData as {
    first_name: string | null;
    last_name: string | null;
  } | null;
  const sharing = sharingData as {
    share_tasks: boolean | null;
    share_calendar: boolean | null;
    share_content: boolean | null;
  } | null;
  const access = accessData as {
    membership_tier: string | null;
    membership_rank: number | null;
  } | null;

  return {
    studentId: parentProfile.student_id,
    studentFirstName: studentProfile?.first_name ?? "Your student",
    studentLastName: studentProfile?.last_name ?? null,
    shareTasks: sharing?.share_tasks !== false,
    shareCalendar: sharing?.share_calendar !== false,
    shareContent: sharing?.share_content !== false,
    membershipTier: access?.membership_tier ?? null,
    membershipRank: access?.membership_rank ?? 0,
  };
}
