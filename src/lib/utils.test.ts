import { describe, expect, it } from "vitest";

import type { Tour } from "./types";
import {
  formatDate,
  formatDuration,
  generateIcs,
  na,
  parseDateString,
  parseDuration,
  parseGermanDate,
} from "./utils";

describe("parseDateString", () => {
  it("parses a YYYY-MM-DD string as local date", () => {
    const result = parseDateString("2026-06-12");
    expect(result).toEqual(new Date(2026, 5, 12));
  });

  it("parses month boundary correctly (January)", () => {
    expect(parseDateString("2026-01-01")).toEqual(new Date(2026, 0, 1));
  });

  it("parses month boundary correctly (December)", () => {
    expect(parseDateString("2026-12-31")).toEqual(new Date(2026, 11, 31));
  });
});

describe("parseGermanDate", () => {
  it("parses standard date with weekday prefix", () => {
    const result = parseGermanDate("Fr 12. Jun.", 2026);
    expect(result).toEqual(new Date(2026, 5, 12));
  });

  it("parses date with umlaut month (März)", () => {
    const result = parseGermanDate("Sa 6. März", 2026);
    expect(result).toEqual(new Date(2026, 2, 6));
  });

  it("parses Juli", () => {
    const result = parseGermanDate("Mo 14. Juli", 2026);
    expect(result).toEqual(new Date(2026, 6, 14));
  });

  it("parses Sept", () => {
    const result = parseGermanDate("Di 1. Sept", 2026);
    expect(result).toEqual(new Date(2026, 8, 1));
  });

  it("returns null for unrecognized format", () => {
    expect(parseGermanDate("invalid", 2026)).toBeNull();
  });

  it("returns null for unrecognized month", () => {
    expect(parseGermanDate("Fr 12. Xyz", 2026)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseGermanDate("", 2026)).toBeNull();
  });
});

describe("parseDuration", () => {
  it("parses '2 Tage'", () => {
    expect(parseDuration("2 Tage")).toBe(2);
  });

  it("parses '1 Tag'", () => {
    expect(parseDuration("1 Tag")).toBe(1);
  });

  it("parses '14 Tage'", () => {
    expect(parseDuration("14 Tage")).toBe(14);
  });

  it("defaults to 1 for empty string", () => {
    expect(parseDuration("")).toBe(1);
  });

  it("defaults to 1 for non-numeric string", () => {
    expect(parseDuration("no number")).toBe(1);
  });
});

describe("formatDate", () => {
  it("formats a valid date string", () => {
    const result = formatDate("2026-06-12", "fallback");
    expect(result).toBeTruthy();
    expect(result).not.toBe("fallback");
  });

  it("returns fallback when start_date is null", () => {
    expect(formatDate(null, "Fr 12. Jun.")).toBe("Fr 12. Jun.");
  });

  it("returns fallback when start_date is empty string", () => {
    expect(formatDate("", "Fr 12. Jun.")).toBe("Fr 12. Jun.");
  });
});

describe("formatDuration", () => {
  it("singular", () => {
    expect(formatDuration(1)).toBe("1 Tag");
  });

  it("plural", () => {
    expect(formatDuration(3)).toBe("3 Tage");
  });

  it("zero", () => {
    expect(formatDuration(0)).toBe("0 Tage");
  });
});

describe("na", () => {
  it("returns value when non-empty", () => {
    expect(na("hello")).toBe("hello");
  });

  it("returns - for empty string", () => {
    expect(na("")).toBe("-");
  });
});

describe("generateIcs", () => {
  const baseTour: Tour = {
    date: "Fr 12. Jun.",
    start_date: "2026-06-12",
    duration_days: 3,
    tour_type: "Ht",
    difficulty: "L",
    group: "Alpinist/innen",
    title: "Matterhorn",
    leader: "Max Muster",
    status: "open",
    detail_url: "https://sac-uto.ch/de/touren/123",
  };

  it("includes required ICS structure", () => {
    const ics = generateIcs(baseTour);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("sets full-day DTSTART and exclusive DTEND", () => {
    const ics = generateIcs(baseTour);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260612");
    expect(ics).toContain("DTEND;VALUE=DATE:20260615"); // +3 days, exclusive
  });

  it("includes title as SUMMARY", () => {
    expect(generateIcs(baseTour)).toContain("SUMMARY:Matterhorn");
  });

  it("includes URL when detail_url is set", () => {
    expect(generateIcs(baseTour)).toContain("URL:https://sac-uto.ch/de/touren/123");
  });

  it("omits URL when detail_url is null", () => {
    expect(generateIcs({ ...baseTour, detail_url: null })).not.toContain("URL:");
  });

  it("escapes special characters in title", () => {
    const ics = generateIcs({ ...baseTour, title: "Tour, with; special\\chars" });
    expect(ics).toContain("SUMMARY:Tour\\, with\\; special\\\\chars");
  });
});
