import { describe, it, expect } from "vitest";
import { blankPricingStrategy, blendedGrossMargin } from "@/lib/pricingStrategy";

describe("blendedGrossMargin", () => {
  it("returns 0 when no tiers are priced", () => {
    const s = blankPricingStrategy();
    s.tiers.forEach((t) => { t.monthlyPriceNum = 0; });
    expect(blendedGrossMargin(s)).toBe(0);
  });

  it("returns the tier's margin when only one tier is priced", () => {
    const s = blankPricingStrategy();
    s.tiers.forEach((t) => { t.monthlyPriceNum = 0; t.targetMix = 0; });
    s.tiers[1].monthlyPriceNum = 100;
    s.tiers[1].targetMix = 50;
    s.tiers[1].grossMarginPct = 82;
    expect(blendedGrossMargin(s)).toBe(82);
  });

  it("computes a revenue-weighted average across tiers", () => {
    const s = blankPricingStrategy();
    // Tier A: $50 × 50% mix = weight 2500, margin 80
    // Tier B: $200 × 50% mix = weight 10000, margin 70
    // Weighted: (80*2500 + 70*10000) / 12500 = (200000 + 700000) / 12500 = 72
    s.tiers[0].monthlyPriceNum = 50;
    s.tiers[0].targetMix = 50;
    s.tiers[0].grossMarginPct = 80;
    s.tiers[1].monthlyPriceNum = 200;
    s.tiers[1].targetMix = 50;
    s.tiers[1].grossMarginPct = 70;
    s.tiers[2].monthlyPriceNum = 0;
    s.tiers[2].targetMix = 0;
    expect(blendedGrossMargin(s)).toBeCloseTo(72, 5);
  });
});
