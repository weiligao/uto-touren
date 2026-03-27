import { Tour, TourStatus } from "@/lib/types";
import { JSDOM } from "jsdom";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://sac-uto.ch/de/aktivitaeten/touren-und-kurse/";
const PAGE_SIZE = 50;
const MAX_OFFSET = 2000;
const DELAY_BETWEEN_PAGES_MS = 1000;

// Cell indices in the scraped HTML table
const CELL = {
  DATE: 0,
  TOUR_TYPE: 1,
  DIFFICULTY: 3,
  DURATION: 4,
  GROUP: 5,
  TITLE: 7,
  LEADER: 10,
  MIN_COUNT: 11,
} as const;

function buildUrl(params: Record<string, string>): string {
  const searchParams = new URLSearchParams({
    page: "touren",
    year: params.year || "2026",
    typ: params.typ || "",
    anlasstyp: params.anlasstyp || "",
  });
  if (params.offset && parseInt(params.offset) > 0) {
    searchParams.set("offset", params.offset);
  }
  return `${BASE_URL}?${searchParams.toString()}`;
}

function parseStatus(className: string): TourStatus {
  if (className.includes("status_2") || className.includes("status_3")) {
    return "full_or_cancelled";
  }
  if (className.includes("without_register")) {
    return "not_yet_open";
  }
  if (className.includes("status_0") || className.includes("status_1")) {
    return "open";
  }
  return "unknown";
}

function parseDetailUrl(cell: Element): string | null {
  const link = cell.querySelector("a");
  const href = link?.getAttribute("href");
  if (!href) return null;
  return href.startsWith("http") ? href : `https://sac-uto.ch${href}`;
}

function parseTourRows(html: string): Tour[] {
  const doc = new JSDOM(html).window.document;
  const tours: Tour[] = [];

  for (const table of doc.querySelectorAll("table")) {
    for (const row of table.querySelectorAll("tr")) {
      const cells = row.querySelectorAll("td");
      if (cells.length < CELL.MIN_COUNT) continue;

      const text = Array.from(cells).map((c) => c.textContent?.trim() || "");

      tours.push({
        date: text[CELL.DATE],
        tour_type: text[CELL.TOUR_TYPE],
        difficulty: text[CELL.DIFFICULTY],
        duration: text[CELL.DURATION],
        group: text[CELL.GROUP],
        title: text[CELL.TITLE],
        leader: text[CELL.LEADER],
        status: parseStatus(cells[0].className || ""),
        detail_url: parseDetailUrl(cells[CELL.TITLE]),
      });
    }
  }

  return tours;
}

function getTotalCount(html: string): number | null {
  const match = html.match(/(\d+)-(\d+)\s*\/\s*(\d+)/);
  return match ? parseInt(match[3], 10) : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string> = {
    year: sp.get("year") || "2026",
    typ: sp.get("typ") || "",
    anlasstyp: sp.get("anlasstyp") || "",
  };

  const allTours: Tour[] = [];
  let offset = 0;
  let total: number | null = null;

  while (true) {
    const url = buildUrl({ ...params, offset: String(offset) });
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-CH,de;q=0.9,en;q=0.8",
      },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${resp.status}` },
        { status: 502 }
      );
    }

    const html = await resp.text();
    total ??= getTotalCount(html);

    const tours = parseTourRows(html);
    if (tours.length === 0) break;

    allTours.push(...tours);

    if (total && allTours.length >= total) break;
    offset += PAGE_SIZE;
    if (offset > MAX_OFFSET) break;

    await sleep(DELAY_BETWEEN_PAGES_MS);
  }

  return NextResponse.json({
    source: "sac-uto.ch",
    year: params.year,
    type_filter: params.typ || "all",
    event_type: params.anlasstyp || "all",
    total_scraped: allTours.length,
    tours: allTours,
  });
}
