import { YEARS } from "@/lib/constants";
import { redis } from "@/lib/redis";
import type { Tour } from "@/lib/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { CACHE_REVALIDATE_SECONDS } from "../_shared";
import { UpstreamError, scrapeTours } from "./_scraper";

export const maxDuration = 60;

const VALID_YEARS = new Set<string>(YEARS);

// In-flight deduplication: if a scrape for the same year is already running,
// return the same promise instead of issuing duplicate upstream requests.
const inFlight = new Map<string, Promise<Tour[]>>();

// Module-level result cache with a TTL matching CACHE_REVALIDATE_SECONDS.
const scrapeResultCache = new Map<string, { tours: Tour[]; ts: number }>();

function getCachedTours(year: string): Tour[] | null {
  const entry = scrapeResultCache.get(year);
  if (!entry) { return null; }
  if (Date.now() - entry.ts > CACHE_REVALIDATE_SECONDS * 1000) {
    scrapeResultCache.delete(year);
    return null;
  }
  return entry.tours;
}

async function getRedisCache(year: string): Promise<Tour[] | null> {
  if (!redis) { return null; }
  try {
    return await redis.get<Tour[]>(year) ?? null;
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

async function resolveTours(year: string): Promise<Tour[]> {
  const cached = getCachedTours(year);
  if (cached !== null) { return cached; }

  const existingFlight = inFlight.get(year);
  if (existingFlight) { return existingFlight; }

  let resolveFlight!: (tours: Tour[]) => void;
  let rejectFlight!: (err: unknown) => void;
  const flightPromise = new Promise<Tour[]>((res, rej) => { resolveFlight = res; rejectFlight = rej; });
  inFlight.set(year, flightPromise);

  try {
    const redisTours = await getRedisCache(year);
    if (redisTours !== null) {
      scrapeResultCache.set(year, { tours: redisTours, ts: Date.now() });
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
    if (err instanceof UpstreamError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    // eslint-disable-next-line no-console
    console.error("Scrape failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

