/** Shared constants for API routes that fetch from sac-uto.ch. */

export const FETCH_TIMEOUT_MS = 10_000;
export const CACHE_REVALIDATE_SECONDS = 86_400; // 24 hours

/** Browser-like headers to send when scraping sac-uto.ch. */
export const SAC_FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-CH,de;q=0.9,en;q=0.8",
} satisfies Record<string, string>;
