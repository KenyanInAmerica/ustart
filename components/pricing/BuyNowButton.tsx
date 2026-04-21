"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Step = "idle" | "parent-pack-prompt" | "complete";

interface BuyNowButtonProps {
  featured?: boolean;
  ctaState?: "buy" | "has-access" | "included";
  parentPackUpsell?: { price: number } | null;
}

export function BuyNowButton({
  ctaState = "buy",
  parentPackUpsell = null,
}: BuyNowButtonProps) {
  const [step, setStep] = useState<Step>("idle");

  useEffect(() => {
    if (step === "complete") {
      const timer = setTimeout(() => setStep("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (ctaState === "has-access") {
    return (
      <div className="w-full py-2.5 text-center">
        <span className="text-xs font-medium text-emerald-600">You have access</span>
      </div>
    );
  }

  if (ctaState === "included") {
    return (
      <div className="w-full py-2.5 text-center">
        <span className="text-xs text-[var(--text-muted)]">Included in your plan</span>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <p className="py-2 text-center text-sm text-[var(--text-muted)]">
        Checkout coming soon. Please check back shortly.
      </p>
    );
  }

  if (step === "parent-pack-prompt" && parentPackUpsell) {
    return (
      <>
        <Button disabled className="w-full">
          Buy Now
        </Button>

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm border border-[var(--border)]" padding="md">
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 font-primary text-sm font-semibold text-[var(--text)]">
                  Add Parent Pack?
                </p>
                <p className="font-primary text-sm leading-relaxed text-[var(--text-muted)]">
                  Give a parent their own login to UStart for just ${parentPackUpsell.price}.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setStep("complete")} className="w-full">
                  Add Parent Pack {"\u2014"} ${parentPackUpsell.price}
                </Button>
                <Button onClick={() => setStep("complete")} variant="ghost" className="w-full">
                  No thanks, continue
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <Button
      onClick={() => {
        if (parentPackUpsell) {
          setStep("parent-pack-prompt");
        } else {
          setStep("complete");
        }
      }}
      className="w-full"
    >
      Buy Now
    </Button>
  );
}
