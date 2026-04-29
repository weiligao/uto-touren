import { GROUP_DELIMITER } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { parseDuration, parseGermanDate } from "@/lib/utils";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";

const SAC_BASE = "https://sac-uto.ch";

// Cell indices in the scraped HTML table
const CELL = {
  DATE: 0,
  TOUR_TYPE: 1,
  DIFFICULTY: 3,
  DURATION: 4,
  GROUP: 5,
  TITLE: 7,
  LEADER: 10,
  MIN_LENGTH: 11,
} as const;

/** Parse pipe-delimited group string into array of trimmed group names. */
function parseGroups(groupString: string): string[] {
  return groupString
    .split(GROUP_DELIMITER)
    .map((g) => g.trim())
    .filter((g) => !!g);
}

/** Format a local Date as YYYY-MM-DD. */
function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function parseStatus(className: string): TourStatus {
  if (className.includes("status_2") || className.includes("status_3")) {
    return "full_or_cancelled";
  }
  if (className.includes("without_register")) {
    return "not_yet_open";
  }
  if (className.includes("status_0") || className.includes("status_1")) {
    return "open";
  }
  return "unknown";
}

export function parseDetailUrl($cell: cheerio.Cheerio<Element>): string | null {
  const href = $cell.find("a").attr("href");
  if (!href) { return null; }
  const url = href.startsWith("/") ? `${SAC_BASE}${href}` : href;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") { return null; }
    if (parsed.hostname !== "sac-uto.ch" && !parsed.hostname.endsWith(".sac-uto.ch")) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

export function parseTourRows(html: string, year: number): Tour[] {
  const $ = cheerio.load(html);
  const tours: Tour[] = [];

  $("table tr").each((_i, row) => {
    const cells = $(row).find("td");
    if (cells.length < CELL.MIN_LENGTH) { return; }

    const text = cells.map((_j, c) => $(c).text().trim()).get();

    const dateStr = text[CELL.DATE];
    const startDate = parseGermanDate(dateStr, year);
    if (!startDate) { return; } // Skip tours with unparseable dates

    tours.push({
      date: dateStr,
      start_date: toIsoDate(startDate),
      duration_days: parseDuration(text[CELL.DURATION]),
      tour_type: text[CELL.TOUR_TYPE],
      difficulty: text[CELL.DIFFICULTY],
      group: parseGroups(text[CELL.GROUP]),
      title: text[CELL.TITLE],
      leader: text[CELL.LEADER],
      status: parseStatus(cells.eq(CELL.DATE).attr("class") ?? ""),
      detail_url: parseDetailUrl(cells.eq(CELL.TITLE)),
    });
  });

  return tours;
}

/**
 * Extract the total tour count from the SAC pagination indicator "X-Y / N".
 * Returns null if the indicator is absent (falls back to empty-page guard).
 */
export function getTotalCount(html: string): number | null {
  const match = html.match(/\d+(?:&nbsp;|\s)*-(?:&nbsp;|\s)*\d+(?:&nbsp;|\s)*\/(?:&nbsp;|\s)*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
