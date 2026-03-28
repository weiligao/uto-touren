"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { Tour } from "@/lib/types";
import { formatDuration, na, parseDateString } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IcsButton } from "./IcsButton";
import { ResultsHeader } from "./ResultsHeader";
import { TourTitle } from "./TourTitle";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_FULL_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalendarTour {
  tour: Tour;
  startDate: Date;
  days: number;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0 ... Sunday = 6
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

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
      const date = new Date(ct.startDate);
      date.setDate(date.getDate() + d);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const key = dateKey(year, month, date.getDate());
        const list = map.get(key) ?? [];
        list.push(ct);
        map.set(key, list);
      }
    }
  }

  return map;
}

const TOOLTIP_WIDTH = 256; // w-64
const TOOLTIP_APPROX_HEIGHT = 300;
const VIEWPORT_MARGIN = 8;

function TourTooltip({ tour, anchorRef, onClose }: { tour: Tour; anchorRef: React.RefObject<HTMLDivElement | null>; onClose: () => void }) {
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);

  useEffect(() => {
    if (!anchorRef.current) {return;}
    const rect = anchorRef.current.getBoundingClientRect();
    const rawLeft = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      Math.max(rawLeft, TOOLTIP_WIDTH / 2 + VIEWPORT_MARGIN),
      window.innerWidth - TOOLTIP_WIDTH / 2 - VIEWPORT_MARGIN,
    );
    const above = rect.top - TOOLTIP_APPROX_HEIGHT > VIEWPORT_MARGIN;
    setPos({
      top: above ? rect.top - 8 : rect.bottom + 8,
      left: clampedLeft,
      above,
    });
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
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

  if (!pos) {return null;}

  const tooltipContent = (
    <>
      <p className="font-semibold text-sm text-gray-900 mb-3">
        <TourTitle title={tour.title} url={tour.detail_url} />
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <dt className="font-medium text-gray-500">Duration</dt>
          <dd className="text-gray-800">{formatDuration(tour.duration_days)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Difficulty</dt>
          <dd className="text-gray-800">{na(tour.difficulty)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Group</dt>
          <dd className="text-gray-800">{na(tour.group)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Leader</dt>
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
    </>
  );

  return (
    <>
      {/* Mobile: full-width */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tour.title}
        className="sm:hidden fixed z-50 left-3 right-3 bg-white border border-gray-200 rounded-lg p-3 shadow-lg"
        style={{ top: pos.above ? pos.top - 8 : pos.top + 8, transform: pos.above ? "translateY(-100%)" : "none" }}
      >
        {tooltipContent}
      </div>
      {/* Desktop: anchored */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tour.title}
        className="hidden sm:block fixed z-50 w-64 bg-white border border-gray-200 rounded-lg p-3 shadow-lg"
        style={{ top: pos.top, left: pos.left, transform: `translate(-50%, ${pos.above ? "-100%" : "0"})` }}
      >
        {tooltipContent}
      </div>
    </>
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
  if (tours.length === 0) {return new Date().getMonth();}
  return tours.reduce((min, ct) => Math.min(min, ct.startDate.getMonth()), 11);
}

const SWIPE_THRESHOLD = 50;

export function CalendarView({
  tours,
  totalScraped,
  year,
}: {
  tours: Tour[];
  totalScraped: number;
  year: string;
}) {
  const yearNum = parseInt(year, 10);

  const calendarTours = useMemo<CalendarTour[]>(
    () =>
      tours
        .filter((tour) => tour.start_date !== null)
        .map((tour) => ({
          tour,
          startDate: parseDateString(tour.start_date!),
          days: Math.max(1, tour.duration_days),
        })),
    [tours],
  );

  const [month, setMonth] = useState(() => detectInitialMonth(calendarTours));
  const [hideFull, setHideFull] = useState(false);

  const visibleCalendarTours = useMemo(
    () => hideFull ? calendarTours.filter((ct) => ct.tour.status !== "full_or_cancelled") : calendarTours,
    [calendarTours, hideFull],
  );

  const { minMonth, maxMonth } = useMemo(() => {
    if (calendarTours.length === 0) { return { minMonth: 0, maxMonth: 11 }; }
    const months = calendarTours.map((ct) => ct.startDate.getMonth());
    return { minMonth: Math.min(...months), maxMonth: Math.max(...months) };
  }, [calendarTours]);

  useEffect(() => {
    setMonth(detectInitialMonth(calendarTours));
  }, [calendarTours]);

  const cells = getCalendarDays(yearNum, month);
  const tourMap = buildTourMap(visibleCalendarTours, yearNum, month);

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
        totalScraped={totalScraped}
        visibleCount={visibleCalendarTours.length}
        hideFull={hideFull}
        onHideFullChange={setHideFull}
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <button
          type="button"
          onClick={prevMonth}
          disabled={month <= minMonth}
          aria-label={month <= minMonth ? `No tours before ${MONTH_NAMES[minMonth]}` : `Go to ${MONTH_NAMES[month - 1]}`}
          title={month <= minMonth ? `No tours before ${MONTH_NAMES[minMonth]}` : `Go to ${MONTH_NAMES[month - 1]}`}
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
          aria-label={month >= maxMonth ? `No tours after ${MONTH_NAMES[maxMonth]}` : `Go to ${MONTH_NAMES[month + 1]}`}
          title={month >= maxMonth ? `No tours after ${MONTH_NAMES[maxMonth]}` : `Go to ${MONTH_NAMES[month + 1]}`}
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
          {/* Header */}
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

          {/* Day cells */}
          {cells.map((day, i) => {
            const key = day ? dateKey(yearNum, month, day) : `empty-${i}`;
            const toursForDay = day ? tourMap.get(dateKey(yearNum, month, day)) ?? [] : [];

            return (
              <div
                key={key}
                className={`bg-white min-h-22.5 p-1 ${day ? "" : "bg-gray-50"}`}
              >
                {day && (
                  <>
                    <div className="text-xs text-gray-500 mb-0.5">{day}</div>
                    <div className="space-y-0.5 overflow-y-auto max-h-17.5">
                      {toursForDay.map((ct) => (
                        <TourPill key={`${ct.tour.title}-${ct.tour.start_date}`} ct={ct} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
