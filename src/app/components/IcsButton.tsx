"use client";

import type { Tour } from "@/lib/types";
import { downloadIcs } from "@/lib/utils";
import { useCallback, useState } from "react";

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
          const data = await res.json() as {
            route_details?: string | null;
            additional_info?: string | null;
            equipment?: string | null;
            travel_route?: string | null;
            accommodation?: string | null;
            costs?: string | null;
            registration_start?: string | null;
          };
          const parts: string[] = [];
          if (data.route_details) { parts.push(`Route / Details:\n${data.route_details}`); }
          if (data.additional_info) { parts.push(`Zusatzinfo:\n${data.additional_info}`); }
          if (data.equipment) { parts.push(`Ausrüstung:\n${data.equipment}`); }
          if (data.travel_route) { parts.push(`Reiseroute:\n${data.travel_route}`); }
          if (data.accommodation) { parts.push(`Unterkunft / Verpflegung:\n${data.accommodation}`); }
          if (data.costs) { parts.push(`Kosten:\n${data.costs}`); }
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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={loading ? "Wird geladen…" : tooltip}
      aria-label={
        loading
          ? "Kalender-Datei wird vorbereitet…"
          : compact
            ? tooltip
            : undefined
      }
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

