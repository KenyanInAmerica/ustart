"use client";

// Inline text trigger that opens the global ContactPanel.
// Used in legal pages (Privacy, Terms) where the content is server-rendered
// but we still need to open the client-side contact panel on click.

import { useContactForm } from "@/components/ui/ContactFormProvider";

export function ContactTriggerLink() {
  const { open } = useContactForm();

  return (
    <button
      onClick={open}
      className="cursor-pointer border-none bg-transparent p-0 text-[var(--accent)] underline underline-offset-2 transition-opacity hover:opacity-80"
    >
      contact form
    </button>
  );
}
