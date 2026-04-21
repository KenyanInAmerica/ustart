"use client";

import Link from "next/link";
import { brand } from "@/lib/config/brand";

type Props = {
  onOpen: () => void;
};

// Fixed top bar shown only on mobile (below 860px).
// The hamburger button calls onOpen, which is wired to the MobileDrawer
// state managed by the parent MobileDashboardNav component.
export function MobileTopBar({ onOpen }: Props) {
  return (
    <div className="fixed left-0 right-0 top-0 z-[100] flex h-14 items-center justify-between border-b border-[var(--border)] bg-white px-5 min-[860px]:hidden">
      <Link
        href="/"
        className="font-primary text-[16px] font-extrabold tracking-[-0.03em] text-[var(--text)]"
      >
        {brand.name}
      </Link>
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
