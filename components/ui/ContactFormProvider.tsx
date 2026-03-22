"use client";

// Global contact form context — placed in the root layout so the panel is
// accessible from every page (home, pricing, dashboard, sign-in).
// Footer's "Contact" button calls open(); ContactPanel renders at the root.

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { ContactPanel } from "@/components/ui/ContactPanel";

interface ContactFormContextValue {
  open: () => void;
  close: () => void;
}

const ContactFormContext = createContext<ContactFormContextValue | null>(null);

export function ContactFormProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ContactFormContext.Provider
      value={{ open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
      {/* Panel rendered here so it overlays any page without extra layout work */}
      <ContactPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </ContactFormContext.Provider>
  );
}

// Hook consumed by Footer and any other component that needs to open the panel.
export function useContactForm(): ContactFormContextValue {
  const ctx = useContext(ContactFormContext);
  if (!ctx) {
    throw new Error("useContactForm must be used within ContactFormProvider");
  }
  return ctx;
}
