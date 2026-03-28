import type { Tour } from "@/lib/types";

const GERMAN_MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  März: 2,
  Apr: 3,
  Mai: 4,
  Jun: 5,
  Juli: 6,
  Aug: 7,
  Sept: 8,
  Okt: 9,
  Nov: 10,
  Dez: 11,
};

/**
 * Parse a German date string like "Fr 12. Jun." or "Fr 6. März" into a Date object.
 * Requires the year to be provided separately.
 */
export function parseGermanDate(dateStr: string, year: number): Date | null {
  const match = dateStr.match(/(\d+)\.\s*([A-Za-zÄäÖöÜü]+)/);
  if (!match) {return null;}

  const day = parseInt(match[1], 10);
  const month = GERMAN_MONTHS[match[2]];

  if (month === undefined) {return null;}
  return new Date(year, month, day);
}

/**
 * Parse duration string like "2 Tage" or "1 Tag" into number of days.
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

const DATE_FORMAT = new Intl.DateTimeFormat("de-CH", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** Parse a YYYY-MM-DD date string as a local-time Date, avoiding UTC midnight shifting.
 *  Also handles legacy ISO strings from old cache entries (e.g. "2026-06-12T22:00:00.000Z")
 *  by using local-time getters — callers are all client components running in the user's browser.
 */
export function parseDateString(s: string): Date {
  if (s.includes("T")) {
    // Legacy ISO: new Date gives the correct local Date object in the user's timezone.
    const dt = new Date(s);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(startDate: string | null, fallback: string): string {
  if (!startDate) {return fallback;}
  return DATE_FORMAT.format(parseDateString(startDate));
}

export function formatDuration(days: number): string {
  return days === 1 ? "1 day" : `${days} days`;
}

export function na(value: string): string {
  return value || "N/A";
}

function icsDate(dt: Date): string {
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}${mo}${d}`;
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Trigger a browser download of an ICS file for the given tour.
 * Only call this when `tour.start_date` is non-null.
 */
export function downloadIcs(tour: Tour): void {
  const content = generateIcs(tour);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tour.title.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 60)}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate an ICS (iCalendar) string for a tour as a full-day event.
 * Only call this when `tour.start_date` is non-null.
 */
export function generateIcs(tour: Tour): string {
  // start_date is stored as YYYY-MM-DD — parse as local date to avoid UTC shifting.
  const start = parseDateString(tour.start_date!);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + tour.duration_days);
  const uid = `${icsDate(start)}-${tour.title.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 40)}@utomate`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UtoMate//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(tour.title)}`,
  ];

  if (tour.detail_url) {
    lines.push(`URL:${tour.detail_url}`);
  }

  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:PT0S",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(tour.title)}`,
    "END:VALARM",
  );

  lines.push(`UID:${uid}`, "END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}
