import { simulate, type ForecastInputs } from "./forecast";
import type { CashflowAssumptions } from "./assumptions";
import {
  type PlannedRaise,
  type AutoPlanConfig,
  newRaiseId,
  cumulativeDilution,
} from "./raises";

// Runtime input to simulateCashflow. The "currentRound" is whatever the user
// is pitching today (set on the Fundraising step); manualRaises are extra
// future rounds the user planned by hand; autoPlan is the rule the simulator
// uses to insert future rounds when burn outpaces revenue.
export interface CashflowInputs extends CashflowAssumptions {
  currentRound: { month: number; amount: number; dilutionPct: number };
  manualRaises: PlannedRaise[];
  autoPlan: AutoPlanConfig;
  forecast: ForecastInputs;
}

export interface MonthlyCash {
  month: number;
  revenue: number;
  grossProfit: number;
  opex: number;
  netBurn: number;
  fundraiseInflow: number;
  cashBalance: number;
}

export interface CashflowResult {
  months: MonthlyCash[];
  runwayMonth: number | null;
  defaultAliveMonth: number | null;
  breakEvenMonth: number | null;
  endingCash: number;
  burnMultiple: number;
  monthsRunwayAfterRaise: number | null;
  // Multi-round outputs
  plannedRaises: PlannedRaise[];
  totalRaisedTo36: number;
  cumulativeDilutionPct: number;
  founderOwnershipAtM36: number; // 0–100 (percent)
  raisesNeededToSurvive: number; // count of auto-planned rounds inserted
  reachesDefaultAliveBeforeRaising: boolean;
  autoPlanExhausted: boolean;
}

export function simulateCashflow(inputs: CashflowInputs, horizon = 36): CashflowResult {
  const revenueMonths = simulate(inputs.forecast, horizon);
  const gm = inputs.grossMargin / 100;
  const opexG = inputs.opexGrowthRate / 100;

  // Pre-compute opex curve (independent of cash trajectory).
  const opexAt = (t: number) => inputs.startingBurn * Math.pow(1 + opexG, t);
  const grossProfitAt = (t: number) => (revenueMonths[t]?.mrr ?? 0) * gm;
  const netBurnAt = (t: number) => opexAt(t) - grossProfitAt(t);

  // Build the master raise schedule. Always include the current round.
  // Manual raises sit alongside (label them clearly upstream).
  const initialRaises: PlannedRaise[] = [
    {
      id: "current",
      month: inputs.currentRound.month,
      amount: inputs.currentRound.amount,
      dilutionPct: inputs.currentRound.dilutionPct,
      label: "Series A (current)",
      source: "current",
    },
    ...inputs.manualRaises.map((r) => ({ ...r })),
  ].sort((a, b) => a.month - b.month);

  const plannedRaises: PlannedRaise[] = [...initialRaises];
  const auto = inputs.autoPlan;
  let autoCount = 0;
  let autoPlanExhausted = false;

  // Helper: at a given month, what raise inflow is scheduled?
  const inflowAt = (t: number) =>
    plannedRaises
      .filter((r) => r.month === t && r.amount > 0)
      .reduce((s, r) => s + r.amount, 0);

  // Helper: name auto-planned rounds Series B, Series C, ...
  const seriesLetter = (n: number) => String.fromCharCode("A".charCodeAt(0) + n);

  // Helper: project forward burn average (positive = burning) over a window.
  // Used for sizing auto rounds. Avoids using current/historical numbers.
  const forwardBurnAverage = (fromMonth: number, windowSize: number) => {
    let sum = 0;
    let n = 0;
    for (let t = fromMonth; t < fromMonth + windowSize && t <= horizon; t++) {
      const nb = netBurnAt(t);
      if (nb > 0) sum += nb;
      n++;
    }
    return n > 0 ? sum / n : 0;
  };

  // Helper: estimate forward runway in months given current cash & current month.
  // Walks forward applying burn (no future raises considered) until cash <= 0
  // or we exhaust the horizon.
  const forwardRunway = (fromMonth: number, fromCash: number) => {
    let cash = fromCash;
    for (let t = fromMonth + 1; t <= horizon + 12; t++) {
      // Beyond horizon, hold burn flat at the last horizon month's level.
      const nb = t <= horizon ? netBurnAt(t) : netBurnAt(horizon);
      cash -= nb;
      if (cash <= 0) return t - fromMonth;
    }
    return 999; // effectively infinite within window we care about
  };

  const months: MonthlyCash[] = [];
  let cash = inputs.startingCash;
  let runwayMonth: number | null = null;
  let defaultAliveMonth: number | null = null;

  for (let t = 0; t <= horizon; t++) {
    const revenue = revenueMonths[t].mrr;
    const grossProfit = revenue * gm;
    const opex = opexAt(t);
    const netBurn = opex - grossProfit;

    // Apply any scheduled raises for this month.
    const scheduledInflow = inflowAt(t);

    if (t === 0) {
      cash = inputs.startingCash + scheduledInflow;
    } else {
      cash = cash - netBurn + scheduledInflow;
    }

    // Auto-plan check: if enabled, no raise scheduled within the next
    // triggerMonthsOfRunway months, and forward runway from here is below
    // the trigger, insert a new round at month t+1 (or t if t===0 and we're
    // already empty — but more realistically, schedule it next month so it
    // shows up as a discrete event on the chart).
    if (
      auto.enabled &&
      autoCount < auto.maxRounds &&
      t < horizon &&
      cash > 0
    ) {
      // Is there already a raise scheduled in our coverage window?
      const upcomingRaiseExists = plannedRaises.some(
        (r) => r.month > t && r.month <= t + auto.triggerMonthsOfRunway && r.amount > 0,
      );
      if (!upcomingRaiseExists) {
        const monthsLeft = forwardRunway(t, cash);
        if (monthsLeft <= auto.triggerMonthsOfRunway) {
          // Size the round to fund N months of forward burn.
          const insertAt = Math.min(horizon, t + 1);
          const burnAvg = forwardBurnAverage(insertAt, auto.fundMonthsForward);
          const amount = Math.max(0, burnAvg * auto.fundMonthsForward);
          if (amount > 0) {
            autoCount++;
            // Series letter: existing rounds count + this one.
            const existingCount = plannedRaises.length;
            plannedRaises.push({
              id: newRaiseId(),
              month: insertAt,
              amount,
              dilutionPct: auto.dilutionPerRound,
              label: `Series ${seriesLetter(existingCount)}`,
              source: "auto",
            });
            plannedRaises.sort((a, b) => a.month - b.month);
          }
        }
      }
    }

    if (runwayMonth === null && cash <= 0 && t > 0) runwayMonth = t;
    if (defaultAliveMonth === null && grossProfit >= opex && t > 0) defaultAliveMonth = t;

    months.push({
      month: t,
      revenue,
      grossProfit,
      opex,
      netBurn,
      fundraiseInflow: scheduledInflow,
      cashBalance: cash,
    });
  }

  // If runway hit and we maxed out rounds, flag exhaustion.
  if (runwayMonth !== null && autoCount >= auto.maxRounds && auto.enabled) {
    autoPlanExhausted = true;
  }

  // Burn multiple over first 12 burning months.
  let totalBurn = 0;
  let totalNetNewARR = 0;
  for (let t = 1; t <= Math.min(12, horizon); t++) {
    const m = months[t];
    if (m.netBurn > 0) {
      totalBurn += m.netBurn;
      const arrDelta = (revenueMonths[t].mrr - revenueMonths[t - 1].mrr) * 12;
      totalNetNewARR += arrDelta;
    }
  }
  const burnMultiple = totalNetNewARR > 0 ? totalBurn / (totalNetNewARR / 12) : Infinity;

  // Months of runway after the current round closes — kept for legacy UI.
  let monthsRunwayAfterRaise: number | null = null;
  const raiseIdx = inputs.currentRound.month;
  if (raiseIdx <= horizon) {
    const cashAtRaise = months[raiseIdx]?.cashBalance ?? 0;
    if (cashAtRaise > 0) {
      let found = false;
      for (let t = raiseIdx + 1; t <= horizon; t++) {
        if (months[t].cashBalance <= 0) {
          monthsRunwayAfterRaise = t - raiseIdx;
          found = true;
          break;
        }
      }
      if (!found) monthsRunwayAfterRaise = horizon - raiseIdx;
    }
  }

  // Multi-round summary fields.
  const raisesWithinHorizon = plannedRaises.filter((r) => r.month <= horizon && r.amount > 0);
  const totalRaisedTo36 = raisesWithinHorizon.reduce((s, r) => s + r.amount, 0);
  const { founderOwnership, cumulativeDilutionPct } = cumulativeDilution(raisesWithinHorizon);
  const raisesNeededToSurvive = plannedRaises.filter((r) => r.source === "auto").length;

  // Did we reach default-alive before any auto raise was needed?
  const firstAutoMonth = plannedRaises.find((r) => r.source === "auto")?.month ?? null;
  const reachesDefaultAliveBeforeRaising =
    defaultAliveMonth !== null &&
    (firstAutoMonth === null || defaultAliveMonth <= firstAutoMonth);

  return {
    months,
    runwayMonth,
    defaultAliveMonth,
    breakEvenMonth: defaultAliveMonth,
    endingCash: months[horizon].cashBalance,
    burnMultiple,
    monthsRunwayAfterRaise,
    plannedRaises,
    totalRaisedTo36,
    cumulativeDilutionPct,
    founderOwnershipAtM36: founderOwnership * 100,
    raisesNeededToSurvive,
    reachesDefaultAliveBeforeRaising,
    autoPlanExhausted,
  };
}

export const DEFAULT_CASHFLOW: CashflowAssumptions = {
  startingCash: 1_500_000,
  monthsUntilRaise: 6,
  startingBurn: 180_000,
  opexGrowthRate: 4,
  grossMargin: 75,
};
