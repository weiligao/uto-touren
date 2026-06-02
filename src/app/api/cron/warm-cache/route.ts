import { HISTORICAL_YEARS_COUNT, YEARS, getRegularUpdateScrapeTasks } from "@/lib/constants";
import { redis } from "@/lib/redis";
import type { Tour } from "@/lib/types";
import { NextResponse } from "next/server";
import { CACHE_REVALIDATE_SECONDS } from "../../_shared";
import { UpstreamError, scrapeTours } from "../../scrape/_scraper";

export const maxDuration = 300;

const FULL_SCRAPE_COMPLETE_KEY = "full_scrape_complete";
const FULL_SCRAPE_COMPLETE_TIMESTAMP_KEY = "full_scrape_complete_at";
const SCRAPED_YEAR_KEY_PREFIX = "scraped_year:";

// Leave headroom under maxDuration so a long-running year can finish, Redis
// writes complete, and we still return a response before Vercel kills the function.
// Busy recent years can take 40-60s, so reserve at least that much.
const TIME_BUDGET_MS = 240_000;

type ScrapeMode = "full-historical" | "regular-update";

function scrapedYearKey(year: string): string {
  return `${SCRAPED_YEAR_KEY_PREFIX}${year}`;
}

/**
 * Read all per-year backfill markers in a single Redis round-trip.
 * Returns a parallel array to YEARS: each entry is the marker value or null/undefined
 * if that year has not yet been scraped. Returns null if the Redis call fails.
 */
async function readYearMarkers(): Promise<(string | null)[] | null> {
  if (!redis) { return null; }
  try {
    const keys = YEARS.map(scrapedYearKey);
    // mget returns one entry per key; missing keys come back as null.
    return await redis.mget<(string | null)[]>(...keys);
  } catch {
    return null;
  }
}

function countPending(markers: (string | null)[] | null): number {
  if (!markers) { return HISTORICAL_YEARS_COUNT; }
  return markers.filter((m) => !m).length;
}

/**
 * Determines scrape mode and which years to attempt.
 * - Until the historical backfill flag is set: full-historical mode, returning
 *   only years not yet marked done in Redis (resumable across cron runs).
 * - After backfill completes: regular-update mode, returning current and next year.
 */
async function planScrape(): Promise<{ mode: ScrapeMode; tasks: Array<{ year: string }> }> {
  if (!redis) {
    // No Redis: can't track per-year progress, fall back to full scrape every run.
    return { mode: "full-historical", tasks: YEARS.map((year) => ({ year })) };
  }

  let backfillComplete = false;
  try {
    const flag = await redis.get<boolean>(FULL_SCRAPE_COMPLETE_KEY);
    backfillComplete = flag === true;
  } catch {
    // Redis read failed: safer to assume backfill is incomplete.
  }

  if (backfillComplete) {
    return { mode: "regular-update", tasks: getRegularUpdateScrapeTasks() };
  }

  // Backfill in progress: skip years already marked done.
  // If marker read fails, attempt all years; per-year writes are idempotent.
  const markers = await readYearMarkers();
  const pending = markers ? YEARS.filter((_, i) => !markers[i]) : YEARS;
  return { mode: "full-historical", tasks: pending.map((year) => ({ year })) };
}

async function markYearScraped(year: string): Promise<void> {
  if (!redis) { return; }
  try {
    await redis.set(scrapedYearKey(year), new Date().toISOString());
  } catch {
    // eslint-disable-next-line no-console
    console.warn("Failed to mark year scraped", { year });
  }
}

async function markFullScraperComplete(): Promise<void> {
  if (!redis) { return; }
  try {
    const now = new Date().toISOString();
    // Use SET NX to prevent duplicate marks if multiple requests complete simultaneously
    const flagSet = await redis.set(FULL_SCRAPE_COMPLETE_KEY, true, { nx: true });
    if (!flagSet) {
      // Another request already marked it complete
      return;
    }
    try {
      await redis.set(FULL_SCRAPE_COMPLETE_TIMESTAMP_KEY, now);
    } catch {
      // eslint-disable-next-line no-console
      console.warn("Failed to store full scrape timestamp (flag was set)");
    }
    // eslint-disable-next-line no-console
    console.log("Full scrape marked complete at", now);
  } catch {
    // eslint-disable-next-line no-console
    console.warn("Failed to mark full scrape completion flag");
  }
}

/**
 * Check if the full historical scrape has been completed.
 * Returns both the completion status and timestamp.
 */
async function isFullScrapeComplete(): Promise<{ complete: boolean; completedAt?: string }> {
  if (!redis) {
    return { complete: false };
  }

  try {
    const flag = await redis.get<boolean>(FULL_SCRAPE_COMPLETE_KEY);
    if (flag === true) {
      let timestamp: string | undefined;
      try {
        const ts = await redis.get<string>(FULL_SCRAPE_COMPLETE_TIMESTAMP_KEY);
        timestamp = ts ?? undefined;
      } catch {
        // eslint-disable-next-line no-console
        console.warn("Failed to retrieve full scrape timestamp (flag exists but timestamp unavailable)");
      }
      return { complete: true, completedAt: timestamp };
    }
    return { complete: false };
  } catch {
    // eslint-disable-next-line no-console
    console.warn("Failed to check full scrape status (Redis error)");
    return { complete: false };
  }
}

async function cacheTours(year: string, tours: Tour[]): Promise<void> {
  if (!redis) { return; }
  try {
    await redis.set(year, tours, { ex: CACHE_REVALIDATE_SECONDS });
  } catch {
    // eslint-disable-next-line no-console
    console.warn("Failed to cache tours for year", { year });
    // Continue anyway; cache miss is not fatal
  }
}

export async function GET(request: Request) {
  const isDev = process.env.NODE_ENV === "development";
  const secret = process.env.CRON_SECRET;

  // Auth required unless in development mode with no CRON_SECRET configured
  if (!isDev || secret) {
    if (!secret) {
      // eslint-disable-next-line no-console
      console.error("Cron endpoint accessed but CRON_SECRET is not configured");
      return NextResponse.json(
        { error: "CRON_SECRET is not configured" },
        { status: 500 },
      );
    }
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      // Extract client IP: x-forwarded-for contains comma-separated chain, take first (client IP)
      const forwardedFor = request.headers.get("x-forwarded-for");
      const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
      // eslint-disable-next-line no-console
      console.warn("Unauthorized cron access attempt", { ip });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    // eslint-disable-next-line no-console
    console.error("Failed to parse request URL");
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const statusOnly = url.searchParams.get("status") === "check";

  // Status check endpoint: return current state without scraping
  if (statusOnly) {
    const scrapeStatus = await isFullScrapeComplete();
    const pendingYears = scrapeStatus.complete ? 0 : countPending(await readYearMarkers());
    // eslint-disable-next-line no-console
    console.log("Status check requested", {
      fullScrapeComplete: scrapeStatus.complete,
      pendingHistoricalYears: pendingYears,
    });
    return NextResponse.json({
      ok: true,
      fullScrapeComplete: scrapeStatus.complete,
      completedAt: scrapeStatus.completedAt,
      yearsToScrapeIfRun: scrapeStatus.complete ? getRegularUpdateScrapeTasks().length : pendingYears,
      pendingHistoricalYears: pendingYears,
      totalHistoricalYears: HISTORICAL_YEARS_COUNT,
    });
  }

  const startedAt = Date.now();
  const { mode, tasks: plannedTasks } = await planScrape();
  const isFullScrape = mode === "full-historical";

  // eslint-disable-next-line no-console
  console.log("Scrape job started", {
    plannedTasks: plannedTasks.length,
    mode,
    endpoint: "warm-cache",
  });

  const results: Array<{ year: string; count: number; error?: string }> = [];
  const skippedTasks: Array<{ year: string }> = [];

  for (let i = 0; i < plannedTasks.length; i++) {
    const task = plannedTasks[i];
    if (Date.now() - startedAt >= TIME_BUDGET_MS) {
      // Out of time: defer remaining tasks to the next cron run.
      skippedTasks.push(...plannedTasks.slice(i));
      break;
    }
    try {
      const tours = await scrapeTours(task);
      await cacheTours(task.year, tours);
      results.push({ year: task.year, count: tours.length });
      // Only mark per-year completion during backfill; regular updates re-run every cron.
      if (isFullScrape) {
        await markYearScraped(task.year);
      }
    } catch (err: unknown) {
      // Preserve detailed error info for internal logging, sanitize for API response
      let errorMessage = "Scrape failed";
      if (err instanceof UpstreamError || err instanceof Error) {
        errorMessage = err.message;
      }
      // eslint-disable-next-line no-console
      console.error("Scrape failed for task", { task, error: errorMessage });
      results.push({
        year: task.year,
        count: 0,
        error: "Failed", // Generic message in API response, details in logs
      });
    }
  }

  const failedCount = results.filter((r) => r.error).length;
  const allOk = failedCount === 0 && skippedTasks.length === 0;

  // Mark backfill complete only when every historical year has a marker and nothing failed this run.
  if (isFullScrape && failedCount === 0 && skippedTasks.length === 0 && redis) {
    const markers = await readYearMarkers();
    if (markers && countPending(markers) === 0) {
      await markFullScraperComplete();
    }
  }

  // eslint-disable-next-line no-console
  console.log("Cron job completed", {
    ok: allOk,
    mode,
    scrapedTasks: results.length,
    failedTasks: failedCount,
    skippedTasks: skippedTasks.length,
    elapsedMs: Date.now() - startedAt,
  });
  return NextResponse.json(
    {
      ok: allOk,
      mode,
      scrapedTasks: results.length,
      failedTasks: failedCount,
      skippedTasks,
      results,
    },
    { status: 200 },
  );
}
