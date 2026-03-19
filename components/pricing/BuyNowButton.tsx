// Client component for Buy Now CTAs on the public pricing page.
// Handles three flows based on props:
//   1. "buy" — default; authenticated users without Parent Pack see an optional upsell step
//   2. "has-access" — user already owns this tier; shows a confirmation badge
//   3. "included" — user owns a higher tier; this tier is already included
// Swapped for a Stripe checkout session redirect in Feature 12.

"use client";

import { useState, useEffect } from "react";

type Step = "idle" | "parent-pack-prompt" | "complete";

interface BuyNowButtonProps {
  featured?: boolean;
  // Determines what the CTA renders for authenticated users.
  ctaState?: "buy" | "has-access" | "included";
  // Passed only when user is authenticated, does not have Parent Pack, and is
  // viewing a membership tier. Shows a one-click upsell before the mock checkout.
  parentPackUpsell?: { price: number } | null;
}

export function BuyNowButton({
  featured = false,
  ctaState = "buy",
  parentPackUpsell = null,
}: BuyNowButtonProps) {
  const [step, setStep] = useState<Step>("idle");

  // Auto-dismiss the "complete" message after 3 seconds.
  useEffect(() => {
    if (step === "complete") {
      const timer = setTimeout(() => setStep("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // User already owns exactly this tier.
  if (ctaState === "has-access") {
    return (
      <div className="w-full py-2.5 text-center">
        <span className="text-xs font-medium text-emerald-400">
          ✓ You have access
        </span>
      </div>
    );
  }

  // User owns a higher tier — this tier is included.
  if (ctaState === "included") {
    return (
      <div className="w-full py-2.5 text-center">
        <span className="text-xs text-white/40">Included in your plan</span>
      </div>
    );
  }

  // Checkout coming soon — auto-dismisses after 3s.
  if (step === "complete") {
    return (
      <p className="text-center text-sm text-white/50 py-2">
        Checkout coming soon. Please check back shortly.
      </p>
    );
  }

  // Parent Pack upsell prompt — shown as a modal overlay before completing.
  if (step === "parent-pack-prompt" && parentPackUpsell) {
    return (
      <>
        {/* Disabled placeholder keeps the card height stable while the modal is open */}
        <button
          disabled
          className="w-full py-3 rounded-xl text-sm font-medium opacity-20 bg-white/[0.07] text-white border border-white/[0.10]"
        >
          Buy Now
        </button>

        {/* Modal overlay — fixed so it escapes card overflow */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="bg-[#0C1220] border border-white/[0.10] rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="font-syne font-semibold text-white text-sm mb-2">
                Add Parent Pack?
              </p>
              <p className="font-dm-sans text-sm text-white/50 leading-relaxed">
                Give a parent their own login to UStart — dedicated resources
                for just ${parentPackUpsell.price}.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setStep("complete")}
                className="w-full bg-white text-[#05080F] py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {/* TODO: pass tier + optional parent_pack as line items to Stripe
                    checkout session (Feature 12) */}
                Add Parent Pack — ${parentPackUpsell.price}
              </button>
              <button
                onClick={() => setStep("complete")}
                className="w-full text-white/40 hover:text-white py-2 text-sm transition-colors"
              >
                No thanks, continue
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Default idle state — Buy Now button.
  return (
    <button
      onClick={() => {
        // If there's a Parent Pack upsell and the user is buying a tier,
        // show the upsell step first. Otherwise go straight to mock completion.
        if (parentPackUpsell) {
          setStep("parent-pack-prompt");
        } else {
          setStep("complete");
        }
        // TODO: pass tier + optional parent_pack as line items to Stripe
        // checkout session (Feature 12)
      }}
      className={[
        "w-full py-3 rounded-xl text-sm font-medium transition-all duration-150",
        featured
          ? "bg-white text-[#05080F] hover:opacity-90"
          : "bg-white/[0.07] text-white hover:bg-white/[0.12] border border-white/[0.10]",
      ].join(" ")}
    >
      Buy Now
    </button>
  );
}
