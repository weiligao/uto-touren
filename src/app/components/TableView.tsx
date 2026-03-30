"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { formatDate, formatDuration, na } from "@/lib/utils";
import { memo, useCallback, useMemo, useState } from "react";
import { CalendarExportButtons } from "./IcsButton";
import { ResultsHeader } from "./ResultsHeader";
import { TourTitle } from "./TourTitle";
import { useFilterState } from "./useFilterState";

const TABLE_COLUMNS: { label: string; mobileHidden?: boolean; center?: boolean }[] = [
  { label: "Status", center: true, mobileHidden: true },
  { label: "Datum" },
  { label: "Dauer", mobileHidden: true },
  { label: "Schwierigkeit", mobileHidden: true },
  { label: "Gruppe", mobileHidden: true },
  { label: "Titel" },
  { label: "Leiter/in", mobileHidden: true },
];

function StatusDot({ status }: { status: TourStatus }) {
  return (
    <span
      role="img"
      aria-label={STATUS_LABELS[status]}
      className={`inline-block h-3 w-3 rounded-full ${STATUS_COLORS[status]}`}
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
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="hidden sm:table-cell px-4 py-3 text-center">
          <StatusDot status={tour.status} />
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-gray-900">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`sm:hidden inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[tour.status]}`} />
            <span className="sr-only sm:hidden">{STATUS_LABELS[tour.status]}</span>
            {formatDate(tour.start_date, tour.date)}
          </span>
        </td>
        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
          {formatDuration(tour.duration_days)}
        </td>
        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
          {na(tour.difficulty)}
        </td>
        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
          {na(tour.group)}
        </td>
        <td className="px-4 py-3 text-gray-900">
          <TourTitle title={tour.title} url={tour.detail_url} />
        </td>
        <td className="hidden sm:table-cell px-4 py-3 text-gray-700">{na(tour.leader)}</td>
        <td className="hidden sm:table-cell px-3 py-3 text-center">
          <CalendarExportButtons tour={tour} compact />
        </td>
        <td className="sm:hidden px-2 pr-4 py-3 text-center">
          <button
            type="button"
            onClick={() => onToggle(i)}
            className="p-1 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
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
        <td colSpan={4} className="px-4 py-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="font-medium text-gray-500">Dauer</dt>
              <dd className="text-gray-800">{formatDuration(tour.duration_days)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Schwierigkeit</dt>
              <dd className="text-gray-800">{na(tour.difficulty)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Gruppe</dt>
              <dd className="text-gray-800">{na(tour.group)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Leiter/in</dt>
              <dd className="text-gray-800">{na(tour.leader)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Status</dt>
              <dd className="flex items-center gap-1.5 text-gray-800">
                <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[tour.status]}`} />
                {STATUS_LABELS[tour.status]}
              </dd>
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
}: {
  tours: Tour[];
  totalScraped: number;
}) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [lastTours, setLastTours] = useState(tours);
  const {
    statuses,
    selectedStatuses,
    setSelectedStatuses,
    durations,
    selectedDurations,
    setSelectedDurations,
    difficulties,
    selectedDifficulties,
    setSelectedDifficulties,
    groups,
    selectedGroups,
    setSelectedGroups,
    resetFilters,
    matchesTour,
  } = useFilterState(tours);

  // Reset expanded rows and filters when the tours list changes (derived state pattern)
  if (lastTours !== tours) {
    setLastTours(tours);
    setExpandedRows(new Set());
    resetFilters();
  }

  const toggleRow = useCallback((i: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) { next.delete(i); } else { next.add(i); }
      return next;
    });
  }, []);

  const visibleTours = useMemo(
    () => tours.map((tour, i) => ({ tour, i })).filter(({ tour }) => matchesTour(tour)),
    [tours, matchesTour],
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <ResultsHeader
        totalScraped={totalScraped}
        visibleCount={visibleTours.length}
        statuses={statuses}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        durations={durations}
        selectedDurations={selectedDurations}
        onDurationsChange={setSelectedDurations}
        difficulties={difficulties}
        selectedDifficulties={selectedDifficulties}
        onDifficultiesChange={setSelectedDifficulties}
        groups={groups}
        selectedGroups={selectedGroups}
        onGroupsChange={setSelectedGroups}
      />
      <div className="overflow-x-auto">
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
          <tbody className="divide-y divide-gray-100">
            {visibleTours.map(({ tour, i }) => (
              <TourRow key={i} tour={tour} i={i} expanded={expandedRows.has(i)} onToggle={toggleRow} />
            ))}
            {visibleTours.length === 0 && (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 2} className="px-6 py-16 text-center text-sm text-gray-500">
                  {tours.length === 0 ? (
                    "Keine Touren gefunden."
                  ) : (
                    <>
                      <p className="mb-3">Keine Touren für diese Filter.</p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Filter zurücksetzen
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
