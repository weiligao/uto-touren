import type { Tour } from "@/lib/types";
import { FETCH_TIMEOUT_MS, SAC_FETCH_HEADERS } from "../_shared";
import { getTotalCount, parseTourRows } from "./_parser";

const BASE_URL = "https://www.sac-uto.ch/de/aktivitaeten/touren-und-kurse/";
const PAGE_SIZE = 50;
const MAX_OFFSET = 2000;
const DELAY_BETWEEN_PAGES_MS = 1000;
const EMPTY_PAGE_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

export class UpstreamError extends Error {
  constructor(message: string, public readonly httpStatus: number) {
    super(message);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch a single SAC page and return its HTML, or null on network/timeout failure. Throws UpstreamError on non-2xx responses. */
async function fetchPage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: SAC_FETCH_HEADERS,
    }).catch(() => null);
    if (!resp) { return null; }
    if (!resp.ok) {
      if (resp.status === 429) {
        const retryAfter = resp.headers.get("Retry-After");
        const retryAfterSecs = retryAfter ? parseInt(retryAfter, 10) : null;
        const msg = Number.isFinite(retryAfterSecs)
          ? `SAC server is rate-limiting requests. Retry after ${retryAfterSecs}s.`
          : "SAC server is rate-limiting requests. Please try again later.";
        throw new UpstreamError(msg, 429);
      }
      throw new UpstreamError(`Upstream returned ${resp.status}`, 502);
    }
    return await resp.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildUrl(year: string, offset: number): string {
  const searchParams = new URLSearchParams({ page: "touren", selected_jahr: year });
  if (offset > 0) { searchParams.set("offset", String(offset)); }
  return `${BASE_URL}?${searchParams.toString()}`;
}

export interface ScrapeParams {
  year: string;
}

export async function scrapeTours(
  { year }: ScrapeParams,
  onProgress?: (loaded: number, total: number | null) => void,
): Promise<Tour[]> {
  const allTours: Tour[] = [];
  let offset = 0;
  let total: number | null = null;
  let pagesLoaded = 0;
  const yearNum = parseInt(year, 10); // parseTourRows needs an integer; buildUrl needs the original string

  while (true) {
    const html = await fetchPage(buildUrl(year, offset));
    if (!html) { throw new UpstreamError("Upstream request failed", 502); }

    total ??= getTotalCount(html);
    let tours = parseTourRows(html, yearNum);

    // SAC occasionally returns empty pages transiently.
    // Retry empty pages when: total is known and we're short of it, OR total is unknown (fallback if total parsing fails).
    if (tours.length === 0 && (total === null || allTours.length < total)) {
      for (let retry = 1; retry <= EMPTY_PAGE_RETRIES; retry++) {
        // eslint-disable-next-line no-console
        console.log(`Scrape ${year} offset=${offset}: empty page, retry ${retry}/${EMPTY_PAGE_RETRIES}`);
        await sleep(RETRY_DELAY_MS);
        const retryHtml = await fetchPage(buildUrl(year, offset));
        if (retryHtml) {
          total ??= getTotalCount(retryHtml);
          tours = parseTourRows(retryHtml, yearNum);
          if (tours.length > 0) { break; }
        }
      }
    }

    // eslint-disable-next-line no-console
    console.log(`Scrape ${year} offset=${offset}: found ${tours.length} tours, total=${total}, allTours=${allTours.length}`);

    if (tours.length > 0) {
      pagesLoaded++;
      onProgress?.(pagesLoaded, total !== null ? Math.ceil(total / PAGE_SIZE) : null);
      allTours.push(...tours);
    } else {
      // After retries, trust the empty page and stop
      break;
    }

    // If we've reached the total count, stop
    if (total !== null && allTours.length >= total) { break; }

    offset += PAGE_SIZE;
    if (offset > MAX_OFFSET) { break; }

    await sleep(DELAY_BETWEEN_PAGES_MS);
  }

  return allTours;
}
