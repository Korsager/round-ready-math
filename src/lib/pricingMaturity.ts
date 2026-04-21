import type { PricingStrategy } from "./pricingStrategy";

// Article's full 7-item Pricing Maturity Checklist.
export const PRICING_CHECKLIST_ITEMS = [
  "We know which features our users actually value most",
  "We have defined our value metric — the unit that scales with customer success",
  "We can describe our customer segments clearly",
  "Our packaging is aligned to usage and outcomes",
  "We have spoken to at least 20 customers about willingness to pay",
  "We have tested different price points in real sales conversations",
  "Pricing is reviewed monthly, not just annually",
];

// Map legacy 5-item keys → new 7-item keys so saved progress survives.
// Any legacy key not listed here is dropped silently on migration.
export const LEGACY_CHECKLIST_MIGRATIONS: Record<string, string> = {
  "We know which features our users value most":
    "We know which features our users actually value most",
  "We have defined our value metric":
    "We have defined our value metric — the unit that scales with customer success",
  "Packaging is aligned to usage and outcomes":
    "Our packaging is aligned to usage and outcomes",
  "We've spoken to 20+ customers about willingness-to-pay":
    "We have spoken to at least 20 customers about willingness to pay",
  "Pricing is reviewed at least monthly":
    "Pricing is reviewed monthly, not just annually",
};

/**
 * Re-key a saved checklist so legacy entries land on the new 7-item canonical
 * keys. Unknown keys are dropped. Keeps `true`/`false` values intact.
 */
export function migrateChecklist(
  raw: Record<string, boolean> | undefined | null,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!raw) return out;
  for (const [key, val] of Object.entries(raw)) {
    if (PRICING_CHECKLIST_ITEMS.includes(key)) {
      out[key] = !!val;
      continue;
    }
    const mapped = LEGACY_CHECKLIST_MIGRATIONS[key];
    if (mapped) out[mapped] = !!val;
  }
  return out;
}

export interface PricingMaturity {
  score: number; // 0–7
  total: number; // 7
  verdict: string;
  tone: "good" | "warn" | "bad";
}

export function computePricingMaturity(pricing: PricingStrategy): PricingMaturity {
  const checklist = pricing?.checklist ?? {};
  const score = PRICING_CHECKLIST_ITEMS.reduce((sum, key) => sum + (checklist[key] ? 1 : 0), 0);
  let verdict: string;
  let tone: "good" | "warn" | "bad";
  if (score >= 6) {
    verdict = "Pricing is an operating system.";
    tone = "good";
  } else if (score >= 4) {
    verdict = "You have pricing, not a pricing system. Close the gaps.";
    tone = "warn";
  } else {
    verdict = "Pricing is the highest-ROI lever you're not pulling. Start with the value metric.";
    tone = "bad";
  }
  return { score, total: PRICING_CHECKLIST_ITEMS.length, verdict, tone };
}
