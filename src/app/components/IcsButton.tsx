"use client";

import type { Tour, TourDetail } from "@/lib/types";
import { downloadIcs } from "@/lib/utils";
import { useCallback, useState } from "react";

// Ordered list of detail fields and their German display labels.
const DETAIL_LABELS: [keyof TourDetail, string][] = [
  ["route_details", "Route / Details"],
  ["additional_info", "Zusatzinfo"],
  ["equipment", "Ausrüstung"],
  ["travel_route", "Reiseroute"],
  ["accommodation", "Unterkunft / Verpflegung"],
  ["costs", "Kosten"],
];

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
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    let description: string | undefined;
    let registrationDate: string | undefined;
    if (tour.detail_url) {
      try {
        const res = await fetch(`/api/tour-detail?url=${encodeURIComponent(tour.detail_url)}`);
        if (res.ok) {
          const data = await res.json() as TourDetail;
          const parts = DETAIL_LABELS.flatMap(([key, label]) => {
            const val = data[key];
            return val ? [`${label}:\n${val}`] : [];
          });
          if (parts.length > 0) { description = parts.join("\n\n"); }
          registrationDate = data.registration_start ?? undefined;
        }
      } catch {
        // ignore — download without description
      }
    }
    downloadIcs(tour as Tour & { start_date: string }, description, registrationDate);
    setLoading(false);
    onAfterDownload?.();
  }, [tour, onAfterDownload]);

  if (!tour.start_date) { return null; }

  const tooltip = "Als .ics exportieren – enthält Tour-Termin und Anmeldungs-Erinnerung";
  let ariaLabel: string | undefined;
  if (loading) { ariaLabel = "Kalender-Datei wird vorbereitet…"; }
  else if (compact) { ariaLabel = tooltip; }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={loading ? "Wird geladen…" : tooltip}
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait",
        compact ? "gap-1 px-2 py-1" : "gap-1.5 px-2 py-1.5",
        fullWidth ? "w-full justify-center mt-3" : "",
      ].filter(Boolean).join(" ")}
    >
      {loading ? (
        <svg aria-hidden="true" className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      {compact ? ".ics" : "Kalender-Export"}
    </button>
  );
}

