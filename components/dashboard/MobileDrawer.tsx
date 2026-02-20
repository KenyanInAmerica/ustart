"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "@/components/dashboard/navItems";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userInitials: string;
  planName: string;
  hasMembership: boolean;
};

// Slide-in mobile nav drawer, shown when isOpen is true.
// The semi-transparent overlay covers the page and closes the drawer on click.
// Nav items mirror the desktop Sidebar exactly — both import from navItems.tsx.
export function MobileDrawer({ isOpen, onClose, userEmail, userInitials, planName, hasMembership }: Props) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop — click anywhere outside the panel to close */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-[#0C1220] border-r border-white/[0.07] overflow-y-auto py-6 flex flex-col">
        {/* Wordmark + close row */}
        <div className="flex items-center justify-between px-6 pb-6 border-b border-white/[0.07] mb-5">
          <Link
            href="/"
            onClick={onClose}
            className="font-syne font-extrabold text-[18px] tracking-[-0.03em] text-white"
          >
            UStart
          </Link>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="text-white/[0.42] hover:text-white p-1 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1">
          {navSections.map((section, sIdx) => (
            <div key={section.label} className="px-3 mb-1">
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

                // Hard navigation for the dashboard link — same reason as Sidebar.tsx.
                if (item.href === "/dashboard") {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-[10px] px-3 py-[9px] rounded-lg text-sm transition-colors duration-150 ${
                        isActive
                          ? "bg-white/[0.07] text-white font-medium"
                          : "text-white/[0.68] hover:bg-white/[0.05] hover:text-white"
                      }`}
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
                    onClick={onClose}
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
      </div>
    </div>
  );
}
