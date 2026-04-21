import type { PricingStrategy } from "./pricingStrategy";

export const PRICING_CHECKLIST_ITEMS = [
  "We know which features our users value most",
  "We have defined our value metric",
  "Packaging is aligned to usage and outcomes",
  "We've spoken to 20+ customers about willingness-to-pay",
  "Pricing is reviewed at least monthly",
];

export interface PricingMaturity {
  score: number; // 0–5
  total: number; // 5
  verdict: string;
  tone: "good" | "warn" | "bad";
}

export function computePricingMaturity(pricing: PricingStrategy): PricingMaturity {
  const checklist = pricing?.checklist ?? {};
  const score = PRICING_CHECKLIST_ITEMS.reduce((sum, key) => sum + (checklist[key] ? 1 : 0), 0);
  let verdict: string;
  let tone: "good" | "warn" | "bad";
  if (score >= 5) {
    verdict = "Pricing is an operating system.";
    tone = "good";
  } else if (score >= 3) {
    verdict = "You have pricing, not a pricing system. Close the gaps.";
    tone = "warn";
  } else {
    verdict = "Pricing is the highest-ROI lever you're not pulling. Start with the value metric.";
    tone = "bad";
  }
  return { score, total: PRICING_CHECKLIST_ITEMS.length, verdict, tone };
}
