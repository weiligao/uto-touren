import { Footer } from "@/app/components/Footer";
import { Analytics } from "@vercel/analytics/next";
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
  alternates: {
    canonical: "/",
  },
  title: {
    default: "UtoTouren",
    template: "%s — UtoTouren",
  },
  description:
    "Touren und Kurse der SAC-Sektion Uto suchen, filtern und in Google Kalender oder als .ics-Datei exportieren. Nach Jahr, Typ und Gruppe filtern.",
  keywords: [
    "SAC Uto",
    "SAC-Sektion Uto",
    "Touren",
    "Bergtouren",
    "Hochtour",
    "Skitour",
    "Klettern",
    "Wandern",
    "Alpen",
    "Kalender",
    "Google Kalender",
    "ics",
  ],
  openGraph: {
    type: "website",
    url: "/",
    locale: "de_CH",
    siteName: "UtoTouren",
    title: "UtoTouren",
    description:
      "Touren und Kurse der SAC-Sektion Uto suchen, filtern und in Google Kalender oder als .ics exportieren.",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "UtoTouren" },
      { url: "/og-image-square.png", width: 1200, height: 1200, alt: "UtoTouren" },
    ],
  },
  twitter: {
    card: "summary",
    title: "UtoTouren",
    description:
      "Touren und Kurse der SAC-Sektion Uto suchen, filtern und in Google Kalender oder als .ics exportieren.",
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded focus:bg-white focus:text-blue-700 focus:font-semibold focus:shadow-lg focus:outline-2 focus:outline-blue-600"
        >
          Zum Hauptinhalt springen
        </a>
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
