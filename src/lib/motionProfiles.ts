// Per-pricing-motion forecast benchmarks. Used to surface defaults and hints
// on the Revenue step. Numbers come from the Pricing article's motion-by-motion
// guidance ("Usage-based most consistently produces NRR > 120%", etc.).
import type { PricingModel } from "./pricingStrategy";
import type { ForecastInputs } from "./forecast";

export interface MotionProfile {
  monthlyGrowthRate: number;       // %
  monthlyGrossChurnRate: number;   // %
  monthlyDowngradeRate: number;    // %
  monthlyExpansionRate: number;    // %
  hiringLagDays: number;           // days
  cacPaybackMonthsBenchmark: number; // display-only expected band
  description: string;
}

export const MOTION_PROFILES: Record<PricingModel, MotionProfile> = {
  "Tiered": {
    monthlyGrowthRate: 6,
    monthlyGrossChurnRate: 1.5,
    monthlyDowngradeRate: 0.5,
    monthlyExpansionRate: 1.2,
    hiringLagDays: 75,
    cacPaybackMonthsBenchmark: 12,
    description: "Standard SaaS tiered motion. Balanced growth, moderate NRR.",
  },
  "Usage-based": {
    monthlyGrowthRate: 8,
    monthlyGrossChurnRate: 1.2,
    monthlyDowngradeRate: 0.3,
    monthlyExpansionRate: 2.5,
    hiringLagDays: 60,
    cacPaybackMonthsBenchmark: 9,
    description: "Revenue compounds with customer success. Expect NRR above 120%.",
  },
  "Freemium": {
    monthlyGrowthRate: 10,
    monthlyGrossChurnRate: 2.5,
    monthlyDowngradeRate: 0.8,
    monthlyExpansionRate: 1.0,
    hiringLagDays: 45,
    cacPaybackMonthsBenchmark: 6,
    description: "Top-funnel scale, lower conversion, lower ARPA.",
  },
  "Free Trial": {
    monthlyGrowthRate: 7,
    monthlyGrossChurnRate: 2.0,
    monthlyDowngradeRate: 0.5,
    monthlyExpansionRate: 1.0,
    hiringLagDays: 60,
    cacPaybackMonthsBenchmark: 9,
    description: "Short decision window, higher intent at conversion.",
  },
  "Hybrid": {
    monthlyGrowthRate: 7,
    monthlyGrossChurnRate: 1.3,
    monthlyDowngradeRate: 0.4,
    monthlyExpansionRate: 2.0,
    hiringLagDays: 75,
    cacPaybackMonthsBenchmark: 10,
    description: "Tiered base plus usage overage. Middle-ground economics.",
  },
};

/**
 * Pick a single motion to represent the user's strategy. If multiple models
 * are selected, treat as Hybrid. Returns null when no model is set.
 */
export function activeMotion(models: PricingModel[]): PricingModel | null {
  if (!models || models.length === 0) return null;
  if (models.length === 1) return models[0];
  return "Hybrid";
}

/** Apply a motion's defaults onto the user's existing forecast inputs. */
export function applyMotionDefaults(
  current: ForecastInputs,
  model: PricingModel,
): ForecastInputs {
  const p = MOTION_PROFILES[model];
  return {
    ...current,
    monthlyGrowthRate: p.monthlyGrowthRate,
    monthlyGrossChurnRate: p.monthlyGrossChurnRate,
    monthlyDowngradeRate: p.monthlyDowngradeRate,
    monthlyExpansionRate: p.monthlyExpansionRate,
    hiringLagDays: p.hiringLagDays,
  };
}
