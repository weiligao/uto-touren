"use client";

import { formatDuration } from "@/lib/utils";

export function ResultsHeader({
  totalScraped,
  visibleCount,
  showFull,
  onShowFullChange,
  durations,
  selectedDurations,
  onDurationsChange,
  difficulties,
  selectedDifficulties,
  onDifficultiesChange,
}: {
  totalScraped: number;
  visibleCount: number;
  showFull: boolean;
  onShowFullChange: (value: boolean) => void;
  durations?: number[];
  selectedDurations?: Set<number>;
  onDurationsChange?: (v: Set<number>) => void;
  difficulties?: string[];
  selectedDifficulties?: Set<string>;
  onDifficultiesChange?: (v: Set<string>) => void;
}) {
  return (
    <div className="border-b border-gray-200">
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Ergebnisse</h2>
        <div className="flex items-center justify-between sm:justify-end gap-12">
          <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showFull}
              onChange={(e) => onShowFullChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 cursor-pointer"
            />
            <span className="sm:hidden">Ausgebucht/Abgesagt</span>
            <span className="hidden sm:inline">Ausgebucht/Abgesagt anzeigen</span>
          </label>
          <span aria-live="polite" title={`${visibleCount} von ${totalScraped} Touren angezeigt`} className="text-sm text-gray-500 tabular-nums">
            <span className="sm:hidden">{visibleCount} / {totalScraped} Touren</span>
            <span className="hidden sm:inline">{visibleCount} von {totalScraped} Touren angezeigt</span>
          </span>
        </div>
      </div>
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
    </div>
  );
}
