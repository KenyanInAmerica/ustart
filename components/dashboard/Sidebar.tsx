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
    case "/dashboard/explore":
      return "explore";
    case "/dashboard/concierge":
      return "concierge";
    case "/dashboard/parent-pack":
      return "parent_pack";
    case "/dashboard/community":
      return "community";
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
              const isActive = pathname === item.href;
              const isLocked = isNavItemLocked(item, access);

              if (isLocked) {
                return (
                  <div
                    key={item.href}
                    className={`${itemClassName} pointer-events-none bg-[var(--bg-subtle)] text-[var(--text-muted)]`}
                    aria-disabled="true"
                  >
                    {item.icon}
                    {item.label}
                    <span className="ml-auto rounded-full border border-[var(--border)] bg-white px-[7px] py-[2px] text-[10px] text-[var(--text-muted)]">
                      Locked
                    </span>
                  </div>
                );
              }

              if (item.href === "/dashboard") {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`${itemClassName} ${isActive ? activeClassName(item.href) : inactiveClassName}`}
                  >
                    {item.icon}
                    {item.label}
                  </a>
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
