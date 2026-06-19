"use client";

import { EVENT_TYPE_KURS, EVENT_TYPE_TOUR, STATUS_ARIA_LABELS, STATUS_COLORS, STATUS_LABELS, TABLE_ROWS_PER_PAGE } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { formatDuration, formatGroups, isKurs, unknownIfEmpty } from "@/lib/utils";
import { memo, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CalendarExportButtons } from "./IcsButton";
import { ResultsHeader } from "./ResultsHeader";
import { TourTitle } from "./TourTitle";
import type { SelectedFilters } from "./useFilterState";
import { useFilterState } from "./useFilterState";

const TABLE_COLUMNS: { label: string; mobileHidden?: boolean; center?: boolean }[] = [
  { label: "Status", center: true, mobileHidden: true },
  { label: "Typ", mobileHidden: true },
  { label: "Anlass", mobileHidden: true },
  { label: "Dauer", mobileHidden: true },
  { label: "Schwierigkeit", mobileHidden: true },
  { label: "Gruppe", mobileHidden: true },
  { label: "Titel" },
  { label: "Leiter/in", mobileHidden: true },
];
// +1 calendar-button column (desktop only) +1 expand-button column (mobile only)
const TABLE_COLSPAN = TABLE_COLUMNS.length + 2;

// --- Date grouping helpers ---

type DateGroup = {
  startKey: string; // YYYY-MM-DD
  items: Array<{ tour: Tour; i: number }>;
};

const DATE_GROUP_FORMAT = new Intl.DateTimeFormat("de-CH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatGroupDate(dateKey: string): string {
  if (!dateKey) {
    return "Datum unbekannt";
  }
  const [y, m, d] = dateKey.split("-").map(Number);
  return DATE_GROUP_FORMAT.format(new Date(y, m - 1, d));
}

function groupByDate(items: Array<{ tour: Tour; i: number }>): DateGroup[] {
  const map = new Map<string, DateGroup>();
  for (const item of items) {
    const key = item.tour.start_date || "";
    if (!map.has(key)) {
      map.set(key, { startKey: key, items: [] });
    }
    const group = map.get(key);
    if (group) {
      group.items.push(item);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (!a.startKey) {
      return 1;
    }
    if (!b.startKey) {
      return -1;
    }
    if (a.startKey < b.startKey) {
      return -1;
    }
    if (a.startKey > b.startKey) {
      return 1;
    }
    return 0;
  });
}

function StatusDot({ status }: { status: TourStatus }) {
  return (
    <span
      role="img"
      aria-label={STATUS_ARIA_LABELS[status] ?? STATUS_ARIA_LABELS.unknown}
      className={`inline-block h-3 w-3 rounded-full ${STATUS_COLORS[status] ?? STATUS_COLORS.unknown}`}
    />
  );
}

const TourRow = memo(function TourRow({
  tour,
  i,
  expanded,
  onToggle,
}: {
  tour: Tour;
  i: number;
  expanded: boolean;
  onToggle: (i: number) => void;
}) {
  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <td className="hidden sm:table-cell px-4 py-3 text-center">
          <StatusDot status={tour.status} />
        </td>
        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
          {unknownIfEmpty(tour.tour_type)}
        </td>
        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
          {isKurs(tour.difficulty) ? EVENT_TYPE_KURS : EVENT_TYPE_TOUR}
        </td>
        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
          {formatDuration(tour.duration_days)}
        </td>
        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
          {unknownIfEmpty(tour.difficulty)}
        </td>
        <td className="hidden sm:table-cell px-4 py-3 text-gray-700">
          {formatGroups(tour.group)}
        </td>
        <td className="px-4 py-3 text-gray-900">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`sm:hidden inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[tour.status] ?? STATUS_COLORS.unknown}`} />
            <span className="sr-only sm:hidden">{STATUS_LABELS[tour.status] ?? STATUS_LABELS.unknown}</span>
            <TourTitle title={tour.title} url={tour.detail_url} />
          </span>
        </td>
        <td className="hidden sm:table-cell px-4 py-3 text-gray-700">{unknownIfEmpty(tour.leader)}</td>
        <td className="hidden sm:table-cell px-3 py-3 text-center">
          <CalendarExportButtons tour={tour} compact />
        </td>
        <td className="sm:hidden sticky right-0 z-10 bg-white px-2 pr-4 py-3 text-center">
          <button
            type="button"
            onClick={() => onToggle(i)}
            className="flex items-center justify-center min-h-11 w-11 rounded text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-colors"
            aria-expanded={expanded}
            aria-controls={`tour-detail-${i}`}
            aria-label={expanded ? `${tour.title} zuklappen` : `${tour.title} aufklappen`}
          >
            <svg
              aria-hidden="true"
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </td>
      </tr>
      <tr
        id={`tour-detail-${i}`}
        hidden={!expanded}
        className="sm:hidden bg-gray-50 border-b border-gray-100"
      >
        <td colSpan={TABLE_COLSPAN} className="px-4 py-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="font-medium text-gray-500">Status</dt>
              <dd className="flex items-center gap-1.5 text-gray-800">
                <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[tour.status] ?? STATUS_COLORS.unknown}`} />
                {STATUS_LABELS[tour.status] ?? STATUS_LABELS.unknown}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Typ</dt>
              <dd className="text-gray-800">{unknownIfEmpty(tour.tour_type)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Anlass</dt>
              <dd className="text-gray-800">{isKurs(tour.difficulty) ? EVENT_TYPE_KURS : EVENT_TYPE_TOUR}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Dauer</dt>
              <dd className="text-gray-800">{formatDuration(tour.duration_days)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Schwierigkeit</dt>
              <dd className="text-gray-800">{unknownIfEmpty(tour.difficulty)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Gruppe</dt>
              <dd className="text-gray-800">{formatGroups(tour.group)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Leiter/in</dt>
              <dd className="text-gray-800">{unknownIfEmpty(tour.leader)}</dd>
            </div>
            <div className="flex items-end">
              <CalendarExportButtons tour={tour} />
            </div>
          </dl>
        </td>
      </tr>
    </>
  );
});

export function TableView({
  tours,
  totalScraped,
  selectedFilters,
}: {
  tours: Tour[];
  totalScraped: number;
  selectedFilters: SelectedFilters;
}) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [itemsToShow, setItemsToShow] = useState(TABLE_ROWS_PER_PAGE);
  const [, startTransition] = useTransition();
  const showMoreButtonRef = useRef<HTMLButtonElement>(null);
  const previousTourLengthRef = useRef(tours.length);
  const previousVisibleCountRef = useRef<number | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const {
    years,
    selectedYears,
    setSelectedYears,
    tourTypes,
    selectedTourTypes,
    setSelectedTourTypes,
    statuses,
    selectedStatuses,
    setSelectedStatuses,
    selectedWeekdays,
    setSelectedWeekdays,
    durations,
    selectedDurations,
    setSelectedDurations,
    difficulties,
    selectedDifficulties,
    setSelectedDifficulties,
    eventTypes,
    selectedEventTypes,
    setSelectedEventTypes,
    groups,
    selectedGroups,
    setSelectedGroups,
    leaders,
    selectedLeaders,
    setSelectedLeaders,
    titles,
    resetFilters,
    matchesTour,
  } = useFilterState(tours, selectedFilters);

  const toggleRow = useCallback((i: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) { next.delete(i); } else { next.add(i); }
      return next;
    });
  }, []);

  const visibleTours = useMemo(
    () => tours.filter((tour) => matchesTour(tour)).map((tour, i) => ({ tour, i })),
    [tours, matchesTour],
  );

  const paginatedTours = useMemo(
    () => visibleTours.slice(0, itemsToShow),
    [visibleTours, itemsToShow],
  );

  const groupedTours = useMemo(() => groupByDate(paginatedTours), [paginatedTours]);

  // Reset state when data changes. Use refs to detect actual changes without triggering
  // on first render. Since visibleTours is derived from tours, we check both:
  // - tours.length: detects when data is loaded/refreshed
  // - visibleTours.length: detects when filters are applied/removed
  useEffect(() => {
    const tourCountChanged = previousTourLengthRef.current !== tours.length;
    const filterChanged = previousVisibleCountRef.current !== null && previousVisibleCountRef.current !== visibleTours.length;

    if (tourCountChanged) {
      previousTourLengthRef.current = tours.length;
      setExpandedRows(new Set());
      setItemsToShow(TABLE_ROWS_PER_PAGE);
    } else if (filterChanged) {
      setExpandedRows(new Set());
      setItemsToShow(TABLE_ROWS_PER_PAGE);
    }

    // Always keep ref in sync so filterChanged compares against the true previous value
    previousVisibleCountRef.current = visibleTours.length;
  }, [tours.length, visibleTours.length]);

  // Update scroll shadow visibility based on scroll position and overflow
  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) {
      return;
    }
    const wrapper = el.parentElement;
    if (!wrapper?.classList) {
      return;
    } // Guard: ensure wrapper has classList

    const update = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth;
      const atStart = el.scrollLeft <= 1;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

      wrapper.classList.toggle("scroll-shadow-left", hasOverflow && !atStart);
      wrapper.classList.toggle("scroll-shadow-right", hasOverflow && !atEnd);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <ResultsHeader
        totalScraped={totalScraped}
        visibleCount={visibleTours.length}
        years={years}
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        tourTypes={tourTypes}
        selectedTourTypes={selectedTourTypes}
        onTourTypesChange={setSelectedTourTypes}
        statuses={statuses}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        selectedWeekdays={selectedWeekdays}
        onWeekdaysChange={setSelectedWeekdays}
        durations={durations}
        selectedDurations={selectedDurations}
        onDurationsChange={setSelectedDurations}
        difficulties={difficulties}
        selectedDifficulties={selectedDifficulties}
        onDifficultiesChange={setSelectedDifficulties}
        eventTypes={eventTypes}
        selectedEventTypes={selectedEventTypes}
        onEventTypesChange={setSelectedEventTypes}
        groups={groups}
        selectedGroups={selectedGroups}
        onGroupsChange={setSelectedGroups}
        leaders={leaders}
        selectedLeaders={selectedLeaders}
        onLeadersChange={setSelectedLeaders}
        titles={titles}
        selectedTitles={selectedFilters.selectedTitles}
        onTitlesChange={selectedFilters.setSelectedTitles}
        showPastTours={selectedFilters.showPastTours}
        onShowPastToursChange={selectedFilters.setShowPastTours}
      />
      <div className="scroll-shadow-wrapper">
        <div ref={tableScrollRef} className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Tourenliste">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col.label}
                  scope="col"
                  className={[
                    "px-4 py-3 font-medium text-gray-600",
                    col.center ? "text-center" : "text-left",
                    col.mobileHidden ? "hidden sm:table-cell" : "",
                  ].join(" ")}
                >
                  {col.label}
                </th>
              ))}
              <th scope="col" className="hidden sm:table-cell px-2 py-3 w-8" aria-label="Zum Kalender hinzufügen" />
              <th scope="col" className="sm:hidden px-2 pr-4 py-3 w-8" aria-label="Zeile aufklappen" />
            </tr>
          </thead>
          {visibleTours.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={TABLE_COLSPAN} className="px-6 py-16 text-center text-sm text-gray-500">
                  {tours.length === 0 ? (
                    "Keine Touren gefunden."
                  ) : (
                    <>
                      <p className="mb-3">Keine Touren für diese Filter.</p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Filter zurücksetzen
                      </button>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          ) : groupedTours.map((group) => (
            <tbody key={group.startKey || "__unknown__"} aria-labelledby={`date-group-${group.startKey || "unknown"}`}>
              {/* Date group header — scope="rowgroup" + aria-labelledby covers both spec-compliant and legacy AT */}
              <tr className="bg-gray-100 border-t-2 border-gray-300">
                <th
                  id={`date-group-${group.startKey || "unknown"}`}
                  scope="rowgroup"
                  colSpan={TABLE_COLSPAN}
                  className="px-4 py-2 text-left font-normal"
                >
                  <time dateTime={group.startKey || undefined} className="text-sm font-semibold text-gray-700">
                    {formatGroupDate(group.startKey)}
                  </time>
                </th>
              </tr>
              {group.items.map(({ tour, i }) => (
                <TourRow key={tour.detail_url ?? i} tour={tour} i={i} expanded={expandedRows.has(i)} onToggle={toggleRow} />
              ))}
            </tbody>
          ))}
        </table>
        </div>
      </div>
      {itemsToShow < visibleTours.length && (
        <div className="px-4 py-4 border-t border-gray-200 bg-gray-50 text-center">
          <button
            ref={showMoreButtonRef}
            type="button"
            onClick={() => {
              startTransition(() => setItemsToShow((prev) => prev + TABLE_ROWS_PER_PAGE));
              // Blur removes focus ring after click, allowing visual feedback to show
              showMoreButtonRef.current?.blur();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 sm:py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-colors cursor-pointer"
            aria-label={`Zeige ${Math.min(itemsToShow + TABLE_ROWS_PER_PAGE, visibleTours.length)} von ${visibleTours.length} Touren`}
            aria-live="polite"
          >
            Mehr anzeigen ({itemsToShow} von {visibleTours.length})
          </button>
        </div>
      )}
    </div>
  );
}
