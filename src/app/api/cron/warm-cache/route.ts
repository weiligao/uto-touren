import { YEARS } from "@/lib/constants";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import { CACHE_REVALIDATE_SECONDS } from "../../_shared";
import { UpstreamError, scrapeTours } from "../../scrape/_scraper";

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results: Array<{ year: string; count: number; error?: string }> = [];

  for (const year of YEARS) {
    try {
      const tours = await scrapeTours({ year });
      if (redis) {
        await redis.set(year, tours, { ex: CACHE_REVALIDATE_SECONDS });
      }
      results.push({ year, count: tours.length });
    } catch (err) {
      results.push({
        year,
        count: 0,
        error: err instanceof UpstreamError ? err.message : "Scrape failed",
      });
    }
  }

  const allOk = results.every((r) => !r.error);
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 207 });
}
