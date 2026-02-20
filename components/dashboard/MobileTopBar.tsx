"use client";

import Link from "next/link";

type Props = {
  onOpen: () => void;
};

// Fixed top bar shown only on mobile (below 860px).
// The hamburger button calls onOpen, which is wired to the MobileDrawer
// state managed by the parent MobileDashboardNav component.
export function MobileTopBar({ onOpen }: Props) {
  return (
    <div className="flex min-[860px]:hidden fixed top-0 left-0 right-0 h-14 z-[100] bg-[#0C1220] border-b border-white/[0.07] items-center justify-between px-5">
      <Link
        href="/"
        className="font-syne font-extrabold text-[16px] tracking-[-0.03em] text-white"
      >
        UStart
      </Link>
      <button
        onClick={onOpen}
        aria-label="Open navigation"
        className="text-white/[0.68] p-1 cursor-pointer"
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
