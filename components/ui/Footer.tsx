"use client";

// Site footer: wordmark, legal links, contact trigger, and copyright.
// "use client" is required because the Contact button calls useContactForm()
// to open the global ContactPanel — no page navigation needed.

import Link from "next/link";
import { useContactForm } from "@/components/ui/ContactFormProvider";
import { brand } from "@/lib/config/brand";

export function Footer() {
  const { open } = useContactForm();

  // Grid layout keeps the center links truly centred regardless of outer column widths.
  // On mobile we collapse to a single flex column.
  return (
    <footer className="grid items-center gap-4 border-t border-[var(--border)] bg-[var(--bg-subtle)] px-6 py-7 max-[900px]:flex max-[900px]:flex-col max-[900px]:items-start md-900:grid-cols-[1fr_auto_1fr] md-900:px-12 md-900:py-8">
      {/* Wordmark — left column on desktop */}
      <Link
        href="/"
        className="font-primary text-base font-extrabold tracking-[-0.03em] text-[var(--text)]"
      >
        {brand.name}
      </Link>

      {/* Legal and utility links — centre column on desktop */}
      <div className="flex items-center gap-7">
        <Link
          href="/privacy"
          className="text-[13px] text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text)]"
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className="text-[13px] text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text)]"
        >
          Terms
        </Link>
        {/* Contact opens the slide-out panel — no page navigation */}
        <button
          onClick={open}
          className="cursor-pointer border-none bg-transparent p-0 text-[13px] text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text)]"
        >
          Contact
        </button>
      </div>

      {/* Copyright — right column on desktop, right-aligned */}
      <span className="text-[13px] text-[var(--text-muted)] md-900:text-right">
        &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
      </span>
    </footer>
  );
}
