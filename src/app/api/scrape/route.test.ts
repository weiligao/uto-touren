import { describe, expect, it, vi } from "vitest";

// Mock Next.js modules that are not available in the test environment
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("next/server", () => ({
  NextResponse: { json: vi.fn() },
  NextRequest: class {},
}));

import { getTotalCount } from "./_parser";

describe("getTotalCount", () => {
  it("extracts count from plain-space pagination string", () => {
    expect(getTotalCount("1-50 / 137")).toBe(137);
  });

  it("extracts count when numbers and separators use &nbsp;", () => {
    // SAC website sometimes renders pagination with non-breaking spaces
    expect(getTotalCount("1&nbsp;-&nbsp;50&nbsp;/&nbsp;137")).toBe(137);
  });

  it("extracts count with mixed &nbsp; and regular spaces", () => {
    expect(getTotalCount("1-50&nbsp;/&nbsp;42")).toBe(42);
  });

  it("returns null when no pagination indicator is present", () => {
    expect(getTotalCount("<html><body>no pagination</body></html>")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getTotalCount("")).toBeNull();
  });

  it("handles pagination at offset (not the first page)", () => {
    expect(getTotalCount("51-100 / 200")).toBe(200);
  });

  it("extracts count embedded in surrounding HTML", () => {
    const html = `<div class="pagination">1-50 / 73 Ergebnisse</div>`;
    expect(getTotalCount(html)).toBe(73);
  });

  it("returns the total, not the range start or end", () => {
    const result = getTotalCount("10-20 / 999");
    expect(result).toBe(999);
    expect(result).not.toBe(10);
    expect(result).not.toBe(20);
  });
});
