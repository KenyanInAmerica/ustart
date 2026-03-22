"use client";

// Site footer: wordmark, legal links, contact trigger, and copyright.
// "use client" is required because the Contact button calls useContactForm()
// to open the global ContactPanel — no page navigation needed.

import Link from "next/link";
import { useContactForm } from "@/components/ui/ContactFormProvider";

export function Footer() {
  const { open } = useContactForm();

  // Grid layout keeps the center links truly centred regardless of outer column widths.
  // On mobile we collapse to a single flex column.
  return (
    <footer className="border-t border-[rgba(255,255,255,0.07)] px-6 py-7 md-900:px-12 md-900:py-8 grid md-900:grid-cols-[1fr_auto_1fr] items-center gap-4 max-[900px]:flex max-[900px]:flex-col max-[900px]:items-start">
      {/* Wordmark — left column on desktop */}
      <Link
        href="/"
        className="font-syne font-extrabold text-base tracking-[-0.03em] text-white"
      >
        UStart
      </Link>

      {/* Legal and utility links — centre column on desktop */}
      <div className="flex items-center gap-7">
        <Link
          href="/privacy"
          className="text-[13px] text-[rgba(255,255,255,0.45)] hover:text-white transition-colors duration-200"
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className="text-[13px] text-[rgba(255,255,255,0.45)] hover:text-white transition-colors duration-200"
        >
          Terms
        </Link>
        {/* Contact opens the slide-out panel — no page navigation */}
        <button
          onClick={open}
          className="text-[13px] text-[rgba(255,255,255,0.45)] hover:text-white transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer"
        >
          Contact
        </button>
      </div>

      {/* Copyright — right column on desktop, right-aligned */}
      <span className="text-[13px] text-[rgba(255,255,255,0.45)] md-900:text-right">
        &copy; {new Date().getFullYear()} UStart. All rights reserved.
      </span>
    </footer>
  );
}
