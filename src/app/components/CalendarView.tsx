"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { Tour } from "@/lib/types";
import { downloadTourIcs, formatDate, formatDuration, na, parseDateString } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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

function TourTooltip({ tour, eventType, anchorRef, onClose }: { tour: Tour; eventType: string; anchorRef: React.RefObject<HTMLDivElement | null>; onClose: () => void }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!anchorRef.current) {return;}
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorRef, onClose]);

  if (!pos) {return null;}

  return (
    <div
      className="fixed z-50 w-64 bg-white border border-gray-200 rounded-lg p-3 shadow-lg"
      style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}
    >
      <p className="font-semibold text-sm text-gray-900 mb-2">
        {tour.detail_url ? (
          <a href={tour.detail_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {tour.title}
            <svg className="inline h-3 w-3 ml-1 mb-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : tour.title}
      </p>
      <div className="space-y-1 text-xs text-gray-600">
        <p><span className="font-medium text-gray-700">Date:</span> {formatDate(tour.start_date, tour.date)}</p>
        <p><span className="font-medium text-gray-700">Duration:</span> {formatDuration(tour.duration_days)}</p>
        <p><span className="font-medium text-gray-700">Type:</span> {eventType} / {na(tour.tour_type)}</p>
        <p><span className="font-medium text-gray-700">Difficulty:</span> {na(tour.difficulty)}</p>
        <p><span className="font-medium text-gray-700">Group:</span> {na(tour.group)}</p>
        <p><span className="font-medium text-gray-700">Leader:</span> {na(tour.leader)}</p>
        <p className="flex items-center gap-1">
          <span className="font-medium text-gray-700">Status:</span>
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[tour.status]}`} />
          {STATUS_LABELS[tour.status]}
        </p>
      </div>
      {tour.start_date && (
        <button
          onClick={() => { downloadTourIcs(tour); onClose(); }}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Add to calendar (.ics)
        </button>
      )}
    </div>
  );
}

function TourPill({
  ct,
  eventType,
}: {
  ct: CalendarTour;
  eventType: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dotColor = STATUS_COLORS[ct.tour.status];
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight bg-blue-50 hover:bg-blue-100 text-left cursor-pointer"
      >
        <span className={`shrink-0 inline-block h-2 w-2 rounded-full ${dotColor}`} />
        <span className="truncate">{ct.tour.title}</span>
      </button>
      {open && <TourTooltip tour={ct.tour} eventType={eventType} anchorRef={ref} onClose={handleClose} />}
    </div>
  );
}

function detectInitialMonth(tours: CalendarTour[]): number {
  if (tours.length === 0) {return new Date().getMonth();}
  // Find the earliest tour month
  const months = tours.map((ct) => ct.startDate.getMonth());
  return Math.min(...months);
}

export function CalendarView({
  tours,
  eventType,
  totalScraped,
  year,
}: {
  tours: Tour[];
  eventType: string;
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
          days: tour.duration_days,
        })),
    [tours],
  );

  const [month, setMonth] = useState(() => detectInitialMonth(calendarTours));

  useEffect(() => {
    setMonth(detectInitialMonth(calendarTours));
  }, [calendarTours]);

  const cells = getCalendarDays(yearNum, month);
  const tourMap = buildTourMap(calendarTours, yearNum, month);

  function prevMonth() {
    setMonth((m) => (m > 0 ? m - 1 : 11));
  }

  function nextMonth() {
    setMonth((m) => (m < 11 ? m + 1 : 0));
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Results</h2>
        <span className="text-sm text-gray-500">
          {totalScraped} tours found
        </span>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[month]} {yearNum}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          {WEEKDAYS.map((d) => (
            <div
              key={d}
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
                      {toursForDay.map((ct, j) => (
                        <TourPill key={j} ct={ct} eventType={eventType} />
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
