"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { TourStatus } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { useId, useState } from "react";

const chipBase =
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer";
const chipActive = "border-blue-600 bg-blue-600 text-white";
const chipInactive =
  "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50";

function FilterRow({
  labelId,
  label,
  hasActive,
  onReset,
  children,
}: {
  labelId: string;
  label: string;
  hasActive: boolean;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-y-1.5 gap-x-4 items-start"
    >
      <span
        id={labelId}
        className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 shrink-0 sm:pt-0.5"
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {hasActive && (
          <button
            type="button"
            aria-label="Filter zurücksetzen"
            onClick={onReset}
            className={`${chipBase} border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500`}
          >
            <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

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
    !!(statuses && statuses.length > 1) ||
    !!(durations && durations.length > 1) ||
    !!(difficulties && difficulties.length > 1) ||
    !!(groups && groups.length > 1);
  const activeFilterCount =
    (selectedStatuses?.size ?? 0) +
    (selectedDurations?.size ?? 0) +
    (selectedDifficulties?.size ?? 0) +
    (selectedGroups?.size ?? 0);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const filterPanelId = useId();
  const statusLabelId = useId();
  const durationLabelId = useId();
  const difficultyLabelId = useId();
  const groupLabelId = useId();

  return (
    <div className="border-b border-gray-200">
      {/* Header bar */}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Ergebnisse</h2>
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-12">
          {hasFilterRows && (
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls={filterPanelId}
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <svg
                aria-hidden="true"
                className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span
                  aria-label={`${activeFilterCount} Filter aktiv`}
                  className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none"
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
          <span
            aria-live="polite"
            title={`${visibleCount} von ${totalScraped} Touren angezeigt`}
            className="text-sm text-gray-500 tabular-nums"
          >
            <span className="sm:hidden">
              {visibleCount} / {totalScraped} Touren
            </span>
            <span className="hidden sm:inline">
              {visibleCount} von {totalScraped} Touren angezeigt
            </span>
          </span>
        </div>
      </div>

      {/* Filter panel */}
      {hasFilterRows && filtersOpen && (
        <div
          id={filterPanelId}
          className="border-t border-gray-100 bg-gray-50/60 px-6 py-4 flex flex-col gap-4"
        >
          {statuses && statuses.length > 1 && (
            <FilterRow
              labelId={statusLabelId}
              label="Status"
              hasActive={!!selectedStatuses?.size}
              onReset={() => onStatusesChange?.(new Set())}
            >
              {statuses.map((s) => {
                const active = selectedStatuses?.has(s) ?? false;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      const next = new Set(selectedStatuses);
                      if (active) {
                        next.delete(s);
                      } else {
                        next.add(s);
                      }
                      onStatusesChange?.(next);
                    }}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-2 w-2 rounded-full shrink-0 ${active ? "bg-white/80" : STATUS_COLORS[s]}`}
                    />
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {durations && durations.length > 1 && (
            <FilterRow
              labelId={durationLabelId}
              label="Dauer (Tage)"
              hasActive={!!selectedDurations?.size}
              onReset={() => onDurationsChange?.(new Set())}
            >
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
                      if (active) {
                        next.delete(d);
                      } else {
                        next.add(d);
                      }
                      onDurationsChange?.(next);
                    }}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    {d}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {difficulties && difficulties.length > 1 && (
            <FilterRow
              labelId={difficultyLabelId}
              label="Schwierigkeit"
              hasActive={!!selectedDifficulties?.size}
              onReset={() => onDifficultiesChange?.(new Set())}
            >
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
                      if (active) {
                        next.delete(d);
                      } else {
                        next.add(d);
                      }
                      onDifficultiesChange?.(next);
                    }}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    {d || "Unbekannt"}
                  </button>
                );
              })}
            </FilterRow>
          )}

          {groups && groups.length > 1 && (
            <FilterRow
              labelId={groupLabelId}
              label="Gruppe"
              hasActive={!!selectedGroups?.size}
              onReset={() => onGroupsChange?.(new Set())}
            >
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
                      if (active) {
                        next.delete(g);
                      } else {
                        next.add(g);
                      }
                      onGroupsChange?.(next);
                    }}
                    className={`${chipBase} ${active ? chipActive : chipInactive}`}
                  >
                    {g !== "" ? g : "Unbekannt"}
                  </button>
                );
              })}
            </FilterRow>
          )}
        </div>
      )}
    </div>
  );
}


