/** Shared constants for API routes that fetch from sac-uto.ch. */

/** Timeout (ms) for fetch requests to SAC. Prevents hanging on slow/blocked responses. */
export const FETCH_TIMEOUT_MS = 10_000;

/** Cache TTL in seconds for the current/next year. Cron refreshes daily; 7-day TTL keeps Redis warm for resilience if SAC is down. */
export const CACHE_REVALIDATE_SECONDS = 604_800; // 7 days

/**
 * HTTP headers for requests to sac-uto.ch.
 * Identifies as a legitimate automated scraper (utomat).
 *
 * Accept: Prefers HTML, then XHTML, then XML (q=0.9), then any type (q=0.8)
 * Accept-Language: Prefers Swiss German (de-CH), then German (q=0.9), then English (q=0.8)
 */
export const SAC_FETCH_HEADERS = {
  "User-Agent": "uto-touren/1.0 (+https://github.com/weiligao/uto-touren)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-CH,de;q=0.9,en;q=0.8",
} satisfies Record<string, string>;
