import { DIFFICULTY_ORDER } from "@/lib/constants";
import type { Tour } from "@/lib/types";

const DIFFICULTY_RANK = new Map(DIFFICULTY_ORDER.map((d, i) => [d, i]));

/** Sort comparator for difficulty chip chips: known values in scale order, unknowns alphabetically at the end. */
export function compareDifficulties(a: string, b: string): number {
  const ra = DIFFICULTY_RANK.get(a) ?? Number.MAX_SAFE_INTEGER;
  const rb = DIFFICULTY_RANK.get(b) ?? Number.MAX_SAFE_INTEGER;
  if (ra !== rb) { return ra - rb; }
  return a.localeCompare(b);
}

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

/** Parse a YYYY-MM-DD date string as a local-time Date, avoiding UTC midnight shifting. */
export function parseDateString(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(startDate: string | null, fallback: string): string {
  if (!startDate) {return fallback;}
  return DATE_FORMAT.format(parseDateString(startDate));
}

export function formatDuration(days: number): string {
  return days === 1 ? "1 Tag" : `${days} Tage`;
}

export function na(value: string): string {
  return value || "Unbekannt";
}

function icsDate(dt: Date): string {
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}${mo}${d}`;
}

/** Slugify a tour title for use in UIDs and filenames. */
function tourSlug(title: string, maxLen: number): string {
  return title.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, maxLen);
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Returns the UTC ICS datetime string (YYYYMMDDTHHmmssZ) for midnight
 * Europe/Zurich on the given YYYY-MM-DD date, correctly accounting for DST.
 */
function zurichMidnightUtcIcs(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Probe at noon UTC to determine the Zurich UTC offset on this calendar day.
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const zurichNoonHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Zurich",
      hour: "numeric",
      hour12: false,
    }).format(probe),
  );
  // offset = zurichNoonHour - 12 (e.g. UTC+1 → 13, UTC+2 → 14)
  const offsetHours = zurichNoonHour - 12;
  const midnight = new Date(Date.UTC(y, m - 1, d, -offsetHours, 0, 0));
  const dy = midnight.getUTCFullYear();
  const dm = String(midnight.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(midnight.getUTCDate()).padStart(2, "0");
  const dh = String(midnight.getUTCHours()).padStart(2, "0");
  return `${dy}${dm}${dd}T${dh}0000Z`;
}

/**
 * Fold an ICS content line per RFC 5545 §3.1.
 * Lines longer than 75 octets are split; continuation lines begin with a single space.
 */
function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) {return line;}

  const parts: string[] = [];
  let pos = 0;
  let limit = 75;
  while (pos < bytes.length) {
    let end = Math.min(pos + limit, bytes.length);
    // Step back to avoid splitting a multi-byte UTF-8 sequence (continuation bytes are 10xxxxxx)
    while (end > pos && (bytes[end] & 0xc0) === 0x80) {end--;}
    parts.push(decoder.decode(bytes.subarray(pos, end)));
    pos = end;
    limit = 74; // continuation lines: 1 byte for leading space + 74 content bytes = 75
  }
  return parts.join("\r\n ");
}

/**
 * Trigger a browser download of an ICS file for the given tour.
 * Only call this when `tour.start_date` is non-null.
 */
export function downloadIcs(
  tour: Tour & { start_date: string },
  description?: string,
  registrationDate?: string,
): void {
  const content = generateIcs(tour, description, registrationDate);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tourSlug(tour.title, 60)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate an ICS (iCalendar) string for a tour as a full-day event.
 * Only call this when `tour.start_date` is non-null.
 */
export function generateIcs(
  tour: Tour & { start_date: string },
  description?: string,
  registrationDate?: string,
): string {
  // start_date is stored as YYYY-MM-DD — parse as local date to avoid UTC shifting.
  const start = parseDateString(tour.start_date);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + tour.duration_days);
  const slug = tourSlug(tour.title, 40);
  const uid = `${icsDate(start)}-${slug}@uto-touren`;

  // Compute registration event identifiers upfront so they can be cross-referenced.
  const regStart = registrationDate ? parseDateString(registrationDate) : null;
  const regUid = regStart ? `anmeldung-${icsDate(regStart)}-${slug}@uto-touren` : null;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UtoTouren//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(tour.title)}`,
  ];

  if (description) { lines.push(`DESCRIPTION:${escapeIcs(description)}`); }
  if (tour.detail_url) { lines.push(`URL:${tour.detail_url}`); }
  if (regUid) { lines.push(`RELATED-TO;RELTYPE=CHILD:${regUid}`); }
  lines.push("END:VEVENT");

  if (registrationDate && regStart && regUid) {
    const regEnd = new Date(regStart.getFullYear(), regStart.getMonth(), regStart.getDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${regUid}`,
      `DTSTART;VALUE=DATE:${icsDate(regStart)}`,
      `DTEND;VALUE=DATE:${icsDate(regEnd)}`,
      `SUMMARY:Anmeldung: ${escapeIcs(tour.title)}`,
      `RELATED-TO;RELTYPE=PARENT:${uid}`,
    );
    if (description) { lines.push(`DESCRIPTION:${escapeIcs(description)}`); }
    if (tour.detail_url) { lines.push(`URL:${tour.detail_url}`); }
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Anmeldung öffnet",
      // Absolute UTC trigger: midnight Europe/Zurich on the registration date.
      `TRIGGER;VALUE=DATE-TIME:${zurichMidnightUtcIcs(registrationDate)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
