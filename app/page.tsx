import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/ui/Hero";
import { HowItWorks } from "@/components/ui/HowItWorks";
import { Features } from "@/components/ui/Features";
import { Pricing } from "@/components/ui/Pricing";
import { Footer } from "@/components/ui/Footer";

// Public marketing landing page — no auth required.
// All sections are Server Components; no client-side JS needed for this page.
export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      {/* 1px horizontal rules constrained to the content max-width to visually separate sections */}
      <div className="mx-auto h-px max-w-[1160px] bg-[var(--border)]" />
      <HowItWorks />
      <div className="mx-auto h-px max-w-[1160px] bg-[var(--border)]" />
      <Features />
      <div className="mx-auto h-px max-w-[1160px] bg-[var(--border)]" />
      <Pricing />
      <Footer />
    </>
  );
}
