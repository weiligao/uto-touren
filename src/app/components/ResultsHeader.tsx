"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { TourStatus } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { useState } from "react";

export function ResultsHeader({
  totalScraped,
  visibleCount,
  statuses,
  selectedStatuses,
  onStatusesChange,
  durations,
  selectedDurations,
  onDurationsChange,
  difficulties,
  selectedDifficulties,
  onDifficultiesChange,
  groups,
  selectedGroups,
  onGroupsChange,
}: {
  totalScraped: number;
  visibleCount: number;
  statuses?: TourStatus[];
  selectedStatuses?: Set<TourStatus>;
  onStatusesChange?: (v: Set<TourStatus>) => void;
  durations?: number[];
  selectedDurations?: Set<number>;
  onDurationsChange?: (v: Set<number>) => void;
  difficulties?: string[];
  selectedDifficulties?: Set<string>;
  onDifficultiesChange?: (v: Set<string>) => void;
  groups?: string[];
  selectedGroups?: Set<string>;
  onGroupsChange?: (v: Set<string>) => void;
}) {
  const hasFilterRows =
    (statuses && statuses.length > 1) ??
    (durations && durations.length > 1) ??
    (difficulties && difficulties.length > 1) ??
    (groups && groups.length > 1);
  const activeFilterCount = (selectedStatuses?.size ?? 0) + (selectedDurations?.size ?? 0) + (selectedDifficulties?.size ?? 0) + (selectedGroups?.size ?? 0);
  const [filtersOpen, setFiltersOpen] = useState(true);

  return (
    <div className="border-b border-gray-200">
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Ergebnisse</h2>
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-12">
          {hasFilterRows && (
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="results-filters"
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <svg aria-hidden="true" className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span aria-label={`${activeFilterCount} Filter aktiv`} className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
          <span aria-live="polite" title={`${visibleCount} von ${totalScraped} Touren angezeigt`} className="text-sm text-gray-500 tabular-nums">
            <span className="sm:hidden">{visibleCount} / {totalScraped} Touren</span>
            <span className="hidden sm:inline">{visibleCount} von {totalScraped} Touren angezeigt</span>
          </span>
        </div>
      </div>
      {hasFilterRows && filtersOpen && (
        <div id="results-filters">
          {statuses && statuses.length > 1 && (
            <div
              role="group"
              aria-labelledby="status-filter-label"
              className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-2 items-center"
            >
              <span id="status-filter-label" className="text-xs font-medium text-gray-500 shrink-0">Status:</span>
              <button
                type="button"
                aria-pressed={!selectedStatuses?.size}
                onClick={() => onStatusesChange?.(new Set())}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  !selectedStatuses?.size
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Alle
              </button>
              {statuses.map((s) => {
                const active = selectedStatuses?.has(s) ?? false;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      const next = new Set(selectedStatuses);
                      if (active) { next.delete(s); } else { next.add(s); }
                      onStatusesChange?.(next);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full shrink-0 ${active ? "bg-white" : STATUS_COLORS[s]}`} />
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          )}
          {durations && durations.length > 1 && (
            <div
              role="group"
              aria-labelledby="duration-filter-label"
              className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-2 items-center"
            >
              <span id="duration-filter-label" className="text-xs font-medium text-gray-500 shrink-0">Dauer (Tage):</span>
              <button
                type="button"
                aria-pressed={!selectedDurations?.size}
                onClick={() => onDurationsChange?.(new Set())}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  !selectedDurations?.size
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Alle
              </button>
              {durations.map((d) => {
                const active = selectedDurations?.has(d) ?? false;
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={active}
                    aria-label={formatDuration(d)}
                    onClick={() => {
                      const next = new Set(selectedDurations);
                      if (active) { next.delete(d); } else { next.add(d); }
                      onDurationsChange?.(next);
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}
          {difficulties && difficulties.length > 1 && (
            <div
              role="group"
              aria-labelledby="difficulty-filter-label"
              className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-2 items-center"
            >
              <span id="difficulty-filter-label" className="text-xs font-medium text-gray-500 shrink-0">Schwierigkeit:</span>
              <button
                type="button"
                aria-pressed={!selectedDifficulties?.size}
                onClick={() => onDifficultiesChange?.(new Set())}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  !selectedDifficulties?.size
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Alle
              </button>
              {difficulties.map((d) => {
                const active = selectedDifficulties?.has(d) ?? false;
                return (
                  <button
                    key={d || "__empty__"}
                    type="button"
                    aria-pressed={active}
                    aria-label={d || "Unbekannt"}
                    onClick={() => {
                      const next = new Set(selectedDifficulties);
                      if (active) { next.delete(d); } else { next.add(d); }
                      onDifficultiesChange?.(next);
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {d || "Unbekannt"}
                  </button>
                );
              })}
            </div>
          )}
          {groups && groups.length > 1 && (
            <div
              role="group"
              aria-labelledby="group-filter-label"
              className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-2 items-center"
            >
              <span id="group-filter-label" className="text-xs font-medium text-gray-500 shrink-0">Gruppe:</span>
              <button
                type="button"
                aria-pressed={!selectedGroups?.size}
                onClick={() => onGroupsChange?.(new Set())}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  !selectedGroups?.size
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Alle
              </button>
              {groups.map((g) => {
                const active = selectedGroups?.has(g) ?? false;
                return (
                  <button
                    key={g !== "" ? g : "__empty__"}
                    type="button"
                    aria-pressed={active}
                    aria-label={g !== "" ? g : "Unbekannt"}
                    onClick={() => {
                      const next = new Set(selectedGroups);
                      if (active) { next.delete(g); } else { next.add(g); }
                      onGroupsChange?.(next);
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {g !== "" ? g : "Unbekannt"}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


