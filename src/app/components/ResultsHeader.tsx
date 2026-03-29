"use client";

export function ResultsHeader({
  totalScraped,
  visibleCount,
  showFull,
  onShowFullChange,
}: {
  totalScraped: number;
  visibleCount: number;
  showFull: boolean;
  onShowFullChange: (value: boolean) => void;
}) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
        <span title={`${visibleCount} von ${totalScraped} Touren angezeigt`} className="text-sm text-gray-500 tabular-nums">
          <span className="sm:hidden">{visibleCount} / {totalScraped} Touren</span>
          <span className="hidden sm:inline">{visibleCount} von {totalScraped} Touren angezeigt</span>
        </span>
      </div>
    </div>
  );
}
