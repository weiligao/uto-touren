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
    process.env.NEXT_PUBLIC_APP_URL ?? "https://uto-touren.vercel.app",
  ),
  title: {
    default: "UtoTouren",
    template: "%s — UtoTouren",
  },
  description:
    "Touren und Kurse der SAC Sektion Uto suchen, filtern und herunterladen. Nach Jahr, Typ und Gruppe filtern. Einzelne Touren als .ics-Kalenderdatei exportieren.",
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
    "Kalender",
    "ics",
  ],
  openGraph: {
    type: "website",
    siteName: "UtoTouren",
    title: "UtoTouren",
    description:
      "Touren und Kurse der SAC Sektion Uto suchen, filtern und herunterladen.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "UtoTouren logo" }],
  },
  twitter: {
    card: "summary",
    title: "UtoTouren",
    description:
      "Touren und Kurse der SAC Sektion Uto suchen, filtern und herunterladen.",
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
      lang="de"
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
