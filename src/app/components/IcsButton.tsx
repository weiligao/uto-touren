"use client";

import type { Tour } from "@/lib/types";
import { downloadIcs } from "@/lib/utils";

export function IcsButton({
  tour,
  onAfterDownload,
  compact = false,
  fullWidth = false,
}: {
  tour: Tour;
  onAfterDownload?: () => void;
  compact?: boolean;
  fullWidth?: boolean;
}) {
  if (!tour.start_date) { return null; }

  function handleClick() {
    downloadIcs(tour as Tour & { start_date: string });
    onAfterDownload?.();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={compact ? "Als .ics herunterladen und zum Kalender hinzufügen" : undefined}
      className={[
        "inline-flex items-center rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer",
        compact ? "gap-1 px-2 py-1" : "gap-1.5 px-2 py-1.5",
        fullWidth ? "w-full justify-center mt-3" : "",
      ].filter(Boolean).join(" ")}
    >
      <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {compact ? ".ics" : "Kalender-Export"}
    </button>
  );
}
