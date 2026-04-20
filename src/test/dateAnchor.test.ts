import { describe, it, expect } from "vitest";
import { monthLabel, monthShort, planStartLabel, currentMonthISO } from "@/lib/dateAnchor";
import { DEFAULT_ASSUMPTIONS, mergeAssumptionsPayload } from "@/lib/assumptions";

describe("dateAnchor helpers", () => {
  it("monthLabel(2026-04, 0) shows Month 0 and Apr 2026", () => {
    const s = monthLabel("2026-04", 0);
    expect(s.startsWith("Month 0")).toBe(true);
    expect(s).toContain("Apr 2026");
  });

  it("monthLabel(2026-04, 12) crosses the year to Apr 2027", () => {
    expect(monthLabel("2026-04", 12)).toContain("Apr 2027");
  });

  it("monthLabel(2026-11, 3) crosses the year to Feb 2027", () => {
    expect(monthLabel("2026-11", 3)).toContain("Feb 2027");
  });

  it("monthShort uses 2-digit year with apostrophe", () => {
    expect(monthShort("2026-04", 6)).toBe("Oct '26");
  });

  it("planStartLabel renders the anchor itself", () => {
    expect(planStartLabel("2026-04")).toBe("Apr 2026");
  });

  it("falls back to current month for malformed input", () => {
    const out = monthLabel("not-a-date", 0);
    expect(out.startsWith("Month 0")).toBe(true);
  });
});

describe("planStartDate on the assumptions store", () => {
  it("DEFAULT_ASSUMPTIONS.planStartDate is a valid YYYY-MM string", () => {
    expect(DEFAULT_ASSUMPTIONS.planStartDate).toMatch(/^\d{4}-\d{2}$/);
    expect(DEFAULT_ASSUMPTIONS.planStartDate).toBe(currentMonthISO());
  });

  it("mergeAssumptionsPayload preserves a valid planStartDate", () => {
    const merged = mergeAssumptionsPayload({ planStartDate: "2025-09" });
    expect(merged.planStartDate).toBe("2025-09");
  });

  it("mergeAssumptionsPayload falls back to current month when missing", () => {
    const merged = mergeAssumptionsPayload({});
    expect(merged.planStartDate).toMatch(/^\d{4}-\d{2}$/);
  });

  it("mergeAssumptionsPayload rejects malformed planStartDate", () => {
    const merged = mergeAssumptionsPayload({ planStartDate: "garbage" });
    expect(merged.planStartDate).toMatch(/^\d{4}-\d{2}$/);
  });
});
