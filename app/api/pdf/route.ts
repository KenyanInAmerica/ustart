/** @jest-environment node */
// Route Handler: GET /api/pdf?content_item_id=<uuid>
//
// Verifies the authenticated user is entitled to view the requested PDF,
// then streams the watermarked PDF bytes as a binary response.
//
// Entitlement rules:
//   - is_individual_only items: user must have a user_content_items row
//   - tier items: user (or linked student for parent accounts) must meet the
//     tier rank / add-on flag requirements
//
// Returns the watermarked PDF with Content-Type: application/pdf on success,
// or a JSON error with the appropriate HTTP status code.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchAndWatermarkPdf } from "@/lib/pdf/fetch";

type ProfileRow = {
  role: string | null;
  student_id: string | null;
  email: string | null;
} | null;

export async function GET(request: NextRequest) {
  try {
    const contentItemId = new URL(request.url).searchParams.get(
      "content_item_id"
    );
    if (!contentItemId) {
      return NextResponse.json(
        { error: "Missing content_item_id" },
        { status: 400 }
      );
    }

    // Verify session — getUser() validates against the Auth server, not just cookies.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = createServiceClient();

    // Fetch the content item to check its tier and individual flag.
    const { data: itemData } = await service
      .from("content_items")
      .select("id, tier, file_path, is_individual_only")
      .eq("id", contentItemId)
      .maybeSingle();

    if (!itemData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = itemData as {
      id: string;
      tier: string;
      file_path: string;
      is_individual_only: boolean;
    };

    let authorized = false;
    // Hoisted so the email field is accessible after the if/else for watermarking.
    let profile: ProfileRow = null;

    if (item.is_individual_only) {
      // Individually assigned PDF — must have an explicit user_content_items row.
      const { data: assignment } = await service
        .from("user_content_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("content_item_id", contentItemId)
        .maybeSingle();
      authorized = !!assignment;
    } else {
      // Tier-based content — check entitlements.
      // Parents inherit entitlements from their linked student, so resolve the
      // correct user ID before querying user_access.
      // email is fetched here too — reused below for watermarking, avoiding a second round-trip.
      const { data: profileData } = await service
        .from("profiles")
        .select("role, student_id, email")
        .eq("id", user.id)
        .maybeSingle();

      profile = profileData as ProfileRow;

      const entitlementUserId =
        profile?.role === "parent" && profile.student_id
          ? profile.student_id
          : user.id;

      const { data: accessData } = await service
        .from("user_access")
        .select("membership_rank, has_parent_seat")
        .eq("id", entitlementUserId)
        .maybeSingle();

      const ua = accessData as {
        membership_rank: number | null;
        has_parent_seat: boolean | null;
      } | null;

      if (ua) {
        const rank = ua.membership_rank ?? 0;
        switch (item.tier) {
          case "lite":
            authorized = rank >= 1;
            break;
          case "explore":
            authorized = rank >= 2;
            break;
          case "concierge":
            authorized = rank >= 3;
            break;
          case "parent_pack":
            authorized = ua.has_parent_seat === true;
            break;
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Resolve the email for watermarking — use the profile fetched above for
    // tier-based items; fall back to auth metadata for individually-assigned items
    // (where no profiles query was needed for access control).
    const email = profile?.email ?? user.email ?? "unknown";

    const pdfBytes = await fetchAndWatermarkPdf(item.file_path, email);

    // Stream the watermarked bytes. The client fetches this as a blob and
    // passes it to react-pdf — the raw URL is never exposed to the browser.
    // Cache-Control: no-store prevents caching so every request goes through
    // the auth + entitlement checks above.
    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[/api/pdf] unhandled error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
