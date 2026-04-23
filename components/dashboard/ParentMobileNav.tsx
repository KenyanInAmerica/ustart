"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ParentMobileNavProps {
  parentEmail: string;
  studentFirstName: string;
}

const PARENT_NAV_SECTIONS = [
  {
    label: "My Student",
    items: [
      { label: "My Student's Plan", href: "/dashboard/parent/plan" },
      { label: "My Student's Content", href: "/dashboard/parent/content" },
    ],
  },
  {
    label: "Parent Hub",
    items: [{ label: "Parent Resources", href: "/dashboard/parent/hub" }],
  },
  {
    label: "Account",
    items: [{ label: "Account", href: "/dashboard/account" }],
  },
] as const;

function ParentTopBar({
  onOpen,
  studentFirstName,
}: {
  onOpen: () => void;
  studentFirstName: string;
}) {
  return (
    <div className="fixed left-0 right-0 top-0 z-[100] flex h-14 items-center justify-between border-b border-[var(--border)] bg-white px-5 min-[860px]:hidden">
      <div>
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
          Parent View
        </p>
        <p className="font-primary text-sm font-bold text-[var(--text)]">
          {studentFirstName}&apos;s UStart
        </p>
      </div>
      <button
        onClick={onOpen}
        aria-label="Open navigation"
        className="cursor-pointer p-1 text-[var(--text-mid)] transition-colors hover:text-[var(--text)]"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export function ParentMobileNav({
  parentEmail,
  studentFirstName,
}: ParentMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string): boolean {
    return pathname === href || (href !== "/dashboard/account" && pathname.startsWith(`${href}/`));
  }

  return (
    <>
      <ParentTopBar
        onOpen={() => setIsOpen(true)}
        studentFirstName={studentFirstName}
      />

      {isOpen && (
        <div className="fixed inset-0 z-[200]">
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute bottom-0 left-0 top-0 flex w-[280px] flex-col overflow-y-auto border-r border-[var(--border)] bg-white py-6">
            <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] px-6 pb-6">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                  Parent View
                </p>
                <p className="font-primary text-sm font-bold text-[var(--text)]">
                  {studentFirstName}&apos;s UStart
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation"
                className="cursor-pointer p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-3">
              {PARENT_NAV_SECTIONS.map((section) => (
                <div key={section.label} className="mb-4">
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-[var(--text)]">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center rounded-[var(--radius-sm)] px-3 py-[9px] text-sm transition-colors duration-150 ${
                          isActive(item.href)
                            ? "bg-[var(--accent)]/10 font-semibold text-[var(--accent)]"
                            : "text-[var(--text-mid)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto border-t border-[var(--border)] px-3 pt-4">
              <p className="px-3 text-[12px] text-[var(--text-muted)]">{parentEmail}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
