import { describe, it, expect } from "vitest";
import { DEFAULT_CASHFLOW } from "@/lib/cashflow";
import { mergeAssumptionsPayload } from "@/lib/assumptions";

describe("cashflow shape — fundraiseAmount must not leak into persisted state", () => {
  it("DEFAULT_CASHFLOW has no fundraiseAmount property", () => {
    expect(Object.prototype.hasOwnProperty.call(DEFAULT_CASHFLOW, "fundraiseAmount")).toBe(false);
    expect(JSON.stringify(DEFAULT_CASHFLOW)).not.toContain("fundraiseAmount");
  });

  it("strips legacy cashflow.fundraiseAmount from imported payloads", () => {
    const fixture = {
      cashflow: { startingCash: 500_000, fundraiseAmount: 999 },
      fundraise: { raise: 1_500_000 },
    };
    const merged = mergeAssumptionsPayload(fixture);
    expect(Object.prototype.hasOwnProperty.call(merged.cashflow, "fundraiseAmount")).toBe(false);
    expect(JSON.stringify(merged.cashflow)).not.toContain("fundraiseAmount");
    // And the real fundraise amount is preserved on its proper slice.
    expect(merged.fundraise.raise).toBe(1_500_000);
  });
});
