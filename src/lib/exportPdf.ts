import jsPDF from "jspdf";
import type { Assumptions } from "./assumptions";
import { simulateCashflow } from "./cashflow";
import { runScenario } from "./forecast";

const fmtM = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;
const fmtUsd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

export function exportPdf(a: Assumptions) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const M = 56;
  let y = M;

  const ownership = a.fundraise.dilutionPct / 100;
  const postMoney = ownership > 0 ? a.fundraise.raise / ownership : 0;
  const preMoney = postMoney - a.fundraise.raise;
  const reqReturn = a.fundraise.raise * Math.pow(1 + a.fundraise.targetIrr / 100, a.fundraise.yearsToExit);
  const reqExit = ownership > 0 ? reqReturn / ownership : 0;
  const calcIrr = a.fundraise.yearsToExit > 0 && a.fundraise.targetMoic > 0
    ? (Math.pow(a.fundraise.targetMoic, 1 / a.fundraise.yearsToExit) - 1) * 100 : 0;

  const base = runScenario(a.forecast, "base");
  const cf = simulateCashflow({ ...a.cashflow, forecast: a.forecast }, 36);

  const title = (t: string) => {
    if (y > 720) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(17, 24, 39);
    doc.text(t, M, y); y += 22;
    doc.setDrawColor(229, 231, 235); doc.line(M, y - 10, W - M, y - 10);
  };
  const row = (label: string, value: string) => {
    if (y > 740) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(107, 114, 128);
    doc.text(label, M, y);
    doc.setFont("helvetica", "bold"); doc.setTextColor(17, 24, 39);
    doc.text(value, W - M, y, { align: "right" });
    y += 16;
  };
  const para = (t: string) => {
    if (y > 720) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(75, 85, 99);
    const lines = doc.splitTextToSize(t, W - M * 2);
    doc.text(lines, M, y); y += lines.length * 13 + 6;
  };

  // Cover
  doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(17, 24, 39);
  doc.text("Fundraise Plan", M, y); y += 32;
  doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(107, 114, 128);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, M, y); y += 30;

  para("This report covers your pricing, revenue forecast, fundraising math, and cashflow runway as configured in the Founders Toolkit.");
  y += 10;

  // Fundraising
  title("Fundraising");
  row("Raise amount", fmtM(a.fundraise.raise));
  row("Dilution", `${a.fundraise.dilutionPct}%`);
  row("Pre-money", fmtM(preMoney));
  row("Post-money", fmtM(postMoney));
  row("Target IRR", `${a.fundraise.targetIrr}%`);
  row("Years to exit", `${a.fundraise.yearsToExit} yr`);
  row("Target MOIC", `${a.fundraise.targetMoic}×`);
  row("Required exit value", fmtM(reqExit));
  row("Calculated IRR", `${calcIrr.toFixed(1)}%`);
  y += 6;
  para(calcIrr >= a.fundraise.targetIrr
    ? `Verdict: Strong. Your ${a.fundraise.targetMoic}× MOIC beats the ${a.fundraise.targetIrr}% IRR target.`
    : `Verdict: Below target. IRR ${calcIrr.toFixed(1)}% vs ${a.fundraise.targetIrr}% target — aim for a higher exit or shorter timeline.`);
  y += 12;

  // Revenue
  title("Revenue forecast (base case)");
  row("Starting MRR", fmtUsd(a.forecast.startingMRR));
  row("Monthly new bookings", fmtUsd(a.forecast.monthlyNewBookings));
  row("Growth rate", `${a.forecast.monthlyGrowthRate}%/mo`);
  row("Gross churn", `${a.forecast.monthlyGrossChurnRate}%/mo`);
  row("Expansion", `${a.forecast.monthlyExpansionRate}%/mo`);
  row("Ending MRR (month 36)", fmtUsd(base.endingMRR));
  row("Ending ARR (month 36)", fmtUsd(base.endingARR));
  y += 12;

  // Cashflow
  title("Cashflow & runway");
  row("Starting cash", fmtUsd(a.cashflow.startingCash));
  row("Starting OpEx", `${fmtUsd(a.cashflow.startingBurn)}/mo`);
  row("OpEx growth", `${a.cashflow.opexGrowthRate}%/mo`);
  row("Gross margin", `${a.cashflow.grossMargin}%`);
  row("Fundraise inflow", `${fmtM(a.cashflow.fundraiseAmount)} in mo ${a.cashflow.monthsUntilRaise}`);
  row("Runway hits zero", cf.runwayMonth ? `Month ${cf.runwayMonth}` : "Beyond 36 months");
  row("Runway after raise", cf.monthsRunwayAfterRaise === null ? "—" : `${cf.monthsRunwayAfterRaise} mo`);
  row("Break-even", cf.breakEvenMonth ? `Month ${cf.breakEvenMonth}` : "Not within 36 mo");
  row("Burn multiple (Y1)", isFinite(cf.burnMultiple) ? `${cf.burnMultiple.toFixed(1)}×` : "∞");

  // Footer note
  doc.addPage(); y = M;
  title("Notes");
  para("All figures are illustrative and based on the assumptions you entered. Validate against benchmarks (SaaS Capital, OpenView, Bessemer State of the Cloud) before sharing with investors.");
  para("Pricing strategy details (value metric, tiers, model) live inside the Pricing step in the toolkit. Export the JSON file to back up your full plan.");

  doc.save("fundraise-plan.pdf");
}
