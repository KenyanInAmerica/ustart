"use client";

import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/config/brand";
import { FooterContactButton } from "@/components/ui/FooterContactButton";

export interface FooterViewConfig {
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  affiliateDisclosureEnabled: boolean;
}

export const defaultFooterConfig: FooterViewConfig = {
  instagramUrl: "",
  tiktokUrl: "",
  affiliateDisclosureEnabled: false,
};

function shouldShowSocialUrl(
  url: string | null | undefined,
  placeholderUrl: string
): boolean {
  if (url === null || url === undefined) return false;
  const normalized = url.trim().toLowerCase();
  return normalized !== "" && normalized !== placeholderUrl;
}

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

interface FooterViewProps {
  config?: FooterViewConfig;
}

export function FooterView({
  config = defaultFooterConfig,
}: FooterViewProps) {
  const instagramUrl = config.instagramUrl ?? "";
  const tiktokUrl = config.tiktokUrl ?? "";
  const showInstagram = shouldShowSocialUrl(
    instagramUrl,
    "https://instagram.com/placeholder"
  );
  const showTikTok = shouldShowSocialUrl(
    tiktokUrl,
    "https://tiktok.com/placeholder"
  );

  return (
    <footer className="w-full border-t border-[#F2F1EF]/10 bg-[#1C2B3A]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md-900:grid-cols-3 md-900:items-start">
          <div className="flex flex-col items-start">
            <Link href="/" aria-label={brand.name} className="inline-block">
              <Image
                src="/images/logo-primary-creme.png"
                alt="UStart — Your Move, Made Simple"
                width={112}
                height={112}
                className="h-28 w-auto"
                style={{ maxHeight: "112px" }}
              />
            </Link>
          </div>

          <div className="flex min-h-7 items-center justify-center gap-4 justify-self-center">
            {showInstagram && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F2F1EF]/60 transition-colors duration-150 hover:text-[#E54B4B]"
                aria-label="UStart on Instagram"
              >
                <InstagramIcon />
              </a>
            )}
            {showTikTok && (
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F2F1EF]/60 transition-colors duration-150 hover:text-[#E54B4B]"
                aria-label="UStart on TikTok"
              >
                <TikTokIcon />
              </a>
            )}
          </div>

          <div className="text-left md-900:justify-self-end md-900:text-right">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#F2F1EF]/50">
              Company
            </h2>
            <Link
              href="/privacy"
              className="mb-2 block w-fit text-sm text-[#F2F1EF]/70 transition-colors duration-150 hover:text-[#E54B4B] md-900:ml-auto"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="mb-2 block w-fit text-sm text-[#F2F1EF]/70 transition-colors duration-150 hover:text-[#E54B4B] md-900:ml-auto"
            >
              Terms
            </Link>
            <FooterContactButton />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl border-t border-[#F2F1EF]/10 px-6 pb-8 pt-6 text-center">
        {config.affiliateDisclosureEnabled && (
          <p className="text-xs leading-relaxed text-[#F2F1EF]/40">
            Some links on this site may earn UStart a referral fee at no cost
            to you.
          </p>
        )}
        <p className="mt-2 text-xs text-[#F2F1EF]/30">
          &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
