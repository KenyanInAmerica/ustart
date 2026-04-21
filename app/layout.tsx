import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ContactFormProvider } from "@/components/ui/ContactFormProvider";
import { brand } from "@/lib/config/brand";

const primaryFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-primary",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description:
    "UStart gives international students the tools, resources, and guidance to navigate life in the US with confidence.",
  icons: {
    // /favicon.ico is a static fallback for dev (ImageResponse doesn't serve in
    // the dev pipeline); app/icon.tsx takes over in production builds.
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${primaryFont.variable} font-primary scroll-smooth`}>
      <body className="bg-[var(--bg)] text-[var(--text)] font-primary text-base leading-relaxed overflow-x-hidden antialiased">
        {/* ContactFormProvider enables the contact panel from any page via useContactForm() */}
        <ContactFormProvider>
          {children}
        </ContactFormProvider>
      </body>
    </html>
  );
}
