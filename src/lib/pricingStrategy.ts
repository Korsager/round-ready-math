// Shared accessor for the pricing strategy stored by PricingPlaybook.
// Keeps the storage key in one place so exports (JSON/PDF/PPTX) can read it.

export type PricingModel = "Tiered" | "Usage-based" | "Freemium" | "Free Trial" | "Hybrid";

export interface PricingTier {
  name: string;
  job: string;
  features: string;
  monthlyPrice: string;
  annualPrice: string;
}

export interface PricingContext {
  businessModel: string;
  segments: string;
  currentPricing: string;
}

export interface PricingStrategy {
  context: PricingContext;
  valueMetric: { name: string; rationale: string };
  models: PricingModel[];
  modelNotes: string;
  tiers: [PricingTier, PricingTier, PricingTier];
  annualDiscountPct: string;
  anchoringNotes: string;
  upgradeTriggers: string;
  checklist: Record<string, boolean>;
}

export const PRICING_STORAGE_KEY = "founders-corner-pricing-strategy-v1";

export const blankPricingStrategy = (): PricingStrategy => ({
  context: { businessModel: "", segments: "", currentPricing: "" },
  valueMetric: { name: "", rationale: "" },
  models: [],
  modelNotes: "",
  tiers: [
    { name: "Starter", job: "Make Pro look like the obvious choice", features: "", monthlyPrice: "", annualPrice: "" },
    { name: "Pro", job: "Where 60–70% of customers should land", features: "", monthlyPrice: "", annualPrice: "" },
    { name: "Enterprise", job: "Anchor the high end. Custom — talk to us.", features: "", monthlyPrice: "Custom", annualPrice: "Custom" },
  ],
  annualDiscountPct: "",
  anchoringNotes: "",
  upgradeTriggers: "",
  checklist: {},
});

export function loadPricingStrategy(): PricingStrategy {
  if (typeof window === "undefined") return blankPricingStrategy();
  try {
    const raw = localStorage.getItem(PRICING_STORAGE_KEY);
    if (!raw) return blankPricingStrategy();
    return { ...blankPricingStrategy(), ...JSON.parse(raw) };
  } catch {
    return blankPricingStrategy();
  }
}

export function savePricingStrategy(s: PricingStrategy) {
  try { localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
