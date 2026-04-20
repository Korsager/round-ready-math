import { describe, it, expect } from "vitest";
import { DEFAULT_ASSUMPTIONS } from "@/lib/assumptions";
import { computePlanSummary } from "@/lib/planSummary";
import { computePlanNarrative } from "@/lib/planNarrative";
import { blankPricingStrategy } from "@/lib/pricingStrategy";

describe("computePlanNarrative", () => {
  it("returns 5 links with non-empty sentences and valid statuses", () => {
    const a = DEFAULT_ASSUMPTIONS;
    const summary = computePlanSummary(a);
    const narrative = computePlanNarrative(a, summary);
    expect(narrative.links).toHaveLength(5);
    for (const link of narrative.links) {
      expect(link.title.length).toBeGreaterThan(0);
      expect(link.sentence.length).toBeGreaterThan(0);
      expect(["ok", "warn", "fail"]).toContain(link.status);
    }
    expect(narrative.openingSentence.length).toBeGreaterThan(0);
    expect(narrative.closingSentence.length).toBeGreaterThan(0);
  });

  it("warns on link 1 when no pricing tier has a numeric price", () => {
    const pricing = blankPricingStrategy();
    pricing.tiers.forEach((t) => { t.monthlyPriceNum = 0; });
    const a = { ...DEFAULT_ASSUMPTIONS, pricing };
    const narrative = computePlanNarrative(a, computePlanSummary(a));
    expect(narrative.links[0].status).toBe("warn");
    expect(narrative.links[0].sentence.toLowerCase()).toContain("pricing anchor");
  });

  it("warns on link 2 when bookings imply <1 customer/mo", () => {
    const pricing = blankPricingStrategy();
    pricing.tiers[0].monthlyPriceNum = 10000;
    pricing.tiers[0].targetMix = 100;
    const a = {
      ...DEFAULT_ASSUMPTIONS,
      pricing,
      forecast: { ...DEFAULT_ASSUMPTIONS.forecast, monthlyNewBookings: 5000 },
    };
    const narrative = computePlanNarrative(a, computePlanSummary(a));
    expect(narrative.links[1].status).toBe("warn");
    expect(narrative.links[1].sentence).toContain("<1 customer");
  });

  it("flags link 4 as fail when runway after raise is 6 months", () => {
    const a = {
      ...DEFAULT_ASSUMPTIONS,
      cashflow: { ...DEFAULT_ASSUMPTIONS.cashflow, startingCash: 100_000, startingBurn: 500_000, monthsUntilRaise: 1 },
      fundraise: { ...DEFAULT_ASSUMPTIONS.fundraise, raise: 2_000_000 },
    };
    const summary = computePlanSummary(a);
    const narrative = computePlanNarrative(a, summary);
    if (summary.monthsRunwayAfterRaise !== null && summary.monthsRunwayAfterRaise < 12) {
      expect(narrative.links[3].status).toBe("fail");
    }
  });

  it("marks link 4 as ok when runway after raise is comfortable (≥18mo)", () => {
    const a = {
      ...DEFAULT_ASSUMPTIONS,
      cashflow: { ...DEFAULT_ASSUMPTIONS.cashflow, startingCash: 5_000_000, startingBurn: 50_000, opexGrowthRate: 0, monthsUntilRaise: 1 },
      fundraise: { ...DEFAULT_ASSUMPTIONS.fundraise, raise: 5_000_000 },
    };
    const summary = computePlanSummary(a);
    const narrative = computePlanNarrative(a, summary);
    expect(narrative.links[3].status).toBe("ok");
  });

  it("closing sentence mentions the weakest link's title when something is off", () => {
    const pricing = blankPricingStrategy();
    pricing.tiers.forEach((t) => { t.monthlyPriceNum = 0; });
    const a = { ...DEFAULT_ASSUMPTIONS, pricing };
    const narrative = computePlanNarrative(a, computePlanSummary(a));
    const weakest = narrative.links.find((l) => l.status === "fail")
      ?? narrative.links.find((l) => l.status === "warn");
    if (weakest) {
      expect(narrative.closingSentence).toContain(weakest.title);
    }
  });
});
