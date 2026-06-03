import HomeClient from "@/app/HomeClient";
import { resolveTours } from "@/app/tours";
import type { Tour } from "@/lib/types";
import { Suspense } from "react";

// Allow up to 60s for the server-side cache/scrape call on cold starts.
export const maxDuration = 60;

export default async function Home() {
  const currentYear = String(new Date().getFullYear());

  let initialTours: Tour[] = [];
  try {
    initialTours = await resolveTours(currentYear);
  } catch {
    // Cache miss and scrape failed — client will fetch on mount.
  }

  return (
    <div className="bg-gray-50 flex-1">
      {/* Header rendered server-side: h1 and description are in the initial HTML
          for crawlers and LCP without requiring JavaScript. */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 leading-none">
            <svg aria-hidden="true" className="h-6 w-6 text-blue-600 shrink-0 self-center" fill="none" viewBox="0 0 20 14" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M0 13 L7 0 L11 6 L14 2 L20 13 Z" />
            </svg>
            UtoTouren
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Touren von sac-uto.ch suchen, filtern und in Google Kalender oder als .ics exportieren
          </p>
        </div>
      </header>
      {/* Suspense required because HomeClient uses useSearchParams. */}
      <Suspense>
        <HomeClient initialTours={initialTours} />
      </Suspense>
    </div>
  );
}
