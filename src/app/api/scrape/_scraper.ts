import type { Tour } from "@/lib/types";
import { FETCH_TIMEOUT_MS, SAC_FETCH_HEADERS } from "../_shared";
import { getTotalCount, parseTourRows } from "./_parser";

const BASE_URL = "https://sac-uto.ch/de/aktivitaeten/touren-und-kurse/";
const PAGE_SIZE = 50;
const MAX_OFFSET = 2000;
const DELAY_BETWEEN_PAGES_MS = 1000;

export class UpstreamError extends Error {
  constructor(message: string, public readonly httpStatus: number) {
    super(message);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(year: string, offset: number): string {
  const searchParams = new URLSearchParams({ page: "touren", year });
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
  const yearNum = parseInt(year, 10);

  while (true) {
    const url = buildUrl(year, offset);
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
    if (tours.length === 0) { break; }

    pagesLoaded++;
    onProgress?.(pagesLoaded, total !== null ? Math.ceil(total / PAGE_SIZE) : null);

    allTours.push(...tours);

    if (total !== null && allTours.length >= total) { break; }
    offset += PAGE_SIZE;
    if (offset > MAX_OFFSET) { break; }

    await sleep(DELAY_BETWEEN_PAGES_MS);
  }

  return allTours;
}
