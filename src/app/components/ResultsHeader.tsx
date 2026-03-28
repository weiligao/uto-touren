"use client";

export function ResultsHeader({
  totalScraped,
  visibleCount,
  hideFull,
  onHideFullChange,
}: {
  totalScraped: number;
  visibleCount: number;
  hideFull: boolean;
  onHideFullChange: (value: boolean) => void;
}) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <h2 className="text-lg font-semibold text-gray-800">Results</h2>
      <div className="flex items-center justify-between sm:justify-end gap-12">
        <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideFull}
            onChange={(e) => onHideFullChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 cursor-pointer"
          />
          Hide full/cancelled
        </label>
        <span className="text-sm text-gray-500 tabular-nums">
          {visibleCount} of {totalScraped} tours found
        </span>
      </div>
    </div>
  );
}
