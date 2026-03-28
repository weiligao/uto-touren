import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDuration,
  na,
  parseDuration,
  parseGermanDate,
} from "./utils";

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
  it("formats a valid ISO date", () => {
    const result = formatDate("2026-06-12T00:00:00.000Z", "fallback");
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
    expect(formatDuration(1)).toBe("1 day");
  });

  it("plural", () => {
    expect(formatDuration(3)).toBe("3 days");
  });

  it("zero", () => {
    expect(formatDuration(0)).toBe("0 days");
  });
});

describe("na", () => {
  it("returns value when non-empty", () => {
    expect(na("hello")).toBe("hello");
  });

  it("returns N/A for empty string", () => {
    expect(na("")).toBe("N/A");
  });
});
