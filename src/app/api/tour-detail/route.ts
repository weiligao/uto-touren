import type { TourDetail } from "@/lib/types";
import * as cheerio from "cheerio";
import { unstable_cache } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const FETCH_TIMEOUT_MS = 10_000;
const CACHE_REVALIDATE_SECONDS = 86_400; // 24 hours
const ALLOWED_HOSTNAME = "sac-uto.ch";

function validateDetailUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.hostname !== ALLOWED_HOSTNAME && !url.hostname.endsWith(`.${ALLOWED_HOSTNAME}`)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

const REGISTRATION_MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, März: 3, Apr: 4, Mai: 5,
  Jun: 6, Jul: 7, Juli: 7, Aug: 8, Sep: 9, Sept: 9,
  Okt: 10, Nov: 11, Dez: 12,
};

/**
 * Parse the registration start date from the "Anmeldung" cell text.
 * Expects a string like "Online von Do 1. Jan. 2026 bis ..."
 * Returns a YYYY-MM-DD string or null.
 */
function parseRegistrationStart(text: string): string | null {
  const match = text.match(
    /von\s+(?:Mo|Di|Mi|Do|Fr|Sa|So)\s+(\d{1,2})\.\s+([A-Za-zÄäÖöÜüß]+)\.?\s+(\d{4})/,
  );
  if (!match) { return null; }
  const day = parseInt(match[1], 10);
  const month = REGISTRATION_MONTHS[match[2]];
  const year = parseInt(match[3], 10);
  if (!month) { return null; }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Extract the text of the table cell that follows the label cell matching `label`
 * in the #droptours-detail table. Converts <br> tags to newlines.
 */
function extractLabelValue($: cheerio.CheerioAPI, label: string): string | null {
  let result: string | null = null;
  $("#droptours-detail td.touren_bold").each((_, el) => {
    if ($(el).text().trim() !== label) { return; }
    const td = $(el).next("td");
    // Replace <br> with newline before extracting text (cheerio .text() ignores <br>).
    const html = (td.html() ?? "").replace(/<br\s*\/?>/gi, "\n");
    const text = cheerio.load(html)("body")
      .text()
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text) { result = text; }
    return false; // stop iterating
  });
  return result;
}

const EMPTY_DETAIL: TourDetail = {
  route_details: null,
  additional_info: null,
  equipment: null,
  travel_route: null,
  accommodation: null,
  costs: null,
  registration_start: null,
};

async function fetchDetailUncached(url: string): Promise<TourDetail> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const resp = await fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "de-CH,de;q=0.9,en;q=0.8",
    },
  }).catch(() => null);
  clearTimeout(timeoutId);

  if (!resp?.ok) { return EMPTY_DETAIL; }

  const html = await resp.text();
  const $ = cheerio.load(html);
  const anmeldungRaw = extractLabelValue($, "Anmeldung");
  return {
    route_details: extractLabelValue($, "Route / Details"),
    additional_info: extractLabelValue($, "Zusatzinfo"),
    equipment: extractLabelValue($, "Ausrüstung"),
    travel_route: extractLabelValue($, "Reiseroute"),
    accommodation: extractLabelValue($, "Unterkunft / Verpflegung"),
    costs: extractLabelValue($, "Kosten"),
    registration_start: anmeldungRaw ? parseRegistrationStart(anmeldungRaw) : null,
  };
}

const cachedFetchDetail = unstable_cache(
  fetchDetailUncached,
  ["tour-detail"],
  { revalidate: CACHE_REVALIDATE_SECONDS },
);

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url") ?? "";
  const url = validateDetailUrl(rawUrl);
  if (!url) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const result = await cachedFetchDetail(url.href).catch(() => EMPTY_DETAIL);

  return NextResponse.json(result);
}
