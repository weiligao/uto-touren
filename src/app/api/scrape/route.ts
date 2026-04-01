import { EVENT_TYPES, GROUPS, TOUR_TYPES, YEARS } from "@/lib/constants";
import { redis } from "@/lib/redis";
import type { Tour } from "@/lib/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { CACHE_REVALIDATE_SECONDS } from "../_shared";
import type { ScrapeParams } from "./_scraper";
import { UpstreamError, scrapeTours } from "./_scraper";

export const maxDuration = 60;

const VALID_YEARS = new Set<string>(YEARS);
const VALID_TYPES = new Set<string>(TOUR_TYPES.map((t) => t.value));
const VALID_EVENT_TYPES = new Set<string>(EVENT_TYPES.map((t) => t.value));
const VALID_GROUPS = new Set<string>(GROUPS.map((g) => g.value));

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

async function getRedisCache(key: string): Promise<Tour[] | null> {
  if (!redis) { return null; }
  try {
    return await redis.get<Tour[]>(key) ?? null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Redis get failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function setRedisCache(key: string, tours: Tour[]): Promise<void> {
  if (!redis) { return; }
  try {
    await redis.set(key, tours, { ex: CACHE_REVALIDATE_SECONDS });
  } catch (err) {
    // Redis write failure is non-fatal — in-process cache still works.
    // eslint-disable-next-line no-console
    console.warn("Redis set failed:", err instanceof Error ? err.message : err);
  }
}

async function persistToCache(key: string, tours: Tour[]): Promise<void> {
  scrapeResultCache.set(key, { tours, ts: Date.now() });
  await setRedisCache(key, tours);
}

function toCacheKey({ year, typ, anlasstyp, gruppe }: ScrapeParams): string {
  return `${year}:${typ}:${anlasstyp}:${gruppe}`;
}

function makeScrapePayload({ year, typ, anlasstyp }: ScrapeParams, tours: Tour[]) {
  return {
    source: "sac-uto.ch",
    year,
    type_filter: typ,
    event_type: anlasstyp,
    total_scraped: tours.length,
    tours,
  };
}

async function resolveWithStream(
  params: ScrapeParams,
  send: (payload: object) => void,
): Promise<void> {
  const key = toCacheKey(params);

  // 1. In-memory cache (warm instance, zero latency).
  const cached = getCachedTours(key);
  if (cached !== null) {
    send({ type: "done", ...makeScrapePayload(params, cached) });
    return;
  }

  // 2. Join an already-running scrape (synchronous — must come before any
  //    await to close the race window with step 3).
  const existingFlight = inFlight.get(key);
  if (existingFlight) {
    send({ type: "done", ...makeScrapePayload(params, await existingFlight) });
    return;
  }

  // 3. Register as leader immediately so concurrent requests arriving during
  //    the async Redis check or live scrape below join this flight.
  let resolveFlight!: (tours: Tour[]) => void;
  let rejectFlight!: (err: unknown) => void;
  const flightPromise = new Promise<Tour[]>((res, rej) => { resolveFlight = res; rejectFlight = rej; });
  inFlight.set(key, flightPromise);

  try {
    // 4. Redis cache (survives cold starts).
    const redisTours = await getRedisCache(key);
    if (redisTours !== null) {
      scrapeResultCache.set(key, { tours: redisTours, ts: Date.now() });
      resolveFlight(redisTours);
      send({ type: "done", ...makeScrapePayload(params, redisTours) });
      return;
    }

    // 5. Live scrape — progress events sent as pages arrive.
    const tours = await scrapeTours(params,
      (loaded, total) => send({ type: "progress", loaded, total }),
    );
    await persistToCache(key, tours);
    resolveFlight(tours);
    send({ type: "done", ...makeScrapePayload(params, tours) });
  } catch (err) {
    rejectFlight(err);
    throw err;
  } finally {
    inFlight.delete(key);
  }
}

function handleStreamResponse(params: ScrapeParams): Response {
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
        await resolveWithStream(params, send);
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

async function handleNonStreamResponse(params: ScrapeParams): Promise<NextResponse> {
  const key = toCacheKey(params);

  const cached = getCachedTours(key);
  if (cached !== null) {
    return NextResponse.json(makeScrapePayload(params, cached));
  }

  const redisCached = await getRedisCache(key);
  if (redisCached !== null) {
    scrapeResultCache.set(key, { tours: redisCached, ts: Date.now() });
    return NextResponse.json(makeScrapePayload(params, redisCached));
  }

  const tours = await scrapeTours(params);
  await persistToCache(key, tours);
  const response = NextResponse.json(makeScrapePayload(params, tours));
  response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  return response;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: ScrapeParams = {
    year: sp.get("year") ?? "",
    typ: sp.get("typ") ?? "",
    anlasstyp: sp.get("anlasstyp") ?? "",
    gruppe: sp.get("gruppe") ?? "",
  };

  if (!VALID_YEARS.has(params.year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  if (params.typ && !VALID_TYPES.has(params.typ)) {
    return NextResponse.json({ error: "Invalid tour type" }, { status: 400 });
  }
  if (params.anlasstyp && !VALID_EVENT_TYPES.has(params.anlasstyp)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }
  if (params.gruppe && !VALID_GROUPS.has(params.gruppe)) {
    return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  }

  if (sp.get("stream") === "1") {
    return handleStreamResponse(params);
  }

  try {
    return await handleNonStreamResponse(params);
  } catch (err) {
    if (err instanceof UpstreamError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    // eslint-disable-next-line no-console
    console.error("Scrape failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
