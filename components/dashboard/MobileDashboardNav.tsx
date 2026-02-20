"use client";

import { useState } from "react";
import { MobileTopBar } from "@/components/dashboard/MobileTopBar";
import { MobileDrawer } from "@/components/dashboard/MobileDrawer";

type Props = {
  userEmail: string;
  userInitials: string;
  planName: string;
  hasMembership: boolean;
};

// Thin client wrapper that owns the drawer open/closed state.
// The Server Component layout can't hold useState, so this component
// bridges between the Server Component tree and the two mobile UI pieces.
export function MobileDashboardNav({ userEmail, userInitials, planName, hasMembership }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <MobileTopBar onOpen={() => setIsOpen(true)} />
      <MobileDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userEmail={userEmail}
        userInitials={userInitials}
        planName={planName}
        hasMembership={hasMembership}
      />
    </>
  );
}
