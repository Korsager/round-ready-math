export interface ForecastInputs {
  startingMRR: number;
  monthlyNewBookings: number;
  monthlyGrowthRate: number; // percent
  annualNRR: number; // percent
  hiringLagDays: number;
}

export interface MonthlyData {
  month: number;
  mrr: number;
  arr: number;
  retainedMRR: number;
  newBookings: number;
  churnLoss: number;
  expansionGain: number;
}

export interface ScenarioResult {
  name: "bull" | "base" | "bear";
  color: string;
  months: MonthlyData[];
  endingMRR: number;
  endingARR: number;
}

export function simulate(inputs: ForecastInputs, horizonMonths = 36): MonthlyData[] {
  const { startingMRR, monthlyNewBookings, monthlyGrowthRate, annualNRR, hiringLagDays } = inputs;
  const g = monthlyGrowthRate / 100;
  const monthlyNrrFactor = Math.pow(annualNRR / 100, 1 / 12);
  const rampMonths = Math.max(hiringLagDays / 30, 0.01);

  const months: MonthlyData[] = [
    {
      month: 0,
      mrr: startingMRR,
      arr: startingMRR * 12,
      retainedMRR: startingMRR,
      newBookings: 0,
      churnLoss: 0,
      expansionGain: 0,
    },
  ];

  let prevBookings = monthlyNewBookings;
  for (let t = 1; t <= horizonMonths; t++) {
    const rampCompletion = Math.min(1, t / rampMonths);
    const prev = months[t - 1].mrr;
    const retainedMRR = prev * monthlyNrrFactor;
    const churnLoss = Math.max(0, prev - retainedMRR);
    const expansionGain = Math.max(0, retainedMRR - prev);
    const newBookings = prevBookings * (1 + g) * rampCompletion;
    prevBookings = prevBookings * (1 + g);
    const mrr = retainedMRR + newBookings;
    months.push({
      month: t,
      mrr,
      arr: mrr * 12,
      retainedMRR,
      newBookings,
      churnLoss,
      expansionGain,
    });
  }
  return months;
}

export const SCENARIOS = {
  bull: { growthMult: 1.5, nrrAdd: 10, rampMult: 0.7, color: "#0A9E5E", label: "Bull" },
  base: { growthMult: 1.0, nrrAdd: 0, rampMult: 1.0, color: "#6366F1", label: "Base" },
  bear: { growthMult: 0.5, nrrAdd: -15, rampMult: 1.4, color: "#EF4444", label: "Bear" },
} as const;

export function runScenario(inputs: ForecastInputs, scenario: keyof typeof SCENARIOS): ScenarioResult {
  const s = SCENARIOS[scenario];
  const adjusted: ForecastInputs = {
    ...inputs,
    monthlyGrowthRate: inputs.monthlyGrowthRate * s.growthMult,
    annualNRR: inputs.annualNRR + s.nrrAdd,
    hiringLagDays: inputs.hiringLagDays * s.rampMult,
  };
  const months = simulate(adjusted, 36);
  return {
    name: scenario,
    color: s.color,
    months,
    endingMRR: months[36].mrr,
    endingARR: months[36].arr,
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

  let totalChurnLoss = 0;
  let totalNewBookings = 0;
  for (let t = startIdx + 1; t <= endIdx; t++) {
    totalChurnLoss += baseMonths[t].churnLoss;
    totalNewBookings += baseMonths[t].newBookings;
  }
  const churnImpact = totalChurnLoss * 12;
  const grossChurn = churnImpact * 0.7;
  const downgrades = churnImpact * 0.3;
  const newBusiness = totalNewBookings * 12;

  const expansion = Math.max(0, endingARR - startingARR + grossChurn + downgrades - newBusiness);
  const nrr = ((startingARR - grossChurn - downgrades + expansion) / startingARR) * 100;
  return { startingARR, grossChurn, downgrades, expansion, newBusiness, endingARR, nrr };
}

export function buildMatrix(inputs: ForecastInputs): {
  nrrRows: number[];
  growCols: number[];
  values: number[][];
  min: number;
  max: number;
} {
  const nrrRows = [80, 85, 90, 95, 100, 105, 110, 115, 120];
  const growCols = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const values: number[][] = [];
  let min = Infinity;
  let max = -Infinity;
  for (const nrr of nrrRows) {
    const row: number[] = [];
    for (const g of growCols) {
      const months = simulate({ ...inputs, annualNRR: nrr, monthlyGrowthRate: g }, 36);
      const v = months[36].mrr;
      row.push(v);
      if (v < min) min = v;
      if (v > max) max = v;
    }
    values.push(row);
  }
  return { nrrRows, growCols, values, min, max };
}
