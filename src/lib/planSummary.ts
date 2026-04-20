import type { Assumptions } from "./assumptions";
import { runScenario, requiredMonthlyGrowth } from "./forecast";
import { simulateCashflow, type CashflowInputs, type CashflowResult } from "./cashflow";
import { computeImpliedIrr } from "./impliedIrr";

export type Verdict = "green" | "amber" | "red";

export interface PlanSummary {
  runwayMonth: number | null;
  monthsUntilRaise: number;
  bufferBeforeZero: number | null;
  monthsRunwayAfterRaise: number | null;
  nextRoundMonth: number | null;
  startingMRR: number;
  endingMRR: number;
  endingARR: number;
  horizonMonths: number;
  mrrMultiple: number;
  requiredMonthlyGrowth: number;
  actualMonthlyGrowth: number;
  requiredARR: number;
  impliedExitValue: number;
  impliedIrr: number;
  targetIrr: number;
  revenueMultiple: number;
  raise: number;
  yearsToExit: number;
  requiredExit: number;
  postMoney: number;
  valuationPerRunwayMonth: number | null;
  dilutionPerRunwayMonth: number | null;
  cfBase: CashflowResult;
  cfBull: CashflowResult;
  cfBear: CashflowResult;
  bearRunwayMonth: number | null;
  verdict: Verdict;
  verdictSentence: string;
  planSentence: string;
}

export const fmtPlanMoney = (v: number): string => {
  const n = Math.round(v);
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString("en-US")}`;
};

export function computePlanSummary(a: Assumptions): PlanSummary {
  const f = a.fundraise;
  const c = a.cashflow;
  const horizonMonths = Math.max(12, Math.round(f.yearsToExit * 12));

  const baseInputs: CashflowInputs = {
    ...c,
    fundraiseAmount: f.raise,
    forecast: a.forecast,
  };
  const cfBase = simulateCashflow(baseInputs, horizonMonths);
  const cfBull = simulateCashflow(
    { ...baseInputs, forecast: { ...a.forecast, monthlyGrowthRate: a.forecast.monthlyGrowthRate * 1.5 } },
    horizonMonths,
  );
  const cfBear = simulateCashflow(
    { ...baseInputs, forecast: { ...a.forecast, monthlyGrowthRate: a.forecast.monthlyGrowthRate * 0.5 } },
    horizonMonths,
  );
  // Pre-compute scenarios so callers can reuse them if they want consistent forecast scenarios.
  void runScenario(a.forecast, "bull", horizonMonths);
  void runScenario(a.forecast, "bear", horizonMonths);

  const bearRunwayMonth = cfBear.runwayMonth;

  const startingMRR = a.forecast.startingMRR;
  const endingMRR = cfBase.months[cfBase.months.length - 1]?.revenue ?? 0;
  const endingARR = endingMRR * 12;
  const mrrMultiple = startingMRR > 0 ? endingMRR / startingMRR : 0;

  const reqGrowth = requiredMonthlyGrowth(
    startingMRR,
    f.targetIrr,
    f.yearsToExit,
    f.raise,
    f.dilutionPct,
    f.revenueMultiple,
  );
  const ownership = f.dilutionPct / 100;
  const requiredExit = ownership > 0 ? (f.raise * Math.pow(1 + f.targetIrr / 100, f.yearsToExit)) / ownership : 0;
  const requiredARR = f.revenueMultiple > 0 ? requiredExit / f.revenueMultiple : 0;

  const implied = computeImpliedIrr(a);
  const impliedIrr = implied.impliedIrrPct;
  const impliedExitValue = implied.impliedExitValue;

  const bufferBeforeZero = cfBase.runwayMonth !== null ? cfBase.runwayMonth - c.monthsUntilRaise : null;

  let verdict: Verdict;
  let verdictSentence: string;
  if (impliedIrr >= f.targetIrr) {
    verdict = "green";
    const bearMo = bearRunwayMonth ?? horizonMonths;
    const raiseBy = Math.max(1, bearMo - 2);
    verdictSentence = `Plan clears the target. Implied IRR ${impliedIrr.toFixed(1)}% beats the ${f.targetIrr}% bar. Bear case: ${bearMo} mo runway, raise by mo ${raiseBy}.`;
  } else if (impliedIrr >= f.targetIrr * 0.7) {
    verdict = "amber";
    verdictSentence = `Plan is tight. You need growth at ${reqGrowth.toFixed(2)}%/mo — you're planning for ${a.forecast.monthlyGrowthRate.toFixed(2)}%/mo.`;
  } else {
    verdict = "red";
    verdictSentence = `Forecast doesn't support the round. Required exit ${fmtPlanMoney(requiredExit)}, forecast implies ${fmtPlanMoney(impliedExitValue)}. Raise less, dilute more, or revise growth.`;
  }

  const runwayLabel = cfBase.runwayMonth !== null ? `${cfBase.runwayMonth}` : `${horizonMonths}+`;
  const planSentence = `You have ${runwayLabel} months of runway, will need to raise ${fmtPlanMoney(f.raise)} in month ${c.monthsUntilRaise}, and must grow from ${fmtPlanMoney(startingMRR)} to ${fmtPlanMoney(endingMRR)} MRR by year ${f.yearsToExit} to hit investors' ${f.targetIrr}% IRR target.`;

  return {
    runwayMonth: cfBase.runwayMonth,
    monthsUntilRaise: c.monthsUntilRaise,
    bufferBeforeZero,
    monthsRunwayAfterRaise: cfBase.monthsRunwayAfterRaise,
    nextRoundMonth: c.monthsUntilRaise,
    startingMRR,
    endingMRR,
    endingARR,
    horizonMonths,
    mrrMultiple,
    requiredMonthlyGrowth: reqGrowth,
    actualMonthlyGrowth: a.forecast.monthlyGrowthRate,
    requiredARR,
    impliedExitValue,
    impliedIrr,
    targetIrr: f.targetIrr,
    revenueMultiple: f.revenueMultiple,
    raise: f.raise,
    yearsToExit: f.yearsToExit,
    requiredExit,
    cfBase,
    cfBull,
    cfBear,
    bearRunwayMonth,
    verdict,
    verdictSentence,
    planSentence,
  };
}
