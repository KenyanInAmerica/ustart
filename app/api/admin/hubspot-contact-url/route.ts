import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getHubSpotContactDirectUrl } from "@/lib/hubspot/contacts";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: profileData } = await service
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    const profile = profileData as { is_admin: boolean | null } | null;
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ url: null });
    }

    const url = await getHubSpotContactDirectUrl(email);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null });
  }
}
