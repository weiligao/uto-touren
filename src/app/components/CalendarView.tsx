"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { Tour } from "@/lib/types";
import { compareDifficulties, formatDuration, na, parseDateString } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IcsButton } from "./IcsButton";
import { ResultsHeader } from "./ResultsHeader";
import { TourTitle } from "./TourTitle";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAY_FULL_NAMES = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

interface CalendarTour {
  tour: Tour & { start_date: string };
  startDate: Date;
  days: number;
}

function getCalendarDays(year: number, month: number) {
  // Monday = 0 ... Sunday = 6
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) {cells.push(null);}
  for (let d = 1; d <= daysInMonth; d++) {cells.push(d);}
  while (cells.length % 7 !== 0) {cells.push(null);}

  return cells;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${month}-${day}`;
}

function buildTourMap(tours: CalendarTour[], year: number, month: number) {
  const map = new Map<string, CalendarTour[]>();

  for (const ct of tours) {
    for (let d = 0; d < ct.days; d++) {
      const date = new Date(
        ct.startDate.getFullYear(),
        ct.startDate.getMonth(),
        ct.startDate.getDate() + d,
      );
      if (date.getFullYear() === year && date.getMonth() === month) {
        const key = dateKey(year, month, date.getDate());
        const list = map.get(key);
        if (list) { list.push(ct); } else { map.set(key, [ct]); }
      }
    }
  }

  return map;
}

const TOOLTIP_WIDTH = 256; // w-64
const TOOLTIP_APPROX_HEIGHT = 300;
const VIEWPORT_MARGIN = 8;

function TourTooltip({ tour, anchorRef, onClose }: { tour: Tour; anchorRef: React.RefObject<HTMLDivElement | null>; onClose: () => void }) {
  const [dialogStyle, setDialogStyle] = useState<{
    top: number;
    left?: number;
    right?: number;
    width?: number;
    transform?: string;
  } | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Measure anchor position after paint. The `if (!dialogStyle) return null` guard
  // below prevents a visible flash, so useLayoutEffect is not needed here.
  useEffect(() => {
    function updatePosition() {
      if (!anchorRef.current) { return; }
      const rect = anchorRef.current.getBoundingClientRect();
      const above = rect.top - TOOLTIP_APPROX_HEIGHT > VIEWPORT_MARGIN;
      const top = above ? rect.top - 8 : rect.bottom + 8;
      if (window.innerWidth < 640) {
        setDialogStyle({ top, left: 12, right: 12, transform: above ? "translateY(-100%)" : "none" });
      } else {
        const rawLeft = rect.left + rect.width / 2;
        const clampedLeft = Math.min(
          Math.max(rawLeft, TOOLTIP_WIDTH / 2 + VIEWPORT_MARGIN),
          window.innerWidth - TOOLTIP_WIDTH / 2 - VIEWPORT_MARGIN,
        );
        setDialogStyle({ top, left: clampedLeft, width: TOOLTIP_WIDTH, transform: `translate(-50%, ${above ? "-100%" : "0"})` });
      }
    }
    updatePosition();
  }, [anchorRef]);

  // Move focus to the close button when the dialog opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const insideAnchor = anchorRef.current?.contains(target) ?? false;
      const insideDialog = dialogRef.current?.contains(target) ?? false;
      if (!insideAnchor && !insideDialog) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [anchorRef, onClose]);

  if (!dialogStyle) { return null; }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-dialog-title"
      className="fixed z-50 bg-white border border-gray-200 rounded-lg p-3 shadow-lg"
      style={dialogStyle}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p id="tour-dialog-title" className="font-semibold text-sm text-gray-900">
          <TourTitle title={tour.title} url={tour.detail_url} />
        </p>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label="Schließen"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
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
            <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[tour.status]}`} />
            {STATUS_LABELS[tour.status]}
          </dd>
        </div>
      </dl>
      <IcsButton tour={tour} onAfterDownload={onClose} fullWidth />
    </div>
  );
}

function TourPill({
  ct,
}: {
  ct: CalendarTour;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dotColor = STATUS_COLORS[ct.tour.status];
  const handleClose = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${ct.tour.title} — ${STATUS_LABELS[ct.tour.status]}`}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight bg-blue-50 hover:bg-blue-100 text-left cursor-pointer"
      >
        <span aria-hidden="true" className={`shrink-0 inline-block h-2 w-2 rounded-full ${dotColor}`} />
        <span className="truncate">{ct.tour.title}</span>
      </button>
      {open && <TourTooltip tour={ct.tour} anchorRef={ref} onClose={handleClose} />}
    </div>
  );
}

function detectInitialMonth(tours: CalendarTour[]): number {
  if (tours.length === 0) { return new Date().getMonth(); }
  return Math.min(...tours.map((ct) => ct.startDate.getMonth()));
}

const SWIPE_THRESHOLD = 50;

export function CalendarView({
  tours,
  year,
}: {
  tours: Tour[];
  year: string;
}) {
  const yearNum = parseInt(year, 10);

  const calendarTours = useMemo<CalendarTour[]>(
    () =>
      tours
        .filter((tour): tour is Tour & { start_date: string } => tour.start_date !== null)
        .map((tour) => ({
          tour,
          startDate: parseDateString(tour.start_date),
          days: Math.max(1, tour.duration_days),
        })),
    [tours],
  );

  const [month, setMonth] = useState(() => detectInitialMonth(calendarTours));
  const [showFull, setShowFull] = useState(false);
  const [selectedDurations, setSelectedDurations] = useState<Set<number>>(new Set());
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set());

  const durations = useMemo(
    () => [...new Set(calendarTours.map((ct) => ct.tour.duration_days))].sort((a, b) => a - b),
    [calendarTours],
  );

  const difficulties = useMemo(
    () => [...new Set(calendarTours.map((ct) => ct.tour.difficulty))].sort(compareDifficulties),
    [calendarTours],
  );

  const visibleCalendarTours = useMemo(() => {
    let result = showFull ? calendarTours : calendarTours.filter((ct) => ct.tour.status !== "full_or_cancelled");
    if (selectedDurations.size > 0) {
      result = result.filter((ct) => selectedDurations.has(ct.tour.duration_days));
    }
    if (selectedDifficulties.size > 0) {
      result = result.filter((ct) => selectedDifficulties.has(ct.tour.difficulty));
    }
    return result;
  }, [calendarTours, showFull, selectedDurations, selectedDifficulties]);

  const { minMonth, maxMonth } = useMemo(() => {
    if (calendarTours.length === 0) { return { minMonth: 0, maxMonth: 11 }; }
    return calendarTours.reduce(
      (acc, ct) => {
        const m = ct.startDate.getMonth();
        return { minMonth: Math.min(acc.minMonth, m), maxMonth: Math.max(acc.maxMonth, m) };
      },
      { minMonth: 11, maxMonth: 0 },
    );
  }, [calendarTours]);

  // Skip the initial run — useState already set the correct month via the lazy initializer.
  // Only reset when calendarTours changes after mount (e.g. new search).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    function reset() {
      setMonth(detectInitialMonth(calendarTours));
      setSelectedDurations(new Set());
      setSelectedDifficulties(new Set());
    }
    reset();
  }, [calendarTours]);

  const cells = useMemo(() => getCalendarDays(yearNum, month), [yearNum, month]);
  const tourMap = useMemo(
    () => buildTourMap(visibleCalendarTours, yearNum, month),
    [visibleCalendarTours, yearNum, month],
  );

  const prevMonth = useCallback(() => setMonth((m) => Math.max(m - 1, minMonth)), [minMonth]);
  const nextMonth = useCallback(() => setMonth((m) => Math.min(m + 1, maxMonth)), [maxMonth]);

  const swipeStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (swipeStartX.current === null) { return; }
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (dx > SWIPE_THRESHOLD) { prevMonth(); }
    else if (dx < -SWIPE_THRESHOLD) { nextMonth(); }
  }, [prevMonth, nextMonth]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <ResultsHeader
        totalScraped={calendarTours.length}
        visibleCount={visibleCalendarTours.length}
        showFull={showFull}
        onShowFullChange={setShowFull}
        durations={durations}
        selectedDurations={selectedDurations}
        onDurationsChange={setSelectedDurations}
        difficulties={difficulties}
        selectedDifficulties={selectedDifficulties}
        onDifficultiesChange={setSelectedDifficulties}
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <button
          type="button"
          onClick={prevMonth}
          disabled={month <= minMonth}
          aria-label={month <= minMonth ? `Keine Touren vor ${MONTH_NAMES[minMonth]}` : `Zu ${MONTH_NAMES[month - 1]}`}
          className="p-1 rounded hover:bg-gray-100 text-gray-600 cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[month]} {yearNum}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          disabled={month >= maxMonth}
          aria-label={month >= maxMonth ? `Keine Touren nach ${MONTH_NAMES[maxMonth]}` : `Zu ${MONTH_NAMES[month + 1]}`}
          className="p-1 rounded hover:bg-gray-100 text-gray-600 cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="p-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div role="grid" aria-label={`${MONTH_NAMES[month]} ${yearNum} calendar`} className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Header row */}
          <div role="row" className="contents">
            {WEEKDAYS.map((d, idx) => (
              <div
                key={d}
                role="columnheader"
                aria-label={WEEKDAY_FULL_NAMES[idx]}
                className="bg-gray-50 text-center text-xs font-medium text-gray-500 py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {Array.from({ length: Math.ceil(cells.length / 7) }, (_, rowIdx) =>
            cells.slice(rowIdx * 7, rowIdx * 7 + 7)
          ).map((row, rowIdx) => (
            <div key={`row-${yearNum}-${month}-${rowIdx}`} role="row" className="contents">
              {row.map((day, colIdx) => {
                const cellIdx = rowIdx * 7 + colIdx;
                const key = day ? dateKey(yearNum, month, day) : `empty-${cellIdx}`;
                const toursForDay = day ? tourMap.get(key) ?? [] : [];
                return (
                  <div
                    key={key}
                    role="gridcell"
                    className={`min-h-22.5 p-1 ${day ? "bg-white" : "bg-gray-50"}`}
                  >
                    {day && (
                      <>
                        <div className="text-xs text-gray-500 mb-0.5">{day}</div>
                        <div className="space-y-0.5 overflow-y-auto max-h-17.5">
                          {toursForDay.map((ct, pillIdx) => (
                            <TourPill key={`${ct.tour.title}-${ct.tour.start_date}-${pillIdx}`} ct={ct} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
