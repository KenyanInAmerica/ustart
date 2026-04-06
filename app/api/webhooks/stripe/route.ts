// Stripe webhook handler — signature validation and event processing.
// Stub implementation: validates that the route exists; full processing added in Feature 12 (Stripe).
//
// Audit log placeholders — wire up in Feature 12 (Stripe):
//   void logAction({ action: AuditAction.MEMBERSHIP_PURCHASED, ... })
//   void logAction({ action: AuditAction.MEMBERSHIP_UPGRADED, ... })
//   void logAction({ action: AuditAction.ADDON_SUBSCRIBED, ... })
//   void logAction({ action: AuditAction.ADDON_CANCELLED, ... })
//   void logAction({ action: AuditAction.PARENT_PACK_PURCHASED, ... })

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  void request;
  return NextResponse.json({ received: true });
}
