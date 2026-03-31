import { EVENT_TYPES, GROUPS, TOUR_TYPES, YEARS } from "@/lib/constants";
import type { Tour, TourStatus } from "@/lib/types";
import { parseDuration, parseGermanDate } from "@/lib/utils";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { unstable_cache } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { CACHE_REVALIDATE_SECONDS, FETCH_TIMEOUT_MS, SAC_FETCH_HEADERS } from "../_shared";

export const maxDuration = 60;

const BASE_URL = "https://sac-uto.ch/de/aktivitaeten/touren-und-kurse/";
const PAGE_SIZE = 50;
const MAX_OFFSET = 2000;
const DELAY_BETWEEN_PAGES_MS = 1000;

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

/** Format a local Date as YYYY-MM-DD. */
function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

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
    if (parsed.protocol !== "https:") { return null; }
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
      start_date: startDate ? toIsoDate(startDate) : null,
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
  // Matches the SAC pagination indicator "X-Y / N" to extract total count for
  // early loop termination. Falls back gracefully to the empty-page guard if
  // sac-uto.ch ever changes its pagination markup.
  const match = html.match(/\d+(?:&nbsp;|\s)*-(?:&nbsp;|\s)*\d+(?:&nbsp;|\s)*\/(?:&nbsp;|\s)*(\d+)/);
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
  onProgress?: (loaded: number, total: number | null) => void,
): Promise<Tour[]> {
  const allTours: Tour[] = [];
  let offset = 0;
  let total: number | null = null;
  let pagesLoaded = 0;
  const yearNum = parseInt(year, 10);

  while (true) {
    const url = buildUrl(year, typ, anlasstyp, gruppe, offset);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: SAC_FETCH_HEADERS,
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

    pagesLoaded++;
    onProgress?.(pagesLoaded, total !== null ? Math.ceil(total / PAGE_SIZE) : null);

    allTours.push(...tours);

    if (total !== null && allTours.length >= total) {break;}
    offset += PAGE_SIZE;
    if (offset > MAX_OFFSET) {break;}

    await sleep(DELAY_BETWEEN_PAGES_MS);
  }

  return allTours;
}

const cachedFetchTours = unstable_cache(
  scrapeToursUncached,
  ["scrape-tours"],
  { revalidate: CACHE_REVALIDATE_SECONDS },
);

// In-flight deduplication: if a scrape for the same params is already running,
// return the same promise instead of issuing duplicate upstream requests.
const inFlight = new Map<string, Promise<Tour[]>>();

// Module-level result cache with a TTL matching CACHE_REVALIDATE_SECONDS.
// Shared between the streaming and non-streaming paths so that a fresh
// streaming scrape also warms the cache for subsequent requests.
const scrapeResultCache = new Map<string, { tours: Tour[]; ts: number }>();

function getCachedTours(key: string): Tour[] | null {
  const entry = scrapeResultCache.get(key);
  if (!entry) { return null; }
  if (Date.now() - entry.ts > CACHE_REVALIDATE_SECONDS * 1000) {
    scrapeResultCache.delete(key);
    return null;
  }
  return entry.tours;
}

async function scrapeTours(
  year: string,
  typ: string,
  anlasstyp: string,
  gruppe: string,
): Promise<Tour[]> {
  const key = `${year}:${typ}:${anlasstyp}:${gruppe}`;
  const cached = getCachedTours(key);
  if (cached !== null) { return cached; }
  const existing = inFlight.get(key);
  if (existing) { return existing; }
  const promise = cachedFetchTours(year, typ, anlasstyp, gruppe).then((tours) => {
    scrapeResultCache.set(key, { tours, ts: Date.now() });
    return tours;
  }).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}

function makeDonePayload(rawYear: string, rawTyp: string, rawAnlasstyp: string, tours: Tour[]) {
  return {
    type: "done" as const,
    source: "sac-uto.ch",
    year: rawYear,
    type_filter: rawTyp,
    event_type: rawAnlasstyp,
    total_scraped: tours.length,
    tours,
  };
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

  if (sp.get("stream") === "1") {
    const cacheKey = `${rawYear}:${rawTyp}:${rawAnlasstyp}:${rawGruppe}`;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload: object) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch {
            // Client disconnected; stream is already closed.
          }
        };
        try {
          // 1. Serve from in-memory cache if still fresh.
          const cachedTours = getCachedTours(cacheKey);
          if (cachedTours !== null) {
            send(makeDonePayload(rawYear, rawTyp, rawAnlasstyp, cachedTours));
            return;
          }

          // 2. Join an already-running scrape for the same params.
          const existingFlight = inFlight.get(cacheKey);
          if (existingFlight) {
            const tours = await existingFlight;
            send(makeDonePayload(rawYear, rawTyp, rawAnlasstyp, tours));
            return;
          }

          // 3. Fresh scrape with progress reporting.
          const promise = scrapeToursUncached(
            rawYear, rawTyp, rawAnlasstyp, rawGruppe,
            (loaded, total) => send({ type: "progress", loaded, total }),
          ).then((tours) => {
            scrapeResultCache.set(cacheKey, { tours, ts: Date.now() });
            return tours;
          }).finally(() => {
            inFlight.delete(cacheKey);
          });
          inFlight.set(cacheKey, promise);

          const tours = await promise;
          send(makeDonePayload(rawYear, rawTyp, rawAnlasstyp, tours));
        } catch (err) {
          send({
            type: "error",
            error: err instanceof UpstreamError ? err.message : "Internal server error",
          });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        "X-Accel-Buffering": "no",
      },
    });
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
