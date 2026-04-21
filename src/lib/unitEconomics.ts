// Unit economics derived from forecast + churn. Pure, no React.

import type { ForecastInputs } from "./forecast";
import type { PricingStrategy } from "./pricingStrategy";
import { blendedGrossMargin } from "./pricingStrategy";

export type UEStatus = "ok" | "warn" | "fail";

export interface UnitEconomicsResult {
  ltv: number;                   // lifetime value, dollars
  ltvCacRatio: number;           // LTV / CAC, or 0 if cac<=0
  paybackMonths: number;         // user-stated target payback
  paybackStatus: UEStatus;       // green ≤12, amber 12–18, red >18
  ratioStatus: UEStatus;         // green ≥3, amber 1.5–3, red <1.5
  impliedNewCustomersPerMonth: number;
  customerVelocityWarn: boolean; // > 1000 new customers/mo (early-stage flag)
  blendedGrossMarginPct: number; // 0–100
}

const LTV_CAP_MONTHS = 60; // cap LTV at 5 years when churn rounds to 0

export function computeUnitEconomics(
  forecast: ForecastInputs,
  pricing: PricingStrategy,
  cashflowGrossMarginPct: number,
): UnitEconomicsResult {
  const arpu = forecast.blendedArpu > 0 ? forecast.blendedArpu : 0;
  const cac = forecast.cac > 0 ? forecast.cac : 0;

  // Prefer pricing-derived gross margin; fall back to cashflow GM if none priced.
  const pricingGm = blendedGrossMargin(pricing);
  const blendedGrossMarginPct = pricingGm > 0 ? pricingGm : cashflowGrossMarginPct;
  const gmFraction = blendedGrossMarginPct / 100;

  // Lifetime months ≈ 1 / monthly gross churn. Cap at 5 yrs when churn ≈ 0.
  const churnFrac = forecast.monthlyGrossChurnRate / 100;
  const lifetimeMonths = churnFrac > 0
    ? Math.min(1 / churnFrac, LTV_CAP_MONTHS)
    : LTV_CAP_MONTHS;
  const ltv = arpu * gmFraction * lifetimeMonths;

  const ltvCacRatio = cac > 0 ? ltv / cac : 0;

  const paybackMonths = forecast.cacPaybackMonths > 0 ? forecast.cacPaybackMonths : 0;

  const ratioStatus: UEStatus =
    cac <= 0 ? "warn" :
    ltvCacRatio >= 3 ? "ok" :
    ltvCacRatio >= 1.5 ? "warn" : "fail";

  const paybackStatus: UEStatus =
    paybackMonths <= 0 ? "warn" :
    paybackMonths <= 12 ? "ok" :
    paybackMonths <= 18 ? "warn" : "fail";

  const impliedNewCustomersPerMonth = arpu > 0 ? forecast.monthlyNewBookings / arpu : 0;
  const customerVelocityWarn = impliedNewCustomersPerMonth > 1000;

  return {
    ltv,
    ltvCacRatio,
    paybackMonths,
    paybackStatus,
    ratioStatus,
    impliedNewCustomersPerMonth,
    customerVelocityWarn,
    blendedGrossMarginPct,
  };
}
