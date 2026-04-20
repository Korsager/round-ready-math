// Pricing strategy types & helpers.
// Persistence now lives in src/lib/assumptions.ts (single store). Callers should
// read/write pricing via useAssumptions() rather than calling load/save here.

export type PricingModel = "Tiered" | "Usage-based" | "Freemium" | "Free Trial" | "Hybrid";

export interface PricingTier {
  name: string;
  job: string;
  features: string;
  monthlyPrice: string;       // free-form display ("$29", "Custom", etc.)
  monthlyPriceNum: number;    // numeric companion used for blended-ARPU math
  annualPrice: string;
  customersMonth0: number;
  newCustomersPerMonth: number;
  targetMix: number;          // 0–100 share of new customers landing in this tier
  grossMarginPct: number;     // 0–100 estimated gross margin for this tier
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
  // Strategy-level customer counts (used with blended ARPU to derive forecast).
  currentCustomers: number;
  targetNewCustomersPerMonth: number;
}

// Legacy localStorage key — kept exported ONLY so the assumptions store can
// migrate it on first load. Do not use in new code.
export const LEGACY_PRICING_STORAGE_KEY = "founders-corner-pricing-strategy-v1";

const blankTier = (overrides: Partial<PricingTier>): PricingTier => ({
  name: "",
  job: "",
  features: "",
  monthlyPrice: "",
  monthlyPriceNum: 0,
  annualPrice: "",
  customersMonth0: 0,
  newCustomersPerMonth: 0,
  targetMix: 0,
  grossMarginPct: 75,
  ...overrides,
});

export const blankPricingStrategy = (): PricingStrategy => ({
  context: { businessModel: "", segments: "", currentPricing: "" },
  valueMetric: { name: "", rationale: "" },
  models: [],
  modelNotes: "",
  tiers: [
    blankTier({ name: "Starter", job: "Make Pro look like the obvious choice", targetMix: 20, grossMarginPct: 80 }),
    blankTier({ name: "Pro", job: "Where 60–70% of customers should land", targetMix: 60, grossMarginPct: 78 }),
    blankTier({ name: "Enterprise", job: "Anchor the high end. Custom — talk to us.", monthlyPrice: "Custom", annualPrice: "Custom", targetMix: 20, grossMarginPct: 70 }),
  ],
  annualDiscountPct: "",
  anchoringNotes: "",
  upgradeTriggers: "",
  checklist: {},
  currentCustomers: 0,
  targetNewCustomersPerMonth: 0,
});

function mergeTier(base: PricingTier, raw: Partial<PricingTier> | undefined): PricingTier {
  const t = { ...base, ...(raw ?? {}) };
  return {
    ...t,
    monthlyPriceNum: Number.isFinite(t.monthlyPriceNum) ? Number(t.monthlyPriceNum) : 0,
    customersMonth0: Number.isFinite(t.customersMonth0) ? Number(t.customersMonth0) : 0,
    newCustomersPerMonth: Number.isFinite(t.newCustomersPerMonth) ? Number(t.newCustomersPerMonth) : 0,
    targetMix: Number.isFinite(t.targetMix) ? Number(t.targetMix) : 0,
    grossMarginPct: Number.isFinite(t.grossMarginPct) ? Number(t.grossMarginPct) : base.grossMarginPct,
  };
}

// Merge a parsed/partial pricing object onto a blank baseline. Used by the
// assumptions store loader and the UploadJson importer.
export function mergePricingStrategy(parsed: any): PricingStrategy {
  if (!parsed || typeof parsed !== "object") return blankPricingStrategy();
  const base = blankPricingStrategy();
  const tiers = base.tiers.map((bt, i) => mergeTier(bt, parsed?.tiers?.[i])) as [PricingTier, PricingTier, PricingTier];
  return {
    ...base,
    ...parsed,
    tiers,
    currentCustomers: Number.isFinite(parsed?.currentCustomers) ? Number(parsed.currentCustomers) : 0,
    targetNewCustomersPerMonth: Number.isFinite(parsed?.targetNewCustomersPerMonth) ? Number(parsed.targetNewCustomersPerMonth) : 0,
  };
}

// Returns the numeric monthly price in dollars, or 0 if unparseable / "Custom" / etc.
export function parseMonthlyPrice(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return isFinite(n) && n > 0 ? n : 0;
}

export interface DerivedTier {
  name: string;
  monthlyPrice: number;
  customersMonth0: number;
  newCustomersPerMonth: number;
  mrrContribution: number;
  bookingsContribution: number;
}

export function deriveRevenueFromPricing(s: PricingStrategy): {
  startingMRR: number;
  monthlyNewBookings: number;
  perTier: DerivedTier[];
} {
  const perTier: DerivedTier[] = s.tiers.map((t) => {
    const price = parseMonthlyPrice(t.monthlyPrice);
    const c0 = t.customersMonth0 || 0;
    const cn = t.newCustomersPerMonth || 0;
    return {
      name: t.name || "Untitled",
      monthlyPrice: price,
      customersMonth0: c0,
      newCustomersPerMonth: cn,
      mrrContribution: price * c0,
      bookingsContribution: price * cn,
    };
  });
  const startingMRR = perTier.reduce((sum, t) => sum + t.mrrContribution, 0);
  const monthlyNewBookings = perTier.reduce((sum, t) => sum + t.bookingsContribution, 0);
  return { startingMRR, monthlyNewBookings, perTier };
}

export function tieredCount(s: PricingStrategy): number {
  return deriveRevenueFromPricing(s).perTier.filter((t) => t.mrrContribution > 0).length;
}

// Blended ARPU = Σ (price_i × mix_i / totalMix). Returns 0 if no usable inputs.
export function blendedARPU(pricing: PricingStrategy): number {
  const totalMix = pricing.tiers.reduce((sum, t) => sum + (t.targetMix || 0), 0);
  if (totalMix <= 0) return 0;
  let weighted = 0;
  let pricedAny = false;
  for (const t of pricing.tiers) {
    const price = t.monthlyPriceNum || 0;
    if (price > 0) pricedAny = true;
    weighted += price * ((t.targetMix || 0) / totalMix);
  }
  return pricedAny ? weighted : 0;
}

export function derivedStartingMRR(pricing: PricingStrategy): number {
  return blendedARPU(pricing) * (pricing.currentCustomers || 0);
}

export function derivedMonthlyNewBookings(pricing: PricingStrategy): number {
  return blendedARPU(pricing) * (pricing.targetNewCustomersPerMonth || 0);
}

// Revenue-weighted blended gross margin %. Weight per tier = price × targetMix.
// Returns 0 when no priced tiers exist (caller can fall back to a manual value).
export function blendedGrossMargin(pricing: PricingStrategy): number {
  let totalWeight = 0;
  let weighted = 0;
  for (const t of pricing.tiers) {
    const price = t.monthlyPriceNum || 0;
    const mix = t.targetMix || 0;
    const weight = price * mix;
    if (weight <= 0) continue;
    totalWeight += weight;
    weighted += (t.grossMarginPct || 0) * weight;
  }
  return totalWeight > 0 ? weighted / totalWeight : 0;
}

export function derivedGrossMargin(pricing: PricingStrategy): number {
  return blendedGrossMargin(pricing);
}
