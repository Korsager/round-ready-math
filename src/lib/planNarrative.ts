import type { Assumptions } from "./assumptions";
import type { PlanSummary } from "./planSummary";
import { blendedARPU } from "./pricingStrategy";
import { fmtPlanMoney } from "./planSummary";

export type LinkStatus = "ok" | "warn" | "fail";

export interface NarrativeLink {
  title: string;
  sentence: string;
  status: LinkStatus;
  detail?: string;
}

export interface PlanNarrative {
  links: NarrativeLink[];
  openingSentence: string;
  closingSentence: string;
}

function lastMonthOpex(cfBase: PlanSummary["cfBase"]): number {
  const m = cfBase.months;
  return m.length ? m[m.length - 1].opex : 0;
}

const fmtNum = (n: number, digits = 1) =>
  n >= 100 ? Math.round(n).toString() : n.toFixed(digits);

export function computePlanNarrative(a: Assumptions, summary: PlanSummary): PlanNarrative {
  const links: NarrativeLink[] = [];
  const arpu = blendedARPU(a.pricing);

  // Link 1: Pricing → ARPU
  if (arpu > 0) {
    links.push({
      title: "Pricing → ARPU",
      sentence: `Your tiered pricing implies a blended ARPU of ${fmtPlanMoney(arpu)}/mo per customer.`,
      status: "ok",
      detail: `Weighted by target mix across ${a.pricing.tiers.filter((t) => t.monthlyPriceNum > 0).length} priced tier(s).`,
    });
  } else {
    links.push({
      title: "Pricing → ARPU",
      sentence: "Forecast runs without a pricing anchor — no tier has a numeric monthly price.",
      status: "warn",
      detail: "Set monthlyPriceNum on at least one tier to ground ARPU in your pricing.",
    });
  }

  // Link 2: ARPU → MRR growth
  if (arpu > 0) {
    const customersToday = a.forecast.startingMRR / arpu;
    const newCustomersPerMo = a.forecast.monthlyNewBookings / arpu;
    if (newCustomersPerMo > 0 && newCustomersPerMo < 1) {
      links.push({
        title: "ARPU → MRR growth",
        sentence: `New bookings of ${fmtPlanMoney(a.forecast.monthlyNewBookings)}/mo imply <1 customer/mo at your blended ARPU.`,
        status: "warn",
        detail: `Today: ~${fmtNum(customersToday)} customers · acquiring ~${fmtNum(newCustomersPerMo, 2)}/mo.`,
      });
    } else if (newCustomersPerMo > 100 && customersToday < 50) {
      links.push({
        title: "ARPU → MRR growth",
        sentence: `Sales velocity step-change required: jumping from ~${fmtNum(customersToday)} to +${fmtNum(newCustomersPerMo)} customers/mo.`,
        status: "warn",
        detail: "Plan the GTM motion that supports this acquisition rate.",
      });
    } else {
      links.push({
        title: "ARPU → MRR growth",
        sentence: `Acquiring ~${fmtNum(newCustomersPerMo)} new customers/mo grows MRR from ${fmtPlanMoney(summary.startingMRR)} to ${fmtPlanMoney(summary.endingMRR)} by yr ${summary.yearsToExit}.`,
        status: "ok",
        detail: `Customer base today ≈ ${fmtNum(customersToday)} at ${fmtPlanMoney(arpu)} ARPU.`,
      });
    }
  } else {
    links.push({
      title: "ARPU → MRR growth",
      sentence: `MRR grows from ${fmtPlanMoney(summary.startingMRR)} to ${fmtPlanMoney(summary.endingMRR)} by yr ${summary.yearsToExit}, but customer counts can't be checked without a priced ARPU.`,
      status: "warn",
    });
  }

  // Link 3: MRR growth → burn coverage
  const grossProfitAtExit = summary.endingMRR * (a.cashflow.grossMargin / 100);
  const burnAtExit = lastMonthOpex(summary.cfBase);
  if (grossProfitAtExit >= burnAtExit && burnAtExit > 0) {
    links.push({
      title: "MRR growth → burn coverage",
      sentence: `Self-funding by yr ${summary.yearsToExit}: gross profit (${fmtPlanMoney(grossProfitAtExit)}/mo) covers opex (${fmtPlanMoney(burnAtExit)}/mo).`,
      status: "ok",
    });
  } else {
    const gap = burnAtExit - grossProfitAtExit;
    links.push({
      title: "MRR growth → burn coverage",
      sentence: `Still burning ${fmtPlanMoney(gap)}/mo at yr ${summary.yearsToExit}: gross profit ${fmtPlanMoney(grossProfitAtExit)} vs opex ${fmtPlanMoney(burnAtExit)}.`,
      status: "warn",
      detail: "Either raise gross margin, slow opex growth, or accept a longer path to break-even.",
    });
  }

  // Link 4: Burn coverage → raise size
  const mra = summary.monthsRunwayAfterRaise;
  if (mra === null) {
    links.push({
      title: "Burn coverage → raise size",
      sentence: "Raise doesn't extend runway — cash is already at zero by raise month, or raise is zero.",
      status: "fail",
    });
  } else if (mra < 12) {
    links.push({
      title: "Burn coverage → raise size",
      sentence: `Raise covers only ${mra} months — under the 18-mo bridge most investors expect.`,
      status: "fail",
      detail: "Raise more, cut burn, or tighten the path to next milestone.",
    });
  } else if (mra < 18) {
    links.push({
      title: "Burn coverage → raise size",
      sentence: `Tight bridge: ${mra} months of runway after the round.`,
      status: "warn",
      detail: "Below the 18-mo norm. Plan the next raise early.",
    });
  } else {
    links.push({
      title: "Burn coverage → raise size",
      sentence: `Comfortable bridge: ${mra} months of runway after the round.`,
      status: "ok",
    });
  }

  // Link 5: Raise size → IRR
  if (summary.impliedIrr >= summary.targetIrr) {
    links.push({
      title: "Raise size → IRR",
      sentence: `Forecast supports ${summary.impliedIrr.toFixed(1)}% IRR, above the ${summary.targetIrr}% investors require.`,
      status: "ok",
    });
  } else if (summary.impliedIrr >= summary.targetIrr * 0.7) {
    links.push({
      title: "Raise size → IRR",
      sentence: `Gap: forecast implies ${summary.impliedIrr.toFixed(1)}% IRR vs the ${summary.targetIrr}% target.`,
      status: "warn",
      detail: `Required exit ${fmtPlanMoney(summary.requiredExit)}; you imply ${fmtPlanMoney(summary.impliedExitValue)}.`,
    });
  } else {
    links.push({
      title: "Raise size → IRR",
      sentence: `Below target: ${summary.impliedIrr.toFixed(1)}% IRR falls well under the ${summary.targetIrr}% bar.`,
      status: "fail",
      detail: "Raise less, dilute more, or revise the growth plan.",
    });
  }

  const okCount = links.filter((l) => l.status === "ok").length;
  const warnCount = links.filter((l) => l.status === "warn").length;
  const failCount = links.filter((l) => l.status === "fail").length;
  const weakest = links.find((l) => l.status === "fail") ?? links.find((l) => l.status === "warn");

  const openingSentence =
    "Here's how your plan chains together — each step's output is the next step's input.";

  const closingSentence = weakest
    ? `${okCount}/5 links aligned, ${warnCount} gap${warnCount === 1 ? "" : "s"}${failCount ? `, ${failCount} break${failCount === 1 ? "" : "s"}` : ""}. Weakest link: ${weakest.title}.`
    : `All 5 links aligned. Pricing, growth, burn, raise, and IRR all support each other.`;

  return { links, openingSentence, closingSentence };
}
