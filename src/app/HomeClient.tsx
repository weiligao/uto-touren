"use client";

import { CalendarView } from "@/app/components/CalendarView";
import { TableView } from "@/app/components/TableView";
import type { SelectedFilters } from "@/app/components/useFilterState";
import { YEARS } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

/** Parse a comma-separated URL param into a Set of strings. */
function parseStringSet(v: string | null): Set<string> {
  return v ? new Set(v.split(",")) : new Set();
}

/** Parse a comma-separated URL param into a Set of numbers. */
function parseNumberSet(v: string | null): Set<number> {
  return v ? new Set(v.split(",").map(Number)) : new Set();
}

type ViewMode = "table" | "calendar";

interface HomeClientProps {
  /** Current-year tours pre-fetched by the server component. Empty if cache miss or scrape failed. */
  initialTours: Tour[];
}

export default function HomeClient({ initialTours }: HomeClientProps) {
  const searchParams = useSearchParams();

  const [selectedYears, setSelectedYears] = useState<Set<string>>(() => {
    const v = parseStringSet(searchParams.get("years"));
    return v.size > 0 && [...v].every((y) => YEARS.includes(y)) ? v : new Set();
  });
  const [selectedTourTypes, setSelectedTourTypes] = useState<Set<string>>(() =>
    parseStringSet(searchParams.get("types")),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    searchParams.get("view") === "calendar" ? "calendar" : "table",
  );

  const [selectedStatuses, setSelectedStatuses] = useState<Set<TourStatus>>(() =>
    parseStringSet(searchParams.get("statuses")) as Set<TourStatus>,
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<number>>(() =>
    parseNumberSet(searchParams.get("weekdays")),
  );
  const [selectedDurations, setSelectedDurations] = useState<Set<number>>(() =>
    parseNumberSet(searchParams.get("durations")),
  );
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(() =>
    parseStringSet(searchParams.get("difficulties")),
  );
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(() =>
    parseStringSet(searchParams.get("eventTypes")),
  );
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(() =>
    parseStringSet(searchParams.get("groups")),
  );
  const [selectedLeaders, setSelectedLeaders] = useState<Set<string>>(() =>
    parseStringSet(searchParams.get("leaders")),
  );
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(() =>
    parseStringSet(searchParams.get("titles")),
  );
  const [showPastTours, setShowPastTours] = useState<boolean>(() =>
    searchParams.get("showPast") === "true",
  );

  const selectedFilters: SelectedFilters = useMemo(() => ({
    selectedYears, setSelectedYears,
    selectedTourTypes, setSelectedTourTypes,
    selectedStatuses, setSelectedStatuses,
    selectedWeekdays, setSelectedWeekdays,
    selectedDurations, setSelectedDurations,
    selectedDifficulties, setSelectedDifficulties,
    selectedEventTypes, setSelectedEventTypes,
    selectedGroups, setSelectedGroups,
    selectedLeaders, setSelectedLeaders,
    selectedTitles, setSelectedTitles,
    showPastTours, setShowPastTours,
  }), [
    selectedYears, selectedTourTypes, selectedStatuses, selectedWeekdays,
    selectedDurations, selectedDifficulties, selectedEventTypes, selectedGroups,
    selectedLeaders, selectedTitles, showPastTours,
  ]);

  // Seed with server-prefetched current-year tours so the table renders immediately
  // after hydration without waiting for the client fetch to complete.
  const [allTours, setAllTours] = useState<Tour[]>(initialTours);
  // Only show the loading spinner if we have no data yet.
  const [loading, setLoading] = useState(initialTours.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const tableTabRef = useRef<HTMLButtonElement>(null);
  const calendarTabRef = useRef<HTMLButtonElement>(null);
  const tableTabId = useId();
  const calendarTabId = useId();
  const viewPanelId = useId();

  // Fetch all years on mount. The current year hits Redis/memory cache immediately
  // (pre-warmed by the server render), so the round-trip is negligible.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const responses = await Promise.all(YEARS.map((y) => fetch(`/api/scrape?year=${y}`)));
        const bodies = await Promise.all(
          responses.map(async (r) => {
            if (!r.ok) {
              const body = await r.json().catch(() => ({})) as Record<string, unknown>;
              throw new Error((body.error as string | undefined) ?? `Anfrage fehlgeschlagen: ${r.status}`);
            }
            return r.json() as Promise<{ tours: Tour[] }>;
          }),
        );
        if (!cancelled) {
          setAllTours(bodies.flatMap((b) => b.tours));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unbekannter Fehler");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive year for CalendarView: use the single selected year, minimum year from allTours if no selection, or current year as fallback.
  const calendarYear = useMemo(() => {
    if (selectedYears.size === 1) { return [...selectedYears][0]; }
    if (selectedYears.size === 0 && allTours.length > 0) {
      const parsedYears = allTours
        .map((t) => parseInt(t.start_date.slice(0, 4), 10))
        .filter((year) => Number.isFinite(year));
      if (parsedYears.length > 0) {
        const minYear = Math.min(...parsedYears);
        if (Number.isFinite(minYear)) { return String(minYear); }
      }
    }
    return String(new Date().getFullYear());
  }, [selectedYears, allTours]);

  // Sync filter state → URL without triggering navigation.
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedYears.size > 0) { params.set("years", [...selectedYears].join(",")); }
    if (selectedTourTypes.size > 0) { params.set("types", [...selectedTourTypes].join(",")); }
    if (viewMode !== "table") { params.set("view", viewMode); }
    if (selectedStatuses.size > 0) { params.set("statuses", [...selectedStatuses].join(",")); }
    if (selectedWeekdays.size > 0) { params.set("weekdays", [...selectedWeekdays].join(",")); }
    if (selectedDurations.size > 0) { params.set("durations", [...selectedDurations].join(",")); }
    if (selectedDifficulties.size > 0) { params.set("difficulties", [...selectedDifficulties].join(",")); }
    if (selectedEventTypes.size > 0) { params.set("eventTypes", [...selectedEventTypes].join(",")); }
    if (selectedGroups.size > 0) { params.set("groups", [...selectedGroups].join(",")); }
    if (selectedLeaders.size > 0) { params.set("leaders", [...selectedLeaders].join(",")); }
    if (selectedTitles.size > 0) { params.set("titles", [...selectedTitles].join(",")); }
    if (showPastTours) { params.set("showPast", "true"); }
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [selectedYears, selectedTourTypes, viewMode, selectedStatuses, selectedWeekdays, selectedDurations, selectedDifficulties, selectedEventTypes, selectedGroups, selectedLeaders, selectedTitles, showPastTours]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm font-medium">Fehler: {error}</p>
          </div>
        )}

        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {loading ? "Touren werden geladen…" : ""}
        </div>

        {loading && (
          <div aria-hidden="true" className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6 flex flex-col items-center justify-center gap-3 text-gray-500 text-sm">
            <svg aria-hidden="true" className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Touren werden geladen…</span>
          </div>
        )}

        {!loading && !error && (
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
                  tours={allTours}
                  totalScraped={allTours.length}
                  selectedFilters={selectedFilters}
                />
              ) : (
                <CalendarView
                  tours={allTours}
                  year={calendarYear}
                  selectedFilters={selectedFilters}
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
    </>
  );
}
