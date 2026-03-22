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
      className="text-white underline underline-offset-2 hover:opacity-80 transition-opacity bg-transparent border-none p-0 cursor-pointer"
    >
      contact form
    </button>
  );
}
