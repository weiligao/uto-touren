import { resolveTours } from "@/app/tours";
import { YEARS } from "@/lib/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { UpstreamError } from "./_scraper";

export const maxDuration = 60;

const VALID_YEARS = new Set<string>(YEARS);

/**
 * GET /api/scrape?year=YYYY
 *
 * Returns tours for a given year from cache or SAC.
 *
 * @query year - Year as string (required, must be in VALID_YEARS range)
 *
 * @success 200 - { year, tours: Tour[] }
 * @error 400 - Invalid year parameter
 * @error 429 - SAC rate-limited us
 * @error 502 - Failed to fetch from SAC (any other upstream error)
 * @error 500 - Internal error
 */
export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get("year") ?? "";

  if (!VALID_YEARS.has(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const tours = await resolveTours(year);
    const response = NextResponse.json({ year, tours });
    response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return response;
  } catch (err) {
    if (err instanceof UpstreamError) {
      // Sanitize error message to prevent information disclosure
      // (SAC URLs, internal error details, etc.).
      // Map all non-429 upstream errors to 502 Bad Gateway so clients can
      // distinguish "upstream down" from "our server failed" (500).
      if (err.httpStatus === 429) {
        return NextResponse.json(
          { error: "Service temporarily unavailable, please try again later" },
          { status: 429 },
        );
      }
      return NextResponse.json({ error: "Failed to fetch tour data" }, { status: 502 });
    }
    // eslint-disable-next-line no-console
    console.error("Scrape failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

