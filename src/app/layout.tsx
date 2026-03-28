import { Footer } from "@/app/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://utomate.vercel.app",
  ),
  title: {
    default: "UtoMate",
    template: "%s — UtoMate",
  },
  description:
    "Search, browse, and download tour and course listings from SAC Sektion Uto. Filter by year, type, and group. Export individual tours as .ics calendar files.",
  keywords: [
    "SAC Uto",
    "SAC Sektion Uto",
    "Touren",
    "Bergtouren",
    "Hochtour",
    "Skitour",
    "Klettern",
    "Wandern",
    "Alpen",
    "calendar",
    "ics",
  ],
  openGraph: {
    type: "website",
    siteName: "UtoMate",
    title: "UtoMate",
    description:
      "Search, browse, and download tour and course listings from SAC Sektion Uto.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "UtoMate logo" }],
  },
  twitter: {
    card: "summary",
    title: "UtoMate",
    description:
      "Search, browse, and download tour and course listings from SAC Sektion Uto.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}
