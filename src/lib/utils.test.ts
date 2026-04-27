import { describe, expect, it } from "vitest";

import type { Tour } from "./types";
import {
  buildGoogleCalendarRegistrationUrl,
  buildGoogleCalendarUrl,
  compareDifficulties,
  formatDate,
  formatDuration,
  generateIcs,
  getTourWeekdays,
  isKurs,
  parseDateString,
  parseDuration,
  parseGermanDate,
  parseLeaders,
  unknownIfEmpty
} from "./utils";

describe("isKurs", () => {
  it.each(["KSI", "KSII", "KSIII", "KSIV", "KSV"])("%s is a Kurs difficulty", (d) => {
    expect(isKurs(d)).toBe(true);
  });

  it.each(["KI", "KII", "Ht", "WS", "", "KS", "KSVI"])("%s is not a Kurs difficulty", (d) => {
    expect(isKurs(d)).toBe(false);
  });
});


describe("compareDifficulties", () => {
  it("orders known values by scale", () => {
    const input = ["ZS", "L", "WS", "S"];
    expect([...input].sort(compareDifficulties)).toEqual(["L", "WS", "ZS", "S"]);
  });

  it("puts unknown values after all known ones", () => {
    const result = ["Unbekannt", "L", "T3"].sort(compareDifficulties);
    expect(result[0]).toBe("L");
    expect(result[1]).toBe("T3");
    expect(result[2]).toBe("Unbekannt");
  });

  it("sorts multiple unknowns alphabetically among themselves", () => {
    const result = ["ZZZ", "AAA", "T1"].sort(compareDifficulties);
    expect(result).toEqual(["T1", "AAA", "ZZZ"]);
  });

  it("returns 0 for equal values", () => {
    expect(compareDifficulties("T3", "T3")).toBe(0);
  });

  it("handles empty string as unknown (after known values)", () => {
    const result = ["", "L"].sort(compareDifficulties);
    expect(result[0]).toBe("L");
    expect(result[1]).toBe("");
  });
});

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

describe("getTourWeekdays", () => {
  // 2026-04-01 is a Wednesday (day 3)

  it("1-day tour returns single weekday", () => {
    // 2026-04-01 = Wednesday = 3
    expect(getTourWeekdays("2026-04-01", 1)).toEqual([3]);
  });

  it("2-day tour returns two consecutive weekdays", () => {
    // Wed=3, Thu=4
    expect(getTourWeekdays("2026-04-01", 2)).toEqual([3, 4]);
  });

  it("3-day tour returns three consecutive weekdays", () => {
    // Wed=3, Thu=4, Fri=5
    expect(getTourWeekdays("2026-04-01", 3)).toEqual([3, 4, 5]);
  });

  it("wraps correctly across Sunday into next week", () => {
    // 2026-04-04 = Saturday=6, Sun=0, Mon=1
    expect(getTourWeekdays("2026-04-04", 3)).toEqual([6, 0, 1]);
  });

  it("duration 0 returns empty array", () => {
    expect(getTourWeekdays("2026-04-01", 0)).toEqual([]);
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

describe("unknownIfEmpty", () => {
  it("returns value when non-empty", () => {
    expect(unknownIfEmpty("hello")).toBe("hello");
  });

  it("returns Unbekannt for empty string", () => {
    expect(unknownIfEmpty("")).toBe("Unbekannt");
  });
});

describe("generateIcs", () => {
  const baseTour: Tour = {
    date: "Fr 12. Jun.",
    start_date: "2026-06-12",
    duration_days: 3,
    tour_type: "Ht",
    difficulty: "L",
    group: ["Alpinist/innen"],
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

  it("folds lines longer than 75 octets", () => {
    const longTitle = "A".repeat(80);
    const ics = generateIcs({ ...baseTour, title: longTitle });
    // Each physical line must be at most 75 octets
    const lines = ics.split("\r\n");
    for (const line of lines) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("folded lines are reassembled to original value", () => {
    const longTitle = "B".repeat(200);
    const ics = generateIcs({ ...baseTour, title: longTitle });
    // Unfold: remove CRLF followed by a single space
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain(`SUMMARY:${longTitle}`);
  });

  it("does not fold short lines", () => {
    const ics = generateIcs(baseTour);
    // "BEGIN:VCALENDAR" is 16 bytes — must appear as a single unbroken line
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).not.toMatch(/BEGIN:\r\n/);
  });

  it("includes DESCRIPTION when provided", () => {
    const ics = generateIcs(baseTour, "Route / Details:\nCoole Tour\n\nZusatzinfo:\nMehr Infos");
    expect(ics).toContain("DESCRIPTION:Route / Details:\\nCoole Tour\\n\\nZusatzinfo:\\nMehr Infos");
  });

  it("omits DESCRIPTION when not provided", () => {
    expect(generateIcs(baseTour)).not.toContain("DESCRIPTION:");
  });

  it("DESCRIPTION appears before URL", () => {
    const ics = generateIcs(baseTour, "Details");
    const descPos = ics.indexOf("DESCRIPTION:");
    const urlPos = ics.indexOf("URL:");
    expect(descPos).toBeGreaterThan(-1);
    expect(descPos).toBeLessThan(urlPos);
  });

  describe("registration event", () => {
    const regDate = "2026-03-30";

    it("produces a second VEVENT when registrationDate is provided", () => {
      const ics = generateIcs(baseTour, undefined, regDate);
      const count = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
      expect(count).toBe(2);
    });

    it("registration VEVENT has correct DTSTART and SUMMARY", () => {
      const ics = generateIcs(baseTour, undefined, regDate);
      expect(ics).toContain("DTSTART;VALUE=DATE:20260330");
      expect(ics).toContain("SUMMARY:Anmeldung: Matterhorn");
    });

    it("registration event is linked to tour event via RELATED-TO", () => {
      const ics = generateIcs(baseTour, undefined, regDate);
      expect(ics).toContain("RELATED-TO;RELTYPE=CHILD:");
      expect(ics).toContain("RELATED-TO;RELTYPE=PARENT:");
    });

    it("registration event includes a VALARM", () => {
      const ics = generateIcs(baseTour, undefined, regDate);
      expect(ics).toContain("BEGIN:VALARM");
      expect(ics).toContain("ACTION:DISPLAY");
      expect(ics).toContain("TRIGGER;VALUE=DATE-TIME:");
    });

    it("no second VEVENT when registrationDate is omitted", () => {
      const ics = generateIcs(baseTour);
      const count = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
      expect(count).toBe(1);
    });

    it("registration event shares the same DESCRIPTION as the tour event", () => {
      const desc = "Route / Details:\nCoole Tour";
      const ics = generateIcs(baseTour, desc, regDate);
      // 2× content DESCRIPTION (tour + registration) + 1× VALARM DESCRIPTION = 3
      const descOccurrences = (ics.match(/DESCRIPTION:/g) ?? []).length;
      expect(descOccurrences).toBe(3);
    });
  });
});

describe("buildGoogleCalendarUrl", () => {
  const tour = {
    date: "Fr 12. Jun.",
    start_date: "2026-06-12",
    duration_days: 3,
    tour_type: "Ht",
    difficulty: "L",
    group: ["Alpinist/innen"],
    title: "Matterhorn",
    leader: "Max Muster",
    status: "open" as const,
    detail_url: "https://sac-uto.ch/de/touren/123",
  };

  it("includes action=TEMPLATE, title, and date range", () => {
    const url = buildGoogleCalendarUrl(tour);
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("text=Matterhorn");
    expect(url).toContain("dates=20260612%2F20260615");
  });

  it("puts detail_url before description in details param", () => {
    const url = buildGoogleCalendarUrl(tour, "Beschreibung");
    const params = new URL(url).searchParams.get("details") ?? "";
    expect(params.indexOf("Details:")).toBeLessThan(params.indexOf("Beschreibung"));
  });

  it("includes detail_url even without description", () => {
    const url = buildGoogleCalendarUrl(tour);
    const details = new URL(url).searchParams.get("details") ?? "";
    expect(details).toContain("Details: https://sac-uto.ch/de/touren/123");
  });

  it("omits details param when no detail_url and no description", () => {
    const url = buildGoogleCalendarUrl({ ...tour, detail_url: null });
    expect(url).not.toContain("details=");
  });
});

describe("buildGoogleCalendarRegistrationUrl", () => {
  const tour = {
    date: "Fr 12. Jun.",
    start_date: "2026-06-12",
    duration_days: 3,
    tour_type: "Ht",
    difficulty: "L",
    group: ["Alpinist/innen"],
    title: "Matterhorn",
    leader: "Max Muster",
    status: "open" as const,
    detail_url: "https://sac-uto.ch/de/touren/123",
  };

  it("prefixes title with Anmeldung:", () => {
    const url = buildGoogleCalendarRegistrationUrl(tour, "2026-03-30");
    expect(url).toContain("text=Anmeldung%3A+Matterhorn");
  });

  it("uses registration date as a 1-day event", () => {
    const url = buildGoogleCalendarRegistrationUrl(tour, "2026-03-30");
    expect(url).toContain("dates=20260330%2F20260331");
  });

  it("includes detail_url in details param", () => {
    const url = buildGoogleCalendarRegistrationUrl(tour, "2026-03-30");
    const details = new URL(url).searchParams.get("details") ?? "";
    expect(details).toContain("Details: https://sac-uto.ch/de/touren/123");
  });
});

describe("parseLeaders", () => {
  it("parses single leader", () => {
    expect(parseLeaders("Max Muster")).toEqual(["Max Muster"]);
  });

  it("parses multiple comma-separated leaders", () => {
    expect(parseLeaders("Alice, Bob, Charlie")).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("trims whitespace around names", () => {
    expect(parseLeaders("  Alice  ,  Bob  ")).toEqual(["Alice", "Bob"]);
  });

  it("filters out empty segments", () => {
    expect(parseLeaders("Alice,,Bob")).toEqual(["Alice", "Bob"]);
  });

  it("filters trailing comma", () => {
    expect(parseLeaders("Alice, Bob,")).toEqual(["Alice", "Bob"]);
  });

  it("handles leading comma", () => {
    expect(parseLeaders(",Alice,Bob")).toEqual(["Alice", "Bob"]);
  });

  it("returns empty array for empty string", () => {
    expect(parseLeaders("")).toEqual([]);
  });

  it("returns empty array for comma-only string", () => {
    expect(parseLeaders(",,,")).toEqual([]);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(parseLeaders("   ,   ,   ")).toEqual([]);
  });
});