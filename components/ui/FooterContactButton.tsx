"use client";

import { useContactForm } from "@/components/ui/ContactFormProvider";

export function FooterContactButton() {
  const { open } = useContactForm();

  return (
    <button
      type="button"
      onClick={open}
      className="mb-2 block w-fit cursor-pointer border-none bg-transparent p-0 text-left text-sm text-[#F2F1EF]/70 transition-colors duration-150 hover:text-[#E54B4B] md-900:ml-auto md-900:text-right"
    >
      Contact
    </button>
  );
}
