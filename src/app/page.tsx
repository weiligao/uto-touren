"use client";

import { CalendarView } from "@/app/components/CalendarView";
import { SearchForm } from "@/app/components/SearchForm";
import { TableView } from "@/app/components/TableView";
import { TOUR_TYPES, YEARS } from "@/lib/constants";
import type { ScrapeResult } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import type { KeyboardEvent } from "react";
import { Suspense, useEffect, useId, useRef, useState } from "react";

type ViewMode = "table" | "calendar";

const DEFAULT_TYP = "Ht";

function HomeContent() {
  const searchParams = useSearchParams();

  const [year, setYear] = useState(() => {
    const v = searchParams.get("year");
    return v && YEARS.includes(v) ? v : String(new Date().getFullYear());
  });
  const [typ, setTyp] = useState(() => {
    const v = searchParams.get("type");
    return v && TOUR_TYPES.some((t) => t.value === v) ? v : DEFAULT_TYP;
  });
  const [eventType, setEventType] = useState(() => searchParams.get("event") ?? "");
  const [group, setGroup] = useState(() => searchParams.get("group") ?? "");
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    searchParams.get("view") === "calendar" ? "calendar" : "table",
  );

  // Written to true after the first successful search; drives URL sync and shareable links.
  const [hasSearched, setHasSearched] = useState(() =>
    searchParams.has("year") || searchParams.has("type"),
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchFormExpanded, setSearchFormExpanded] = useState(true);
  const tableTabRef = useRef<HTMLButtonElement>(null);
  const calendarTabRef = useRef<HTMLButtonElement>(null);
  const tableTabId = useId();
  const calendarTabId = useId();
  const viewPanelId = useId();

  // Sync filter state → URL without triggering navigation.
  // Before the first search the URL stays clean; after a search all params are
  // always written so that the URL can be shared and will auto-trigger.
  useEffect(() => {
    if (!hasSearched) {return;}
    const params = new URLSearchParams();
    params.set("year", year);
    params.set("type", typ);
    if (eventType) {params.set("event", eventType);}
    if (group) {params.set("group", group);}
    if (viewMode !== "table") {params.set("view", viewMode);}
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [year, typ, eventType, group, viewMode, hasSearched]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    const params = new URLSearchParams({ year, typ, anlasstyp: eventType, gruppe: group });
    try {
      const res = await fetch(`/api/scrape?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Anfrage fehlgeschlagen: ${res.status}`);
      }
      setResult(await res.json());
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  // Auto-trigger search on initial load when the URL already carries search params
  const didAutoSearch = useRef(false);
  useEffect(() => {
    if (didAutoSearch.current) {return;}
    didAutoSearch.current = true;
    if (hasSearched) {
      handleSearch();
    }
    // One-time effect: handleSearch closes over state but we intentionally only
    // run it once, using the values already initialised from the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-gray-50 flex-1">
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

      <main id="main-content" className="max-w-7xl mx-auto px-4 py-6">
        <SearchForm
          year={year}
          setYear={setYear}
          typ={typ}
          setTyp={setTyp}
          eventType={eventType}
          setEventType={setEventType}
          group={group}
          setGroup={setGroup}
          loading={loading}
          onSearch={handleSearch}
          expanded={searchFormExpanded}
          setExpanded={setSearchFormExpanded}
        />

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm font-medium">Fehler: {error}</p>
          </div>
        )}

        {loading && (
          <div role="status" className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6 flex items-center justify-center gap-3 text-gray-500 text-sm">
            <svg aria-hidden="true" className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Touren werden geladen…
          </div>
        )}

        {result && (
          <div>
            <div
              role="tablist"
              aria-label="Ansicht wählen"
              className="inline-flex w-full sm:w-48 rounded-md border border-gray-300 overflow-hidden mb-4"
            >
              <button
                ref={tableTabRef}
                type="button"
                role="tab"
                aria-selected={viewMode === "table"}
                aria-controls={viewPanelId}
                id={tableTabId}
                tabIndex={viewMode === "table" ? 0 : -1}
                onClick={() => setViewMode("table")}
                onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                  if (e.key === "ArrowRight") { setViewMode("calendar"); calendarTabRef.current?.focus(); }
                }}
                className={`flex-1 px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Tabelle
              </button>
              <button
                ref={calendarTabRef}
                type="button"
                role="tab"
                aria-selected={viewMode === "calendar"}
                aria-controls={viewPanelId}
                id={calendarTabId}
                tabIndex={viewMode === "calendar" ? 0 : -1}
                onClick={() => setViewMode("calendar")}
                onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                  if (e.key === "ArrowLeft") { setViewMode("table"); tableTabRef.current?.focus(); }
                }}
                className={`flex-1 px-4 py-1.5 text-sm font-medium border-l border-gray-300 transition-colors cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Kalender
              </button>
            </div>

            <div
              id={viewPanelId}
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={viewMode === "table" ? tableTabId : calendarTabId}
            >
              {viewMode === "table" ? (
                <TableView
                  tours={result.tours}
                  totalScraped={result.total_scraped}
                />
              ) : (
                <CalendarView
                  tours={result.tours}
                  year={result.year}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
          aria-label="Nach oben"
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
