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

export function formatDate(startDate: string | null, fallback: string): string {
  if (!startDate) {return fallback;}
  return DATE_FORMAT.format(new Date(startDate));
}

export function formatDuration(days: number): string {
  return days === 1 ? "1 day" : `${days} days`;
}

export function na(value: string): string {
  return value || "N/A";
}
