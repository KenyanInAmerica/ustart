"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "@/components/dashboard/navItems";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

type Props = {
  userEmail: string;
  userInitials: string;
  planName: string;
  hasMembership: boolean;
};

// Desktop sidebar — fixed 240px left column, hidden below 860px via the layout.
// "use client" so usePathname() can highlight the active nav item.
export function Sidebar({ userEmail, userInitials, planName, hasMembership }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-[860px]:flex flex-col fixed top-0 left-0 bottom-0 w-[240px] z-50 bg-[#0C1220] border-r border-white/[0.07] overflow-y-auto py-7">
      {/* Wordmark */}
      <Link
        href="/"
        className="font-syne font-extrabold text-[18px] tracking-[-0.03em] text-white px-6 pb-7 border-b border-white/[0.07] mb-5"
      >
        UStart
      </Link>

      {/* Nav sections */}
      <nav className="flex-1">
        {navSections.map((section, sIdx) => (
          <div key={section.label} className="px-3 mb-1">
            {/* Section label — no top margin on the first section */}
            <span
              className={`block px-3 mb-1 text-[10px] font-semibold tracking-[0.1em] uppercase text-white/[0.42] ${sIdx === 0 ? "" : "mt-4"}`}
            >
              {section.label}
            </span>

            {section.items.map((item) => {
              const isActive = pathname === item.href;
              // UStart Lite is unlocked in the static nav definition but must be
              // treated as locked at runtime until the user has a membership.
              const isLocked = item.locked || (item.href === "/dashboard/lite" && !hasMembership);

              if (isLocked) {
                // Locked items are non-interactive — rendered as a div to avoid
                // creating a real link that could be keyboard-navigated.
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-[10px] px-3 py-[9px] rounded-lg text-sm text-white/[0.28] pointer-events-none"
                    aria-disabled="true"
                  >
                    {item.icon}
                    {item.label}
                    <span className="ml-auto text-[10px] bg-white/[0.04] border border-white/[0.07] text-white/[0.42] px-[7px] py-[2px] rounded-full">
                      Locked
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-[10px] px-3 py-[9px] rounded-lg text-sm transition-colors duration-150 ${
                    isActive
                      ? "bg-white/[0.07] text-white font-medium"
                      : "text-white/[0.68] hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer — user info + sign out */}
      <div className="mt-auto pt-4 px-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-[10px] px-3 py-[10px] rounded-lg">
          {/* Avatar circle with initials */}
          <div className="w-8 h-8 rounded-full bg-white/[0.1] flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0 font-syne">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-white/[0.42] truncate">{userEmail}</div>
            <div className="text-[11px] text-white/30">{planName}</div>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
