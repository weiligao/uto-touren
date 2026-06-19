"use client";

import { EVENT_TYPE_KURS, EVENT_TYPE_TOUR, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { Tour } from "@/lib/types";
import { formatDuration, formatGroups, isKurs, parseDateString, unknownIfEmpty } from "@/lib/utils";
import type { EventClickArg } from "@fullcalendar/core";
import deLocale from "@fullcalendar/core/locales/de";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import "./calendar-theme.css";
import { CalendarExportButtons } from "./IcsButton";
import { ResultsHeader } from "./ResultsHeader";
import { TourTitle } from "./TourTitle";
import type { SelectedFilters } from "./useFilterState";
import { useFilterState } from "./useFilterState";

// UI Constants
const TOOLTIP_WIDTH = 256; // w-64
const TOOLTIP_APPROX_HEIGHT = 420;
const VIEWPORT_MARGIN = 8;
const MOBILE_BREAKPOINT = 640;

// Swipe gesture constants
const SWIPE_THRESHOLD_PX = 50;
const POSITION_UPDATE_DELAY_MS = 0;

/** Format a Date to YYYY-MM-DD string in local timezone (no ISO conversion) */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface CalendarTour {
  tour: Tour & { start_date: string };
  startDate: Date;
  days: number;
}

function TourTooltip({ tour, anchorRef, onClose }: { tour: Tour; anchorRef: React.RefObject<HTMLElement | null>; onClose: () => void }) {
  const titleId = useId();
  const [dialogStyle, setDialogStyle] = useState<{
    top: number;
    left?: number;
    right?: number;
    width?: number;
    transform?: string;
  } | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keep position current as the user scrolls or resizes the viewport.
  // Throttled to one update per animation frame to avoid forcing layout
  // on every scroll event (which triggers getBoundingClientRect + setState).
  // Position tooltip and manage focus/click-outside in one consolidated effect
  useEffect(() => {
    function updatePosition() {
      if (!anchorRef.current) { return; }
      const rect = anchorRef.current.getBoundingClientRect();
      const above = rect.top - TOOLTIP_APPROX_HEIGHT > VIEWPORT_MARGIN;
      const top = above ? rect.top - 8 : rect.bottom + 8;
      if (window.innerWidth < MOBILE_BREAKPOINT) {
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

    // Position update: RAF-throttled on scroll/resize
    let rafId: number | null = null;
    function onScrollOrResize() {
      if (rafId !== null) { return; }
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updatePosition();
      });
    }

    // Outside-click handler: close when clicking outside both anchor and dialog
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      // Get the composed path for better delegation, fallback to target
      const eventPath = (e as Event & { composedPath(): EventTarget[] }).composedPath?.();
      const path = eventPath ?? [e.target as EventTarget];
      const insideAnchor = path.some((el: EventTarget) => el === anchorRef.current);
      const insideDialog = path.some((el: EventTarget) => el === dialogRef.current);
      if (!insideAnchor && !insideDialog) {
        onClose();
      }
    };

    // Save initial focus to restore later
    const initialFocus = document.activeElement as HTMLElement;

    // Focus close button on open
    closeButtonRef.current?.focus();

    // Set initial position
    updatePosition();
    const timeoutId = setTimeout(updatePosition, POSITION_UPDATE_DELAY_MS);

    // Attach listeners
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (rafId !== null) { cancelAnimationFrame(rafId); }
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      // Restore focus to the opening button when dialog closes
      if (initialFocus && initialFocus !== document.body) {
        initialFocus.focus();
      }
    };
  }, [anchorRef, onClose]);

  if (!dialogStyle) { return null; }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby="tour-details"
      onKeyDown={(e) => {
        if (e.key === "Escape") { onClose(); return; }
        if (e.key === "Tab" && dialogRef.current) {
          const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
          ));
          if (focusable.length === 0) { return; }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
          }
        }
      }}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg p-3 shadow-lg"
      style={dialogStyle}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p id={titleId} className="font-semibold text-sm text-gray-900">
          <TourTitle title={tour.title} url={tour.detail_url} />
        </p>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="shrink-0 p-0.5 rounded text-gray-500 hover:text-gray-700 cursor-pointer"
          aria-label="Schließen"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <dl id="tour-details" className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <dt className="font-medium text-gray-500">Status</dt>
          <dd className="flex items-center gap-1.5 text-gray-800">
            <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[tour.status] ?? STATUS_COLORS.unknown}`} />
            {STATUS_LABELS[tour.status] ?? STATUS_LABELS.unknown}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Typ</dt>
          <dd className="text-gray-800">{unknownIfEmpty(tour.tour_type)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Anlass</dt>
          <dd className="text-gray-800">{isKurs(tour.difficulty) ? EVENT_TYPE_KURS : EVENT_TYPE_TOUR}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Dauer</dt>
          <dd className="text-gray-800">{formatDuration(tour.duration_days)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Schwierigkeit</dt>
          <dd className="text-gray-800">{unknownIfEmpty(tour.difficulty)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Gruppe</dt>
          <dd className="text-gray-800">{formatGroups(tour.group)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Leiter/in</dt>
          <dd className="text-gray-800">{unknownIfEmpty(tour.leader)}</dd>
        </div>
      </dl>
      <CalendarExportButtons tour={tour} onAfterDownload={onClose} fullWidth />
    </div>
  );
}





export function CalendarView({
  tours,
  year,
  selectedFilters,
}: {
  tours: Tour[];
  year: string;
  selectedFilters: SelectedFilters;
}) {
  const yearNum = parseInt(year, 10);
  const calendarRef = useRef<FullCalendar>(null);

  // Handle swipe gestures and keyboard navigation for month navigation
  useEffect(() => {
    const container = calendarContainerRef.current;
    if (!container) {
      return;
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) {
        return;
      }
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!e.changedTouches[0]) {
        return;
      }
      // Defensive check: touchStartRef may not be initialized if touchStart didn't fire
      const { x: startX = 0, y: startY = 0 } = touchStartRef.current || {};
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Only register swipe if horizontal movement is significantly greater than vertical
      // and swipe distance exceeds threshold
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
        e.preventDefault();
        if (deltaX > 0) {
          // Swiped right: go to previous month
          calendarRef.current?.getApi()?.prev();
        } else {
          // Swiped left: go to next month
          calendarRef.current?.getApi()?.next();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow keyboard navigation (arrow keys) for better a11y
      if (e.key === "ArrowLeft") {
        calendarRef.current?.getApi()?.prev();
      } else if (e.key === "ArrowRight") {
        calendarRef.current?.getApi()?.next();
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  const toursList = useMemo(() => calendarTours.map((ct) => ct.tour), [calendarTours]);
  const {
    years,
    selectedYears,
    setSelectedYears,
    tourTypes,
    selectedTourTypes,
    setSelectedTourTypes,
    statuses,
    selectedStatuses,
    setSelectedStatuses,
    selectedWeekdays,
    setSelectedWeekdays,
    durations,
    selectedDurations,
    setSelectedDurations,
    difficulties,
    selectedDifficulties,
    setSelectedDifficulties,
    eventTypes,
    selectedEventTypes,
    setSelectedEventTypes,
    groups,
    selectedGroups,
    setSelectedGroups,
    leaders,
    selectedLeaders,
    setSelectedLeaders,
    titles,
    matchesTour,
  } = useFilterState(toursList, selectedFilters);

  const visibleCalendarTours = useMemo(
    () => calendarTours.filter((ct) => matchesTour(ct.tour)),
    [calendarTours, matchesTour],
  );

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const eventAnchorRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Calculate min/max month boundaries from visible tours (using timestamps for efficiency)
  const { minDate, maxDate } = useMemo(() => {
    if (visibleCalendarTours.length === 0) {
      return { minDate: null, maxDate: null };
    }
    let minTime = visibleCalendarTours[0].startDate.getTime();
    let maxTime = visibleCalendarTours[0].startDate.getTime();
    for (const ct of visibleCalendarTours) {
      const startTime = ct.startDate.getTime();
      if (startTime < minTime) {
        minTime = startTime;
      }
      const endDate = new Date(ct.startDate);
      endDate.setDate(endDate.getDate() + ct.days - 1);
      const endTime = endDate.getTime();
      if (endTime > maxTime) {
        maxTime = endTime;
      }
    }
    return { minDate: new Date(minTime), maxDate: new Date(maxTime) };
  }, [visibleCalendarTours]);
  const events = useMemo(
    () =>
      visibleCalendarTours.map((ct, index) => {
        const endDate = new Date(ct.startDate);
        endDate.setDate(endDate.getDate() + Math.max(0, ct.days - 1));

        const exclusiveEnd = new Date(endDate);
        exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);

        return {
          // Use detail_url for unique ID, fallback to combination with index for safety
          id: ct.tour.detail_url ?? `tour-${ct.tour.start_date}-${index}`,
          title: ct.tour.title,
          start: formatLocalDate(ct.startDate),
          end: formatLocalDate(exclusiveEnd),
          extendedProps: {
            tour: ct.tour,
            days: ct.days,
          },
        };
      }),
    [visibleCalendarTours],
  );

  // Detect initial month to show first upcoming tour
  const initialDate = useMemo(() => {
    if (visibleCalendarTours.length === 0) {
      return new Date(yearNum, 0, 1);
    }
    const firstTour = visibleCalendarTours[0];
    return firstTour.startDate;
  }, [visibleCalendarTours, yearNum]);

  const handleEventClick = useCallback((info: EventClickArg) => {
    eventAnchorRef.current = info.el;
    setSelectedEventId(info.event.id);
  }, []);

  // Memoize eventContent to avoid recreating on every render
  const renderEventContent = useCallback(
    ({ event }: { event: typeof events[0] }) => {
      const tour = event.extendedProps?.tour as Tour | undefined;
      if (!tour) {
        return null;
      }

      const dotColor = STATUS_COLORS[tour.status] ?? STATUS_COLORS.unknown;

      return (
        <button
          type="button"
          className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight text-gray-700 bg-blue-50 hover:bg-blue-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400"
          onClick={(e) => { e.stopPropagation(); eventAnchorRef.current = e.currentTarget as HTMLElement; setSelectedEventId(event.id); }}
          aria-label={`Tour öffnen: ${tour.title}`}
        >
          <span aria-hidden="true" className={`shrink-0 inline-block h-2 w-2 rounded-full ${dotColor}`} />
          <span className="truncate font-medium">{tour.title}</span>
        </button>
      );
    },
    [setSelectedEventId],
  );

  // Create event map for O(1) lookup instead of O(n) search
  const eventMap = useMemo(
    () => new Map(events.map((e) => [e.id, e])),
    [events],
  );

  const selectedTour = useMemo(() => {
    if (!selectedEventId) { return null; }
    const event = eventMap.get(selectedEventId);
    if (!event) { return null; }
    return event.extendedProps.tour as Tour;
  }, [selectedEventId, eventMap]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <ResultsHeader
        totalScraped={calendarTours.length}
        visibleCount={visibleCalendarTours.length}
        years={years}
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        tourTypes={tourTypes}
        selectedTourTypes={selectedTourTypes}
        onTourTypesChange={setSelectedTourTypes}
        statuses={statuses}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        selectedWeekdays={selectedWeekdays}
        onWeekdaysChange={setSelectedWeekdays}
        durations={durations}
        selectedDurations={selectedDurations}
        onDurationsChange={setSelectedDurations}
        difficulties={difficulties}
        selectedDifficulties={selectedDifficulties}
        onDifficultiesChange={setSelectedDifficulties}
        eventTypes={eventTypes}
        selectedEventTypes={selectedEventTypes}
        onEventTypesChange={setSelectedEventTypes}
        groups={groups}
        selectedGroups={selectedGroups}
        onGroupsChange={setSelectedGroups}
        leaders={leaders}
        selectedLeaders={selectedLeaders}
        onLeadersChange={setSelectedLeaders}
        titles={titles}
        selectedTitles={selectedFilters.selectedTitles}
        onTitlesChange={selectedFilters.setSelectedTitles}
        showPastTours={selectedFilters.showPastTours}
        onShowPastToursChange={selectedFilters.setShowPastTours}
      />
      <hr className="border-t-2 border-gray-200 m-0" />

      <div ref={calendarContainerRef} className="relative p-4 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded" tabIndex={0} aria-label="Tourkalender, navigierbar mit Pfeil-Tasten oder Wischgeste">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          locale={deLocale}
          eventContent={renderEventContent}
          height="auto"
          contentHeight="auto"
          eventClick={handleEventClick}
          fixedWeekCount={false}
          validRange={{
            start: minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : undefined,
            end: maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0) : undefined,
          }}
          displayEventTime={false}
          displayEventEnd={false}
          eventDisplay="block"
        />
      </div>

      {selectedTour && selectedEventId && (
        <TourTooltip
          tour={selectedTour}
          anchorRef={eventAnchorRef}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </div>
  );
}
