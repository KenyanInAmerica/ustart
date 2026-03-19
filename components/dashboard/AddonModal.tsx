// Purchase modal for locked add-on cards (Parent Pack, Explore, Concierge).
// Shown when a user clicks a locked add-on — displays product details and a
// mock Buy Now CTA. The real Stripe checkout redirect replaces the handler in Feature 12.

"use client";

import { useState, useEffect } from "react";
import type { PricingItem } from "@/lib/config/pricing";

interface AddonModalProps {
  item: PricingItem;
  onClose: () => void;
}

// Map billing cadence to display string.
function billingLabel(billing: PricingItem["billing"]): string {
  if (billing === "one-time") return "one-time · lifetime access";
  if (billing === "monthly") return "per month";
  return "per year";
}

export function AddonModal({ item, onClose }: AddonModalProps) {
  const [purchased, setPurchased] = useState(false);

  // Close on Escape key.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBuyNow() {
    setPurchased(true);
    // TODO: replace with Stripe checkout session redirect (Feature 12)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Purchase ${item.name}`}
    >
      <div
        className="bg-[#0C1220] border border-white/[0.10] rounded-2xl flex flex-col w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="font-syne font-semibold text-[14px] text-white">
            {item.name}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
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

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Price + cadence */}
          <div>
            <p className="font-syne font-extrabold text-3xl tracking-[-0.04em] text-white">
              ${item.price}
            </p>
            <p className="font-dm-sans text-xs text-white/40 mt-0.5">
              {billingLabel(item.billing)}
            </p>
          </div>

          {/* Description */}
          {item.description && (
            <p className="font-dm-sans text-sm text-white/50 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Feature list */}
          {item.features && item.features.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {item.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2">
                  <svg
                    className="shrink-0 mt-0.5 opacity-40"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="font-dm-sans text-sm text-white/55">
                    {feat}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* CTA */}
          {purchased ? (
            <p className="text-center text-sm text-white/50 py-1">
              Checkout coming soon. Please check back shortly.
            </p>
          ) : (
            <button
              onClick={handleBuyNow}
              className="w-full bg-white text-[#05080F] py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {/* TODO: replace with Stripe checkout session redirect (Feature 12) */}
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
