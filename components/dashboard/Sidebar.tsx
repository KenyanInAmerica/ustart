"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections, isNavItemLocked } from "@/components/dashboard/navItems";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { brand } from "@/lib/config/brand";
import { accentHexByProduct, type ProductAccent } from "@/lib/config/productAccents";
import type { DashboardAccess } from "@/types";

type Props = {
  userEmail: string;
  userInitials: string;
  planName: string;
  access: DashboardAccess;
};

function navAccent(href: string): ProductAccent {
  switch (href) {
    case "/dashboard/community":
      return "community";
    case "/dashboard/content/parent-pack":
      return "parent_pack";
    default:
      return "default";
  }
}

function activeClassName(href: string): string {
  const hex = accentHexByProduct[navAccent(href)];
  return `bg-[${hex}]/10 font-semibold text-[${hex}]`;
}

export function Sidebar({ userEmail, userInitials, planName, access }: Props) {
  const pathname = usePathname();
  const itemClassName =
    "flex items-center gap-[10px] rounded-[var(--radius-sm)] px-3 py-[9px] text-sm transition-colors duration-150";
  const inactiveClassName =
    "text-[var(--text-mid)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]";

  function isActiveHref(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/content") return pathname === href;
    if (href === "/dashboard/content/parent-pack") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-[240px] flex-col overflow-y-auto border-r border-[var(--border)] bg-white py-7 min-[860px]:flex">
      <Link
        href="/"
        className="mb-5 border-b border-[var(--border)] px-6 pb-7 font-primary text-[18px] font-extrabold tracking-[-0.03em] text-[var(--text)]"
      >
        {brand.name}
      </Link>

      <nav className="flex-1">
        {navSections.map((section, sIdx) => (
          <div key={section.label} className="mb-1 px-3">
            <span
              className={`mb-1 block px-3 text-xs font-semibold uppercase tracking-widest text-[var(--text)] ${sIdx === 0 ? "" : "mt-4"}`}
            >
              {section.label}
            </span>

            {section.items.map((item) => {
              const isActive = isActiveHref(item.href);
              const isLocked = isNavItemLocked(item, access);

              if (isLocked) {
                return (
                  <Link
                    key={item.href}
                    href={item.href === "/dashboard/content/parent-pack" ? "/pricing" : item.href}
                    className={`${itemClassName} text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]`}
                  >
                    <svg className="h-4 w-4 flex-shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${itemClassName} ${isActive ? activeClassName(item.href) : inactiveClassName}`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-[var(--border)] px-3 pt-4">
        <div className="flex items-center gap-[10px] rounded-[var(--radius-sm)] px-3 py-[10px]">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] font-primary text-[12px] font-semibold text-[var(--text)]">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] text-[var(--text-mid)]">{userEmail}</div>
            <div className="text-[11px] text-[var(--text-muted)]">{planName}</div>
          </div>
        </div>
        {access.role === "parent" && (
          <div className="mb-2 px-3">
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] px-2 py-[3px] text-[10px] font-semibold text-[var(--text-mid)]">
              Parent Account
            </span>
          </div>
        )}
        <SignOutButton />
      </div>
    </aside>
  );
}
