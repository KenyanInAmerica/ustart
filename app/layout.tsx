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
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
