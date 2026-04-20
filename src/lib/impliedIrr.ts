import type { Assumptions } from "./assumptions";
import { runScenario } from "./forecast";

export const PRE_REVENUE_ARR_THRESHOLD = 500_000;

export type ValuationBasis = "revenue" | "ownership";

export interface ImpliedIrrResult {
  basis: ValuationBasis;
  arrAtExit: number;
  impliedExitValue: number;
  investorProceedsAtExit: number;
  impliedMoic: number;
  impliedIrrPct: number;
  reasoning: string;
}

export function computeImpliedIrr(a: Assumptions): ImpliedIrrResult {
  const { raise, dilutionPct, yearsToExit, targetMoic, revenueMultiple, valuationMethod } = a.fundraise;
  const ownership = dilutionPct / 100;

  const base = runScenario(a.forecast, "base");
  const monthsAvailable = Math.min(base.months.length - 1, 36);
  const endingARR = base.months[monthsAvailable]?.arr ?? 0;

  const monthlyG = a.forecast.monthlyGrowthRate / 100;
  const annualG = Math.pow(1 + monthlyG, 12) - 1;
  const yearsBeyond36 = Math.max(0, yearsToExit - 3);
  let arrAtExit: number;
  if (yearsToExit <= 3) {
    const exitMonth = Math.min(monthsAvailable, Math.max(0, Math.round(yearsToExit * 12)));
    arrAtExit = base.months[exitMonth]?.arr ?? 0;
  } else {
    arrAtExit = endingARR * Math.pow(1 + annualG, yearsBeyond36);
  }

  let basis: ValuationBasis;
  if (valuationMethod === "revenue") basis = "revenue";
  else if (valuationMethod === "ownership") basis = "ownership";
  else basis = arrAtExit >= PRE_REVENUE_ARR_THRESHOLD ? "revenue" : "ownership";

  let impliedExitValue: number;
  let reasoning: string;

  if (basis === "revenue") {
    impliedExitValue = arrAtExit * revenueMultiple;
    reasoning = `Year-${yearsToExit} ARR of $${Math.round(arrAtExit).toLocaleString()} × ${revenueMultiple}× revenue multiple.`;
  } else {
    impliedExitValue = ownership > 0 ? (raise * targetMoic) / ownership : 0;
    reasoning = arrAtExit < PRE_REVENUE_ARR_THRESHOLD
      ? `Pre-revenue path — ARR at exit is below $500k, pricing on dilution and your claimed ${targetMoic}× MOIC.`
      : `Ownership-based — exit valuation back-solved from your ${targetMoic}× MOIC target.`;
  }

  const investorProceedsAtExit = impliedExitValue * ownership;
  const impliedMoic = raise > 0 ? investorProceedsAtExit / raise : 0;
  const impliedIrrPct = yearsToExit > 0 && impliedMoic > 0
    ? (Math.pow(impliedMoic, 1 / yearsToExit) - 1) * 100
    : 0;

  return { basis, arrAtExit, impliedExitValue, investorProceedsAtExit, impliedMoic, impliedIrrPct, reasoning };
}
