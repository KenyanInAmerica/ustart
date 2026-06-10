import Image from "next/image";
import Link from "next/link";
import { FooterView } from "@/components/ui/FooterView";

export default function MagicLinkPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px] text-center">
          <Link
            href="/"
            aria-label="UStart"
            className="mb-8 flex justify-center"
          >
            <Image
              src="/images/logo-primary-navy.png"
              alt="UStart — Your Move, Made Simple"
              width={200}
              height={160}
              priority
              className="w-auto"
              style={{ maxHeight: "160px" }}
            />
          </Link>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
            <h1 className="mb-3 text-2xl font-bold text-[var(--text)]">
              Check your email
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              We sent you a sign-in link. Open it on this device to continue to
              your UStart account.
            </p>
          </div>
        </div>
      </main>
      <FooterView />
    </div>
  );
}
