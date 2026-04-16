"use server";

// Server action for contact form submissions.
// Inserts into contact_submissions, then sends an admin notification via Resend.
// The Resend call is best-effort — a send failure does not fail the action since
// the submission is already persisted and can be retrieved from the DB.
// Works for both authenticated and unauthenticated users.

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resend } from "@/lib/resend/client";
import { contactNotificationEmail } from "@/lib/resend/templates/contactNotification";

type ActionResult = { success: true } | { success: false; error: string };

interface ContactFormInput {
  name: string;
  email: string;
  message: string;
}

export async function submitContactForm(
  input: ContactFormInput
): Promise<ActionResult> {
  try {
    const { name, email, message } = input;

    if (!name.trim() || !email.trim() || !message.trim()) {
      return { success: false, error: "All fields are required." };
    }

    // Optional auth check — attach user_id if signed in, null if not.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const service = createServiceClient();
    const { error } = await service.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      // Links submission to account when signed in; null for anonymous contact.
      user_id: user?.id ?? null,
    });

    if (error) return { success: false, error: error.message };

    // Send admin notification — best-effort, does not block success.
    // If Resend is unavailable the submission is still stored in contact_submissions.
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: process.env.RESEND_NOTIFICATION_EMAIL!,
        subject: "New contact form submission — UStart",
        html: contactNotificationEmail({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          userId: user?.id ?? null,
        }),
      });
    } catch (emailErr) {
      console.error("[contactForm] Resend notification failed:", emailErr);
    }

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
