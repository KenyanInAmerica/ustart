"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface ParentSidebarProps {
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
    items: [{ label: "Account", href: "/dashboard/account", exact: true }],
  },
] as const;

export function ParentSidebar({
  parentEmail,
  studentFirstName,
}: ParentSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean): boolean {
    return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-[240px] flex-col overflow-y-auto border-r border-[var(--border)] bg-white py-7 min-[860px]:flex">
      <div className="px-6">
        <Link
          href="/dashboard/parent/plan"
          className="mb-5 flex items-center gap-2.5"
        >
          <Image
            src="/images/logomark-navy.png"
            alt=""
            width={40}
            height={40}
            priority
            className="h-10 w-auto flex-shrink-0"
          />
          <span className="text-xl font-semibold tracking-tight text-[#1C2B3A]">
            UStart
          </span>
        </Link>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
          Parent View
        </p>
        <p className="font-primary text-sm font-bold text-[var(--text)]">
          {studentFirstName}&apos;s UStart
        </p>
        <div className="my-3 border-b border-[var(--border)]" />
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
                  className={`flex items-center rounded-[var(--radius-sm)] px-3 py-[9px] text-sm transition-colors duration-150 ${
                    isActive(item.href, "exact" in item ? item.exact : false)
                      ? "bg-[var(--accent)]/10 font-semibold text-[var(--accent)]"
                      : "text-[var(--text-mid)] hover:bg-[#E54B4B]/5 hover:text-[#E54B4B]"
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
    </aside>
  );
}
