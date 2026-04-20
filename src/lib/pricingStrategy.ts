// Pricing strategy types & helpers.
// Persistence now lives in src/lib/assumptions.ts (single store). Callers should
// read/write pricing via useAssumptions() rather than calling load/save here.

export type PricingModel = "Tiered" | "Usage-based" | "Freemium" | "Free Trial" | "Hybrid";

export interface PricingTier {
  name: string;
  job: string;
  features: string;
  monthlyPrice: string;
  annualPrice: string;
  customersMonth0: number;
  newCustomersPerMonth: number;
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

// Legacy localStorage key — kept exported ONLY so the assumptions store can
// migrate it on first load. Do not use in new code.
export const LEGACY_PRICING_STORAGE_KEY = "founders-corner-pricing-strategy-v1";

const blankTier = (overrides: Partial<PricingTier>): PricingTier => ({
  name: "",
  job: "",
  features: "",
  monthlyPrice: "",
  annualPrice: "",
  customersMonth0: 0,
  newCustomersPerMonth: 0,
  ...overrides,
});

export const blankPricingStrategy = (): PricingStrategy => ({
  context: { businessModel: "", segments: "", currentPricing: "" },
  valueMetric: { name: "", rationale: "" },
  models: [],
  modelNotes: "",
  tiers: [
    blankTier({ name: "Starter", job: "Make Pro look like the obvious choice" }),
    blankTier({ name: "Pro", job: "Where 60–70% of customers should land" }),
    blankTier({ name: "Enterprise", job: "Anchor the high end. Custom — talk to us.", monthlyPrice: "Custom", annualPrice: "Custom" }),
  ],
  annualDiscountPct: "",
  anchoringNotes: "",
  upgradeTriggers: "",
  checklist: {},
});

function mergeTier(base: PricingTier, raw: Partial<PricingTier> | undefined): PricingTier {
  const t = { ...base, ...(raw ?? {}) };
  return {
    ...t,
    customersMonth0: Number.isFinite(t.customersMonth0) ? Number(t.customersMonth0) : 0,
    newCustomersPerMonth: Number.isFinite(t.newCustomersPerMonth) ? Number(t.newCustomersPerMonth) : 0,
  };
}

// Merge a parsed/partial pricing object onto a blank baseline. Used by the
// assumptions store loader and the UploadJson importer.
export function mergePricingStrategy(parsed: any): PricingStrategy {
  if (!parsed || typeof parsed !== "object") return blankPricingStrategy();
  const base = blankPricingStrategy();
  const tiers = base.tiers.map((bt, i) => mergeTier(bt, parsed?.tiers?.[i])) as [PricingTier, PricingTier, PricingTier];
  return { ...base, ...parsed, tiers };
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
