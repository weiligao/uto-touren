import { EVENT_TYPES, GROUPS, TOUR_TYPES, YEARS } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { parseDuration, parseGermanDate } from "@/lib/utils";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { unstable_cache } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const BASE_URL = "https://sac-uto.ch/de/aktivitaeten/touren-und-kurse/";
const PAGE_SIZE = 50;
const MAX_OFFSET = 2000;
const DELAY_BETWEEN_PAGES_MS = 1000;
const FETCH_TIMEOUT_MS = 10_000;

const CACHE_REVALIDATE_SECONDS = 86_400; // 24 hours

const VALID_YEARS = new Set<string>(YEARS);
const VALID_TYPES = new Set<string>(TOUR_TYPES.map((t) => t.value));
const VALID_EVENT_TYPES = new Set<string>(EVENT_TYPES.map((t) => t.value));
const VALID_GROUPS = new Set<string>(GROUPS.map((g) => g.value));

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

function buildUrl(
  year: string,
  typ: string,
  anlasstyp: string,
  gruppe: string,
  offset: number,
): string {
  const searchParams = new URLSearchParams({
    page: "touren",
    year,
    typ,
    anlasstyp,
    gruppe,
  });
  if (offset > 0) {
    searchParams.set("offset", String(offset));
  }
  return `${BASE_URL}?${searchParams.toString()}`;
}

function parseStatus(className: string): TourStatus {
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

function parseDetailUrl($cell: cheerio.Cheerio<Element>): string | null {
  const href = $cell.find("a").attr("href");
  if (!href) {return null;}
  const url = href.startsWith("/") ? `https://sac-uto.ch${href}` : href;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "sac-uto.ch" && !parsed.hostname.endsWith(".sac-uto.ch")) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function parseTourRows(html: string, year: number): Tour[] {
  const $ = cheerio.load(html);
  const tours: Tour[] = [];

  $("table tr").each((_i, row) => {
    const cells = $(row).find("td");
    if (cells.length < CELL.MIN_LENGTH) {return;}

    const text = cells.map((_j, c) => $(c).text().trim()).get();

    const dateStr = text[CELL.DATE];
    const startDate = parseGermanDate(dateStr, year);
    const durationStr = text[CELL.DURATION];

    tours.push({
      date: dateStr,
      start_date: startDate
        ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`
        : null,
      duration_days: parseDuration(durationStr),
      tour_type: text[CELL.TOUR_TYPE],
      difficulty: text[CELL.DIFFICULTY],
      group: text[CELL.GROUP],
      title: text[CELL.TITLE],
      leader: text[CELL.LEADER],
      status: parseStatus(cells.eq(CELL.DATE).attr("class") ?? ""),
      detail_url: parseDetailUrl(cells.eq(CELL.TITLE)),
    });
  });

  return tours;
}

function getTotalCount(html: string): number | null {
  const match = html.match(/\d+-\d+\s*\/\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class UpstreamError extends Error {
  constructor(message: string, public readonly httpStatus: number) {
    super(message);
  }
}

async function scrapeToursUncached(
  year: string,
  typ: string,
  anlasstyp: string,
  gruppe: string,
): Promise<Tour[]> {
  const allTours: Tour[] = [];
  let offset = 0;
  let total: number | null = null;
  const yearNum = parseInt(year, 10);

  while (true) {
    const url = buildUrl(year, typ, anlasstyp, gruppe, offset);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-CH,de;q=0.9,en;q=0.8",
      },
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (!resp) {
      throw new UpstreamError("Upstream request failed", 502);
    }
    if (!resp.ok) {
      if (resp.status === 429) {
        const retryAfter = resp.headers.get("Retry-After");
        const msg = retryAfter
          ? `SAC server is rate-limiting requests. Retry after ${retryAfter}s.`
          : "SAC server is rate-limiting requests. Please try again later.";
        throw new UpstreamError(msg, 429);
      }
      throw new UpstreamError(`Upstream returned ${resp.status}`, 502);
    }

    const html = await resp.text();
    total ??= getTotalCount(html);

    const tours = parseTourRows(html, yearNum);
    if (tours.length === 0) {break;}

    allTours.push(...tours);

    if (total !== null && allTours.length >= total) {break;}
    offset += PAGE_SIZE;
    if (offset > MAX_OFFSET) {break;}

    await sleep(DELAY_BETWEEN_PAGES_MS);
  }

  return allTours;
}

const cachedScrapeToursUncached = unstable_cache(
  scrapeToursUncached,
  ["scrape-tours"],
  { revalidate: CACHE_REVALIDATE_SECONDS },
);

// In-flight deduplication: if a scrape for the same params is already running,
// return the same promise instead of issuing duplicate upstream requests.
const inFlight = new Map<string, Promise<Tour[]>>();

async function scrapeTours(
  year: string,
  typ: string,
  anlasstyp: string,
  gruppe: string,
): Promise<Tour[]> {
  const key = `${year}:${typ}:${anlasstyp}:${gruppe}`;
  const existing = inFlight.get(key);
  if (existing) { return existing; }
  const promise = cachedScrapeToursUncached(year, typ, anlasstyp, gruppe).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawYear = sp.get("year") ?? "";
  const rawTyp = sp.get("typ") ?? "";
  const rawAnlasstyp = sp.get("anlasstyp") ?? "";
  const rawGruppe = sp.get("gruppe") ?? "";

  if (!VALID_YEARS.has(rawYear)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  if (rawTyp && !VALID_TYPES.has(rawTyp)) {
    return NextResponse.json({ error: "Invalid tour type" }, { status: 400 });
  }
  if (rawAnlasstyp && !VALID_EVENT_TYPES.has(rawAnlasstyp)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }
  if (rawGruppe && !VALID_GROUPS.has(rawGruppe)) {
    return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  }

  try {
    const tours = await scrapeTours(rawYear, rawTyp, rawAnlasstyp, rawGruppe);
    const response = NextResponse.json({
      source: "sac-uto.ch",
      year: rawYear,
      type_filter: rawTyp,
      event_type: rawAnlasstyp,
      total_scraped: tours.length,
      tours,
    });
    response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return response;
  } catch (err) {
    if (err instanceof UpstreamError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    // eslint-disable-next-line no-console
    console.error("Scrape failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
