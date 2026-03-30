"use client";

import type { Tour, TourDetail } from "@/lib/types";
import { buildGoogleCalendarRegistrationUrl, buildGoogleCalendarUrl, downloadIcs } from "@/lib/utils";
import { useCallback, useEffect, useId, useRef, useState } from "react";

// Ordered list of detail fields and their German display labels.
const DETAIL_LABELS: [keyof TourDetail, string][] = [
  ["route_details", "Route / Details"],
  ["additional_info", "Zusatzinfo"],
  ["equipment", "Ausrüstung"],
  ["travel_route", "Reiseroute"],
  ["accommodation", "Unterkunft / Verpflegung"],
  ["costs", "Kosten"],
];

function buildDescription(detail: TourDetail | null): string | undefined {
  if (!detail) { return undefined; }
  const parts = DETAIL_LABELS.flatMap(([key, label]) => {
    const val = detail[key];
    return val ? [`${label}:\n${val}`] : [];
  });
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

const BTN_BASE = "inline-flex items-center rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer";

export function CalendarExportButtons({
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
  const [open, setOpen] = useState(false);
  const [icsLoading, setIcsLoading] = useState(false);
  const [detail, setDetail] = useState<TourDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const buttonId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Shared in-flight fetch promise so every caller awaits the same request.
  const fetchPromiseRef = useRef<Promise<TourDetail | null>>(null);

  // Move focus into the first menu item when the menu is open and content is loaded.
  useEffect(() => {
    if (!open || detailLoading) { return; }
    const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    firstItem?.focus();
  }, [open, detailLoading]);

  // Close on outside click / tap; Escape is handled on the menu div directly (with
  // stopPropagation so it doesn't also close an enclosing dialog).
  useEffect(() => {
    if (!open) { return; }
    function onOutside(e: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(e.target as Node)) { setOpen(false); }
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [open]);

  // Fetch detail data; returns the result so callers can await it directly.
  const loadDetail = useCallback((): Promise<TourDetail | null> => {
    if (detail !== null) { return Promise.resolve(detail); }
    if (fetchPromiseRef.current) { return fetchPromiseRef.current; }
    if (!tour.detail_url) { return Promise.resolve(null); }
    setDetailLoading(true);
    const promise = fetch(`/api/tour-detail?url=${encodeURIComponent(tour.detail_url)}`)
      .then((res) => (res.ok ? res.json() as Promise<TourDetail> : null))
      .catch(() => null)
      .then((d) => {
        setDetail(d);
        setDetailLoading(false);
        fetchPromiseRef.current = null;
        return d;
      });
    fetchPromiseRef.current = promise;
    return promise;
  }, [detail, tour.detail_url]);

  const handleToggle = useCallback(() => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      void loadDetail();
    }
  }, [open, loadDetail]);

  const handleIcsDownload = useCallback(async () => {
    setOpen(false);
    setIcsLoading(true);
    // Awaits the same in-flight fetch that started when the dropdown opened.
    const d = await loadDetail();
    downloadIcs(tour as Tour & { start_date: string }, buildDescription(d), d?.registration_start ?? undefined);
    setIcsLoading(false);
    onAfterDownload?.();
  }, [loadDetail, tour, onAfterDownload]);

  if (!tour.start_date) { return null; }

  const sizedTour = tour as Tour & { start_date: string };
  const description = buildDescription(detail);
  const googleTourUrl = buildGoogleCalendarUrl(sizedTour, description);
  const googleRegUrl = detail?.registration_start
    ? buildGoogleCalendarRegistrationUrl(sizedTour, detail.registration_start, description)
    : null;

  const sizeClass = compact ? "gap-1 px-2 py-1" : "gap-1.5 px-2 py-1.5";

  return (
    <div
      ref={containerRef}
      className={["relative", fullWidth ? "w-full mt-3" : ""].filter(Boolean).join(" ")}
    >
      <button
        ref={triggerRef}
        id={buttonId}
        type="button"
        onClick={handleToggle}
        disabled={icsLoading}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={icsLoading ? "Wird geladen\u2026" : `Kalender-Export f\u00fcr ${tour.title}`}
        title={icsLoading ? "Wird geladen\u2026" : "Kalender-Export"}
        className={[
          BTN_BASE,
          sizeClass,
          fullWidth ? "w-full justify-center" : "",
          "disabled:opacity-60 disabled:cursor-wait",
        ].filter(Boolean).join(" ")}
      >
        {icsLoading ? (
          <svg aria-hidden="true" className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        {compact ? "Kal." : "Kalender"}
        {!icsLoading && (
          <svg
            aria-hidden="true"
            className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-labelledby={buttonId}
          aria-busy={detailLoading}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setOpen(false);
              triggerRef.current?.focus();
              return;
            }
            if (e.key === "Tab") {
              setOpen(false);
              // Don't preventDefault — let Tab/Shift+Tab move focus naturally
              // (the enclosing dialog's trap, if any, will still intercept it)
              return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
              e.preventDefault();
              const items = Array.from(
                menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
              );
              if (items.length === 0) { return; }
              const currentIdx = items.indexOf(document.activeElement as HTMLElement);
              let nextIdx: number;
              if (e.key === "Home") { nextIdx = 0; }
              else if (e.key === "End") { nextIdx = items.length - 1; }
              else if (e.key === "ArrowDown") { nextIdx = (currentIdx + 1) % items.length; }
              else { nextIdx = (currentIdx - 1 + items.length) % items.length; }
              items[nextIdx]?.focus();
            }
          }}
          className="absolute right-0 top-full mt-1 z-50 min-w-56 rounded-md border border-gray-200 bg-white shadow-lg py-1 text-xs"
        >
          {detailLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-3 text-gray-400">
              <svg aria-hidden="true" className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Tour-Details werden geladen…
            </div>
          ) : (
            <>
              <a
                role="menuitem"
                tabIndex={-1}
                href={googleTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Google Kalender: Tour
                <span className="sr-only"> (öffnet neuen Tab)</span>
              </a>
              {googleRegUrl && (
                <a
                  role="menuitem"
                  tabIndex={-1}
                  href={googleRegUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Google Kalender: Anmeldung
                  <span className="sr-only"> (öffnet neuen Tab)</span>
                </a>
              )}
              <div role="separator" className="border-t border-gray-100 my-1" />
              <button
                role="menuitem"
                tabIndex={-1}
                type="button"
                onClick={handleIcsDownload}
                className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Als .ics herunterladen
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

