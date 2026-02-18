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
      <div className="h-px bg-[rgba(255,255,255,0.07)] max-w-[1160px] mx-auto" />
      <HowItWorks />
      <div className="h-px bg-[rgba(255,255,255,0.07)] max-w-[1160px] mx-auto" />
      <Features />
      <div className="h-px bg-[rgba(255,255,255,0.07)] max-w-[1160px] mx-auto" />
      <Pricing />
      <Footer />
    </>
  );
}
