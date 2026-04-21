export interface ForecastInputs {
  startingMRR: number;
  monthlyNewBookings: number;
  monthlyGrowthRate: number;
  annualNRR: number; // derived/display only; kept for compatibility
  hiringLagDays: number;
  monthlyGrossChurnRate: number; // % of MRR lost to cancellations
  monthlyDowngradeRate: number; // % of MRR lost to downgrades
  monthlyExpansionRate: number; // % of MRR gained from expansion
  // Unit economics — drive cashflow S&M load and the LTV/CAC card.
  // Default to non-zero so old saves don't divide-by-zero downstream.
  cac: number;                  // $ to acquire one customer
  cacPaybackMonths: number;     // target payback period for one customer
  blendedArpu: number;          // $/customer/month — auto-derived from pricing or manual
}


export interface MonthlyData {
  month: number;
  mrr: number;
  arr: number;
  retainedMRR: number;
  newBookings: number;
  grossChurnLoss: number;
  downgradeLoss: number;
  churnLoss: number; // total = gross + downgrade (back-compat)
  expansionGain: number;
}

export interface ScenarioResult {
  name: "bull" | "base" | "bear";
  color: string;
  months: MonthlyData[];
  endingMRR: number;
  endingARR: number;
  horizonMonths: number;
}

export function deriveAnnualNRR(inputs: Pick<ForecastInputs, "monthlyGrossChurnRate" | "monthlyDowngradeRate" | "monthlyExpansionRate">): number {
  const monthlyFactor = 1 - inputs.monthlyGrossChurnRate / 100 - inputs.monthlyDowngradeRate / 100 + inputs.monthlyExpansionRate / 100;
  return Math.pow(Math.max(0.0001, monthlyFactor), 12) * 100;
}

export function simulate(inputs: ForecastInputs, horizonMonths = 36): MonthlyData[] {
  const { startingMRR, monthlyNewBookings, monthlyGrowthRate, hiringLagDays,
    monthlyGrossChurnRate, monthlyDowngradeRate, monthlyExpansionRate } = inputs;
  const g = monthlyGrowthRate / 100;
  const grossR = monthlyGrossChurnRate / 100;
  const downR = monthlyDowngradeRate / 100;
  const expR = monthlyExpansionRate / 100;
  const rampMonths = Math.max(hiringLagDays / 30, 0.01);

  const months: MonthlyData[] = [{
    month: 0,
    mrr: startingMRR,
    arr: startingMRR * 12,
    retainedMRR: startingMRR,
    newBookings: 0,
    grossChurnLoss: 0,
    downgradeLoss: 0,
    churnLoss: 0,
    expansionGain: 0,
  }];

  let prevBookings = monthlyNewBookings;
  for (let t = 1; t <= horizonMonths; t++) {
    const rampCompletion = Math.min(1, t / rampMonths);
    const prev = months[t - 1].mrr;
    const grossChurnLoss = prev * grossR;
    const downgradeLoss = prev * downR;
    const expansionGain = prev * expR;
    const retainedMRR = prev - grossChurnLoss - downgradeLoss + expansionGain;
    const newBookings = prevBookings * (1 + g) * rampCompletion;
    prevBookings = prevBookings * (1 + g);
    const mrr = retainedMRR + newBookings;
    months.push({
      month: t,
      mrr,
      arr: mrr * 12,
      retainedMRR,
      newBookings,
      grossChurnLoss,
      downgradeLoss,
      churnLoss: grossChurnLoss + downgradeLoss,
      expansionGain,
    });
  }
  return months;
}

export const SCENARIOS = {
  bull: { growthMult: 1.5, churnMult: 0.6, downMult: 0.6, expMult: 1.4, rampMult: 0.7, color: "#0A9E5E", label: "Bull" },
  base: { growthMult: 1.0, churnMult: 1.0, downMult: 1.0, expMult: 1.0, rampMult: 1.0, color: "#6366F1", label: "Base" },
  bear: { growthMult: 0.5, churnMult: 1.8, downMult: 1.6, expMult: 0.5, rampMult: 1.4, color: "#EF4444", label: "Bear" },
} as const;

export function runScenario(
  inputs: ForecastInputs,
  scenario: keyof typeof SCENARIOS,
  horizonMonths: number = 36,
): ScenarioResult {
  const s = SCENARIOS[scenario];
  const adjusted: ForecastInputs = {
    ...inputs,
    monthlyGrowthRate: inputs.monthlyGrowthRate * s.growthMult,
    monthlyGrossChurnRate: inputs.monthlyGrossChurnRate * s.churnMult,
    monthlyDowngradeRate: inputs.monthlyDowngradeRate * s.downMult,
    monthlyExpansionRate: inputs.monthlyExpansionRate * s.expMult,
    hiringLagDays: inputs.hiringLagDays * s.rampMult,
  };
  const months = simulate(adjusted, horizonMonths);
  const last = months[months.length - 1];
  return {
    name: scenario,
    color: s.color,
    months,
    endingMRR: last.mrr,
    endingARR: last.arr,
    horizonMonths,
  };
}

export interface WaterfallData {
  startingARR: number;
  grossChurn: number;
  downgrades: number;
  expansion: number;
  newBusiness: number;
  endingARR: number;
  nrr: number;
}

export function buildWaterfall(baseMonths: MonthlyData[]): WaterfallData {
  const startIdx = 24;
  const endIdx = 36;
  const startMRR = baseMonths[startIdx].mrr;
  const endMRR = baseMonths[endIdx].mrr;
  const startingARR = startMRR * 12;
  const endingARR = endMRR * 12;

  let totalGross = 0, totalDown = 0, totalExp = 0, totalNew = 0;
  for (let t = startIdx + 1; t <= endIdx; t++) {
    totalGross += baseMonths[t].grossChurnLoss;
    totalDown += baseMonths[t].downgradeLoss;
    totalExp += baseMonths[t].expansionGain;
    totalNew += baseMonths[t].newBookings;
  }
  // Annualize the 12-month flow values (sum is already 12 months of MRR-flow → multiply by 1, but to express as ARR-equivalent contribution use *12-equivalent already covered by summing 12 months of MRR change? Use *12 to convert MRR-flow-sum to ARR contribution comparable to startingARR scale)
  const grossChurn = totalGross * 12 / 12 * 12; // = totalGross * 12 (flows accumulated → ARR scale)
  const downgrades = totalDown * 12;
  const expansion = totalExp * 12;
  const newBusiness = totalNew * 12;
  const nrr = ((startingARR - grossChurn - downgrades + expansion) / startingARR) * 100;
  return { startingARR, grossChurn, downgrades, expansion, newBusiness, endingARR, nrr };
}

export function requiredMonthlyGrowth(
  startingMRR: number,
  targetIrr: number,
  yearsToExit: number,
  raise: number,
  dilutionPct: number,
  revenueMultiple: number,
): number {
  const ownership = dilutionPct / 100;
  if (ownership <= 0 || revenueMultiple <= 0 || startingMRR <= 0 || yearsToExit <= 0) return 0;
  const requiredExit = (raise * Math.pow(1 + targetIrr / 100, yearsToExit)) / ownership;
  const requiredMRRatExit = (requiredExit / revenueMultiple) / 12;
  const months = yearsToExit * 12;
  if (requiredMRRatExit <= 0) return 0;
  return (Math.pow(requiredMRRatExit / startingMRR, 1 / months) - 1) * 100;
}

export function buildMatrix(inputs: ForecastInputs, horizonMonths: number = 36) {
  const nrrRows = [80, 85, 90, 95, 100, 105, 110, 115, 120];
  const growCols = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const values: number[][] = [];
  let min = Infinity, max = -Infinity;

  // Preserve user's mix of gross/downgrade/expansion; scale to hit target annual NRR.
  const baseGross = inputs.monthlyGrossChurnRate;
  const baseDown = inputs.monthlyDowngradeRate;
  const baseExp = inputs.monthlyExpansionRate;

  for (const nrr of nrrRows) {
    const targetMonthlyFactor = Math.pow(nrr / 100, 1 / 12);
    // We want: 1 - gross - down + exp = targetMonthlyFactor
    // Keep ratios: gross = k*baseGross, down = k*baseDown, exp = k*baseExp doesn't preserve sign net.
    // Solve net delta scale: let net = -baseGross - baseDown + baseExp (in percent points / 100 not yet).
    // Use percent points
    const baseNet = -baseGross - baseDown + baseExp; // % per month
    const targetNet = (targetMonthlyFactor - 1) * 100; // % per month
    const scale = baseNet === 0 ? 1 : targetNet / baseNet;
    const row: number[] = [];
    for (const g of growCols) {
      const months = simulate({
        ...inputs,
        monthlyGrowthRate: g,
        monthlyGrossChurnRate: baseGross * scale,
        monthlyDowngradeRate: baseDown * scale,
        monthlyExpansionRate: baseExp * scale,
      }, horizonMonths);
      const v = months[horizonMonths].mrr;
      row.push(v);
      if (v < min) min = v;
      if (v > max) max = v;
    }
    values.push(row);
  }
  return { nrrRows, growCols, values, min, max, horizonMonths };
}
