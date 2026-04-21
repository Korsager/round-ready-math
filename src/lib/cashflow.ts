import { simulate, type ForecastInputs } from "./forecast";
import type { CashflowAssumptions } from "./assumptions";

// Runtime input to simulateCashflow — fundraiseAmount is passed in from
// assumptions.fundraise.raise rather than stored on the cashflow slice.
export interface CashflowInputs extends CashflowAssumptions {
  fundraiseAmount: number;
  forecast: ForecastInputs;
}

export interface MonthlyCash {
  month: number;
  revenue: number;
  grossProfit: number;
  opex: number;
  netBurn: number; // positive = burning cash
  fundraiseInflow: number;
  cashBalance: number;
}

export interface CashflowResult {
  months: MonthlyCash[];
  runwayMonth: number | null; // first month cash <= 0; null if never
  defaultAliveMonth: number | null; // first month where gross profit >= opex
  breakEvenMonth: number | null; // alias / same as default alive
  endingCash: number;
  burnMultiple: number; // avg net burn / avg net new ARR
  monthsRunwayAfterRaise: number | null;
}

export function simulateCashflow(inputs: CashflowInputs, horizon = 36): CashflowResult {
  const revenueMonths = simulate(inputs.forecast, horizon);
  const gm = inputs.grossMargin / 100;
  const opexG = inputs.opexGrowthRate / 100;

  // S&M load from CAC: cost = CAC × new customers acquired this month.
  // New customers/mo = monthlyNewBookings (in $) / blendedArpu (in $/customer/mo).
  // Defaults guard against divide-by-zero on legacy saves.
  const arpu = inputs.forecast.blendedArpu > 0 ? inputs.forecast.blendedArpu : 0;
  const cac = inputs.forecast.cac > 0 ? inputs.forecast.cac : 0;

  const months: MonthlyCash[] = [];
  let cash = inputs.startingCash;
  let runwayMonth: number | null = null;
  let defaultAliveMonth: number | null = null;

  for (let t = 0; t <= horizon; t++) {
    const revenue = revenueMonths[t].mrr;
    const grossProfit = revenue * gm;
    const baseOpex = inputs.startingBurn * Math.pow(1 + opexG, t);
    // CAC cost scales with the new bookings the forecast already produces.
    const newCustomers = arpu > 0 ? revenueMonths[t].newBookings / arpu : 0;
    const sAndM = newCustomers * cac;
    const opex = baseOpex + sAndM;
    const netBurn = opex - grossProfit;
    const fundraiseInflow = t === inputs.monthsUntilRaise ? inputs.fundraiseAmount : 0;

    if (t > 0) cash = cash - netBurn + fundraiseInflow;
    else cash = inputs.startingCash + fundraiseInflow;

    if (runwayMonth === null && cash <= 0 && t > 0) runwayMonth = t;
    if (defaultAliveMonth === null && grossProfit >= opex && t > 0) defaultAliveMonth = t;

    months.push({ month: t, revenue, grossProfit, opex, netBurn, fundraiseInflow, cashBalance: cash });
  }

  // Burn multiple: avg monthly net burn / avg net new ARR (over first 12 months while burning)
  let totalBurn = 0;
  let totalNetNewARR = 0;
  let count = 0;
  for (let t = 1; t <= Math.min(12, horizon); t++) {
    const m = months[t];
    if (m.netBurn > 0) {
      totalBurn += m.netBurn;
      const arrDelta = (revenueMonths[t].mrr - revenueMonths[t - 1].mrr) * 12;
      totalNetNewARR += arrDelta;
      count++;
    }
  }
  const burnMultiple = totalNetNewARR > 0 ? totalBurn / (totalNetNewARR / 12) : Infinity;

  let monthsRunwayAfterRaise: number | null = null;
  if (inputs.monthsUntilRaise <= horizon) {
    const raiseIdx = inputs.monthsUntilRaise;
    const cashAtRaise = months[raiseIdx].cashBalance;
    if (cashAtRaise > 0) {
      let m = raiseIdx;
      for (let t = raiseIdx + 1; t <= horizon; t++) {
        if (months[t].cashBalance <= 0) {
          m = t;
          monthsRunwayAfterRaise = t - raiseIdx;
          break;
        }
      }
      if (monthsRunwayAfterRaise === null) monthsRunwayAfterRaise = horizon - raiseIdx;
    }
  }

  return {
    months,
    runwayMonth,
    defaultAliveMonth,
    breakEvenMonth: defaultAliveMonth,
    endingCash: months[horizon].cashBalance,
    burnMultiple,
    monthsRunwayAfterRaise,
  };
}

export const DEFAULT_CASHFLOW: CashflowAssumptions = {
  startingCash: 1_500_000,
  monthsUntilRaise: 6,
  startingBurn: 180_000,
  opexGrowthRate: 4,
  grossMargin: 75,
};
