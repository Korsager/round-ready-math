import { describe, it, expect } from "vitest";
import { validateImport } from "@/lib/validateImport";
import { DEFAULT_ASSUMPTIONS } from "@/lib/assumptions";

describe("validateImport", () => {
  it("empty object → 0 errors, 0 warnings", () => {
    const r = validateImport({});
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
    expect(r.repaired).toEqual({});
  });

  it("null → error", () => {
    expect(validateImport(null).errors).toHaveLength(1);
  });
  it("array → error", () => {
    expect(validateImport([]).errors).toHaveLength(1);
  });
  it("string → error", () => {
    expect(validateImport("nope").errors).toHaveLength(1);
  });

  it("strips legacy cashflow.fundraiseAmount and warns when it differs from fundraise.raise", () => {
    const r = validateImport({
      cashflow: { fundraiseAmount: 999, startingCash: 100 },
      fundraise: { raise: 2_000_000 },
    });
    expect(r.warnings.length).toBeGreaterThanOrEqual(1);
    const w = r.warnings.find((x) => x.field === "cashflow.fundraiseAmount");
    expect(w).toBeDefined();
    expect((r.repaired as any).cashflow.fundraiseAmount).toBeUndefined();
  });

  it("clamps fundraise.dilutionPct = 150 → 100", () => {
    const r = validateImport({ fundraise: { dilutionPct: 150 } });
    expect(r.warnings.some((w) => w.field === "fundraise.dilutionPct")).toBe(true);
    expect((r.repaired as any).fundraise.dilutionPct).toBe(100);
  });

  it("clamps cashflow.grossMargin = -10 → 0", () => {
    const r = validateImport({ cashflow: { grossMargin: -10 } });
    expect(r.warnings.some((w) => w.field === "cashflow.grossMargin")).toBe(true);
    expect((r.repaired as any).cashflow.grossMargin).toBe(0);
  });

  it("clamps cashflow.monthsUntilRaise = 200 → 60", () => {
    const r = validateImport({ cashflow: { monthsUntilRaise: 200 } });
    expect((r.repaired as any).cashflow.monthsUntilRaise).toBe(60);
  });

  it("replaces malformed planStartDate", () => {
    const r = validateImport({ planStartDate: "garbage" });
    expect(r.warnings.some((w) => w.field === "planStartDate")).toBe(true);
    expect((r.repaired as any).planStartDate).toMatch(/^\d{4}-\d{2}$/);
  });

  it("warns when pricing tiers are priced but forecast is empty", () => {
    const r = validateImport({
      pricing: {
        tiers: [
          { name: "Pro", monthlyPriceNum: 50, targetMix: 50 },
          { name: "Starter", monthlyPriceNum: 0, targetMix: 50 },
        ],
      },
      forecast: { startingMRR: 0, monthlyNewBookings: 0 },
    });
    expect(r.warnings.some((w) => w.field === "pricing/forecast")).toBe(true);
  });

  it("warns on unknown top-level keys", () => {
    const r = validateImport({ foo: 1 });
    expect(r.warnings.some((w) => w.field === "foo" && w.message.includes("Unknown"))).toBe(true);
  });

  it("clamps tier.targetMix outside [0, 100]", () => {
    const r = validateImport({
      pricing: { tiers: [{ name: "X", targetMix: 150, monthlyPriceNum: 0 }] },
    });
    expect((r.repaired as any).pricing.tiers[0].targetMix).toBe(100);
  });

  it("DEFAULT_ASSUMPTIONS round-trips with 0 errors and 0 warnings", () => {
    const serialized = JSON.parse(JSON.stringify(DEFAULT_ASSUMPTIONS));
    const r = validateImport(serialized);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });

  it("does not mutate the caller's input", () => {
    const input = { cashflow: { fundraiseAmount: 1, startingCash: 100 } };
    validateImport(input);
    expect(input.cashflow.fundraiseAmount).toBe(1);
  });
});
