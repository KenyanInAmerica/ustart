"use server";

// Server action for contact form submissions.
// Inserts into contact_submissions table. No email is sent — store only.
// Works for both authenticated and unauthenticated users.

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
