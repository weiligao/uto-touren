/**
 * Shared tour resolution logic used by both the API route and the page server component.
 * Module-level caches (inFlight, scrapeResultCache) are singletons per server instance,
 * so deduplication and memory caching work across both callers.
 */
import { CACHE_REVALIDATE_SECONDS } from "@/app/api/_shared";
import { scrapeTours } from "@/app/api/scrape/_scraper";
import { redis } from "@/lib/redis";
import type { Tour, TourStatus } from "@/lib/types";

/** Cache TTL in milliseconds. Derived from CACHE_REVALIDATE_SECONDS to avoid repeating the unit conversion at call sites. */
const CACHE_REVALIDATE_MS = CACHE_REVALIDATE_SECONDS * 1000;

/**
 * Determine the Redis cache TTL (in seconds) for a given year.
 *
 * - Current and next year: finite TTL (CACHE_REVALIDATE_SECONDS). These years
 *   change frequently and are refreshed daily by the cron job; the TTL provides
 *   a fallback window if a scrape fails.
 * - Historical years: no TTL (returns undefined → never expires). Past tour data
 *   is immutable, so it is cached permanently.
 *
 * An unparseable year falls back to the finite TTL so a malformed entry cannot
 * live in the cache forever.
 *
 * @param year - The year as a string (e.g. "2026").
 * @param currentYear - The current calendar year, passed in to avoid repeated
 *   Date construction when called in a loop.
 * @returns TTL in seconds, or undefined for no expiration.
 */
function getCacheTTLForYear(year: string, currentYear: number): number | undefined {
  const yearNum = Number.parseInt(year, 10);
  if (!Number.isInteger(yearNum)) {
    return CACHE_REVALIDATE_SECONDS;
  }
  const isCurrentOrNext = yearNum === currentYear || yearNum === currentYear + 1;
  return isCurrentOrNext ? CACHE_REVALIDATE_SECONDS : undefined;
}

// In-flight deduplication: if a scrape for the same year is already running,
// return the same promise instead of issuing duplicate upstream requests.
// Memory is bounded to the number of valid years (~15 years), so no cleanup needed.
const inFlight = new Map<string, Promise<Tour[]>>();

// Module-level short-circuit cache: avoids Redis round-trips within a single instance lifetime.
// On serverless (Vercel), instances are recycled after inactivity, so entries rarely survive long.
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
    typeof tour.tour_type === "string" &&
    typeof tour.difficulty === "string" &&
    Array.isArray(tour.group) &&
    tour.group.every((g) => isNonEmptyString(g)) &&
    isNonEmptyString(tour.title) &&
    typeof tour.leader === "string" &&
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
    if (!Array.isArray(data)) {
      // eslint-disable-next-line no-console
      console.warn("Redis data is not a valid array for year:", year);
      return null;
    }
    if (data.length === 0) { return data; }
    // Sample validation: check first, last, and one random middle tour to detect corruption.
    const indicesToCheck: number[] = [0];
    if (data.length > 1) { indicesToCheck.push(data.length - 1); }
    if (data.length > 2) {
      indicesToCheck.push(1 + Math.floor(Math.random() * (data.length - 2)));
    }
    if (!indicesToCheck.map((i) => data[i]).every((tour) => isTour(tour))) {
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

/**
 * Write tours to Redis with a year-appropriate TTL (see getCacheTTLForYear):
 * current/next year expire after CACHE_REVALIDATE_SECONDS, historical years
 * are stored without expiration. No-op when Redis is not configured.
 * Errors are swallowed (logged) since a failed cache write is not fatal.
 */
export async function writeToursToRedis(year: string, tours: Tour[]): Promise<void> {
  if (!redis) { return; }
  try {
    const ttl = getCacheTTLForYear(year, new Date().getFullYear());
    const options = ttl ? { ex: ttl } : {};
    await redis.set(year, tours, options);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Redis set failed:", err instanceof Error ? err.message : err);
  }
}

function persistToCache(year: string, tours: Tour[]): void {
  scrapeResultCache.set(year, { tours, ts: Date.now() });
  void writeToursToRedis(year, tours);
}

/**
 * Resolve tours for a given year, with three-tier caching and in-flight deduplication.
 * Prevents duplicate concurrent scrapes by tracking promises in-flight.
 *
 * Cache strategy:
 * 1. Memory cache (instance lifetime, short-circuits Redis round-trip)
 * 2. Redis cache (current/next year: 7-day TTL for fallback if a scrape fails;
 *    historical years: no TTL since past tour data is immutable)
 * 3. Fresh scrape from SAC
 */
export async function resolveTours(year: string): Promise<Tour[]> {
  const existingFlight = inFlight.get(year);
  if (existingFlight) { return existingFlight; }

  const cached = getCachedTours(year);
  if (cached !== null) { return cached; }

  let resolveFlight!: (tours: Tour[]) => void;
  let rejectFlight!: (err: unknown) => void;
  const flightPromise = new Promise<Tour[]>((res, rej) => { resolveFlight = res; rejectFlight = rej; });
  // Suppress unhandled rejection when no concurrent waiters are attached to flightPromise.
  flightPromise.catch(() => {});
  inFlight.set(year, flightPromise);

  try {
    const redisTours = await getRedisCache(year);
    if (redisTours !== null) {
      // Populate memory cache so subsequent requests on this instance skip Redis.
      scrapeResultCache.set(year, { tours: redisTours, ts: Date.now() });
      resolveFlight(redisTours);
      return redisTours;
    }

    const tours = await scrapeTours({ year });
    persistToCache(year, tours);
    resolveFlight(tours);
    return tours;
  } catch (err) {
    rejectFlight(err);
    throw err;
  } finally {
    inFlight.delete(year);
  }
}
