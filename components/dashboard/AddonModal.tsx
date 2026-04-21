"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PricingItem } from "@/lib/config/pricing";

interface AddonModalProps {
  item: PricingItem;
  onClose: () => void;
}

function billingLabel(billing: PricingItem["billing"]): string {
  if (billing === "one-time") return "one-time · lifetime access";
  if (billing === "monthly") return "per month";
  return "per year";
}

export function AddonModal({ item, onClose }: AddonModalProps) {
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBuyNow() {
    setPurchased(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Purchase ${item.name}`}
    >
      <Card
        className="flex w-full max-w-sm flex-col border border-[var(--border)]"
        onClick={(event) => event.stopPropagation()}
        padding="sm"
        shadow="lg"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-primary text-[14px] font-semibold text-[var(--text)]">
            {item.name}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <div>
            <p className="font-primary text-3xl font-extrabold tracking-[-0.04em] text-[var(--text)]">
              ${item.price}
            </p>
            <p className="mt-0.5 font-primary text-xs text-[var(--text-muted)]">
              {billingLabel(item.billing)}
            </p>
          </div>

          {item.description && (
            <p className="font-primary text-sm leading-relaxed text-[var(--text-muted)]">
              {item.description}
            </p>
          )}

          {item.features && item.features.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {item.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-[13px] w-[13px] shrink-0 text-[var(--accent)] opacity-50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="font-primary text-sm text-[var(--text-muted)]">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {purchased ? (
            <p className="py-1 text-center text-sm text-[var(--text-muted)]">
              Checkout coming soon. Please check back shortly.
            </p>
          ) : (
            <Button onClick={handleBuyNow} className="w-full">
              Buy Now
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
