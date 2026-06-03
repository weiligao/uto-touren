import { YEARS } from "@/lib/constants";
import { redis } from "@/lib/redis";
import type { Tour, TourStatus } from "@/lib/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { CACHE_REVALIDATE_MS, CACHE_REVALIDATE_SECONDS } from "../_shared";
import { UpstreamError, scrapeTours } from "./_scraper";

export const maxDuration = 60;

const VALID_YEARS = new Set<string>(YEARS);

// In-flight deduplication: if a scrape for the same year is already running,
// return the same promise instead of issuing duplicate upstream requests.
// Memory is bounded to the number of valid years (~15 years), so no cleanup needed.
const inFlight = new Map<string, Promise<Tour[]>>();

// Module-level result cache with a TTL matching CACHE_REVALIDATE_SECONDS.
// Bounded to valid years only, so memory usage is negligible (~15 entries max).
const scrapeResultCache = new Map<string, { tours: Tour[]; ts: number }>();

/** Check if tours are cached in memory and have not exceeded TTL. */
function getCachedTours(year: string): Tour[] | null {
  const entry = scrapeResultCache.get(year);
  if (!entry) { return null; }
  if (Date.now() - entry.ts > CACHE_REVALIDATE_MS) {
    scrapeResultCache.delete(year);
    return null;
  }
  return entry.tours;
}

// Valid tour statuses to prevent inconsistency with Tour type.
const VALID_TOUR_STATUSES = new Set<TourStatus>(["open", "full_or_cancelled", "not_yet_open", "unknown"]);

/** Validate that a string is non-empty. */
function isNonEmptyString(val: unknown): val is string {
  return typeof val === "string" && val.length > 0;
}

/** Type guard to validate Tour shape and ensure data consistency. */
function isTour(obj: unknown): obj is Tour {
  if (!obj || typeof obj !== "object") { return false; }
  const tour = obj as Record<string, unknown>;
  return (
    isNonEmptyString(tour.date) &&
    isNonEmptyString(tour.start_date) &&
    typeof tour.duration_days === "number" &&
    Number.isFinite(tour.duration_days) &&
    tour.duration_days > 0 &&
    isNonEmptyString(tour.tour_type) &&
    isNonEmptyString(tour.difficulty) &&
    Array.isArray(tour.group) &&
    tour.group.length > 0 &&
    tour.group.every((g) => isNonEmptyString(g)) &&
    isNonEmptyString(tour.title) &&
    isNonEmptyString(tour.leader) &&
    (typeof tour.status === "string" && VALID_TOUR_STATUSES.has(tour.status as TourStatus)) &&
    (tour.detail_url === null || isNonEmptyString(tour.detail_url)) &&
    typeof tour.isPast === "boolean"
  );
}

/** Retrieve and validate tour cache from Redis. Returns null if miss, corrupted, or unavailable. */
async function getRedisCache(year: string): Promise<Tour[] | null> {
  if (!redis) { return null; }
  try {
    const data = await redis.get<Tour[]>(year);
    if (!data) { return null; }
    // Validate array structure.
    if (!Array.isArray(data)) {
      // eslint-disable-next-line no-console
      console.warn("Redis data is not a valid array for year:", year);
      return null;
    }
    // Empty arrays are valid (year has 0 tours); skip sampling validation if empty
    if (data.length === 0) {
      return data;
    }
    // Sample validation: check first, last, and one random middle tour to detect corruption.
    // Note: Does not validate entire array (performance tradeoff), so corrupted tours
    // in the middle could theoretically pass through. Full validation could be added if needed.
    const indicesToCheck: number[] = [0];
    if (data.length > 1) {
      indicesToCheck.push(data.length - 1);
    }
    // For arrays with 3+ elements, add a random middle sample to catch corruption
    if (data.length > 2) {
      const randomIndex = 1 + Math.floor(Math.random() * (data.length - 2));
      indicesToCheck.push(randomIndex);
    }
    const samplesToValidate = indicesToCheck.map((i) => data[i]);
    if (!samplesToValidate.every((tour) => isTour(tour))) {
      // eslint-disable-next-line no-console
      console.warn("Redis data validation failed for year:", year);
      return null;
    }
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Redis get failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function setRedisCache(year: string, tours: Tour[]): Promise<void> {
  if (!redis) { return; }
  try {
    await redis.set(year, tours, { ex: CACHE_REVALIDATE_SECONDS });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Redis set failed:", err instanceof Error ? err.message : err);
  }
}

async function persistToCache(year: string, tours: Tour[]): Promise<void> {
  scrapeResultCache.set(year, { tours, ts: Date.now() });
  await setRedisCache(year, tours);
}

/**
 * Resolve tours for a given year, with three-tier caching and in-flight deduplication.
 * Prevents duplicate concurrent scrapes by tracking promises in-flight.
 */
async function resolveTours(year: string): Promise<Tour[]> {
  // Check in-flight deduplication first, before memory cache.
  // This prevents duplicate upstream requests when concurrent calls arrive.
  const existingFlight = inFlight.get(year);
  if (existingFlight) { return existingFlight; }

  const cached = getCachedTours(year);
  if (cached !== null) {
    return cached;
  }

  // Start a new scrape promise and track it to deduplicate concurrent requests.
  let resolveFlight!: (tours: Tour[]) => void;
  let rejectFlight!: (err: unknown) => void;
  const flightPromise = new Promise<Tour[]>((res, rej) => { resolveFlight = res; rejectFlight = rej; });
  inFlight.set(year, flightPromise);

  try {
    const redisTours = await getRedisCache(year);
    if (redisTours !== null) {
      resolveFlight(redisTours);
      return redisTours;
    }

    const tours = await scrapeTours({ year });
    await persistToCache(year, tours);
    resolveFlight(tours);
    return tours;
  } catch (err) {
    rejectFlight(err);
    throw err;
  } finally {
    inFlight.delete(year);
  }
}

/**
 * GET /api/scrape?year=YYYY
 *
 * Returns tours for a given year from cache or SAC.
 *
 * @query year - Year as string (required, must be in VALID_YEARS range)
 *
 * @success 200 - { source: "sac-uto.ch" | "cached (stale)", year, tours: Tour[], stale?: true }
 * @error 400 - Invalid year parameter
 * @error 502 - Failed to fetch from SAC (with stale fallback if available)
 * @error 500 - Internal error (no cache available)
 *
 * Cache strategy:
 * 1. Memory cache (24h TTL)
 * 2. Redis cache (24h TTL)
 * 3. Fresh scrape from SAC
 * 4. Stale cache fallback (if scrape fails)
 */
export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get("year") ?? "";

  if (!VALID_YEARS.has(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const tours = await resolveTours(year);
    const response = NextResponse.json({ source: "sac-uto.ch", year, tours });
    response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return response;
  } catch (err) {
    // Fallback: serve stale cache if scraping fails (e.g., SAC is down)
    const staleTours = await getRedisCache(year);

    if (staleTours !== null) {
      // Serve stale cache (even if empty array) when scraping fails
      // eslint-disable-next-line no-console
      console.warn("Serving stale cache due to scrape failure", { year });
      const response = NextResponse.json({
        source: "cached (stale)",
        year,
        tours: staleTours,
        stale: true,
      });
      response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=86400");
      return response;
    }

    // No cache available; return scrape error (with sanitized message)
    if (err instanceof UpstreamError) {
      // Sanitize error message to prevent information disclosure
      // (SAC URLs, internal error details, etc.)
      const sanitizedMsg = err.httpStatus === 429
        ? "Service temporarily unavailable, please try again later"
        : "Failed to fetch tour data";
      return NextResponse.json({ error: sanitizedMsg }, { status: err.httpStatus });
    }
    // eslint-disable-next-line no-console
    console.error("Scrape failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

