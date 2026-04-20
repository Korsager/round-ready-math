import jsPDF from "jspdf";
import type { Assumptions } from "./assumptions";
import { simulateCashflow } from "./cashflow";
import { runScenario } from "./forecast";
import { loadPricingStrategy, type PricingStrategy } from "./pricingStrategy";
import { computeImpliedIrr } from "./impliedIrr";

const fmtM = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;
const fmtUsd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

export interface ExportCharts {
  forecastImg?: string;
  cashflowImg?: string;
}

export function exportPdf(a: Assumptions, pricingArg?: PricingStrategy, charts?: ExportCharts) {
  const pricing = pricingArg ?? loadPricingStrategy();
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
  const implied = computeImpliedIrr(a);

  const base = runScenario(a.forecast, "base");
  const cf = simulateCashflow({ ...a.cashflow, fundraiseAmount: a.fundraise.raise, forecast: a.forecast }, 36);

  const ensureRoom = (need: number) => {
    if (y + need > 740) { doc.addPage(); y = M; }
  };
  const title = (t: string) => {
    ensureRoom(40);
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(17, 24, 39);
    doc.text(t, M, y); y += 22;
    doc.setDrawColor(229, 231, 235); doc.line(M, y - 10, W - M, y - 10);
  };
  const row = (label: string, value: string) => {
    ensureRoom(18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(107, 114, 128);
    doc.text(label, M, y);
    doc.setFont("helvetica", "bold"); doc.setTextColor(17, 24, 39);
    doc.text(value, W - M, y, { align: "right" });
    y += 16;
  };
  const para = (t: string) => {
    if (!t) return;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(75, 85, 99);
    const lines = doc.splitTextToSize(t, W - M * 2);
    ensureRoom(lines.length * 13 + 6);
    doc.text(lines, M, y); y += lines.length * 13 + 6;
  };
  const subhead = (t: string) => {
    ensureRoom(20);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(17, 24, 39);
    doc.text(t, M, y); y += 14;
  };
  const labeledBlock = (label: string, value?: string) => {
    if (!value || !value.trim()) return;
    ensureRoom(28);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(107, 114, 128);
    doc.text(label.toUpperCase(), M, y); y += 12;
    para(value);
    y += 2;
  };

  // Cover
  doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(17, 24, 39);
  doc.text("Fundraise Plan", M, y); y += 32;
  doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(107, 114, 128);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, M, y); y += 30;

  para("This report covers your pricing, revenue forecast, fundraising math, and cashflow runway as configured in the Founders Toolkit.");
  y += 10;

  // Pricing strategy
  title("Pricing strategy");
  labeledBlock("Business model", pricing.context.businessModel);
  labeledBlock("Customer segments", pricing.context.segments);
  labeledBlock("Current pricing", pricing.context.currentPricing);
  labeledBlock("Value metric", pricing.valueMetric.name);
  labeledBlock("Why this metric", pricing.valueMetric.rationale);
  if (pricing.models.length) row("Pricing model(s)", pricing.models.join(", "));
  if (pricing.annualDiscountPct?.trim()) row("Annual discount", `${pricing.annualDiscountPct}%`);
  labeledBlock("Model notes", pricing.modelNotes);

  pricing.tiers.forEach((t) => {
    if (!t.name && !t.monthlyPrice && !t.features) return;
    ensureRoom(60);
    subhead(`Tier — ${t.name || "Untitled"}`);
    if (t.job?.trim()) row("Job to be done", t.job);
    if (t.monthlyPrice?.trim()) row("Monthly price", t.monthlyPrice);
    if (t.annualPrice?.trim()) row("Annual price", t.annualPrice);
    if ((t.customersMonth0 || 0) > 0 || (t.newCustomersPerMonth || 0) > 0) {
      row("Customers · new/mo", `${t.customersMonth0 || 0} customers · +${t.newCustomersPerMonth || 0}/mo`);
    }
    labeledBlock("Features", t.features);
  });

  labeledBlock("Anchoring notes", pricing.anchoringNotes);
  labeledBlock("Upgrade triggers", pricing.upgradeTriggers);
  y += 6;

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
  row("Calculated IRR (MOIC-implied)", `${calcIrr.toFixed(1)}%`);
  row("Forecast-implied IRR", `${implied.impliedIrrPct.toFixed(1)}% (${implied.basis === "revenue" ? `${a.fundraise.revenueMultiple}× ARR` : "ownership-based"})`);
  row("Year-N ARR (projected)", fmtUsd(implied.arrAtExit));
  row("Implied exit value", fmtM(implied.impliedExitValue));
  y += 6;
  if (implied.impliedIrrPct >= a.fundraise.targetIrr) {
    para(`Verdict: Aligned. Your forecast supports ${implied.impliedIrrPct.toFixed(1)}% IRR, above the ${a.fundraise.targetIrr}% investors require.`);
  } else if (calcIrr >= a.fundraise.targetIrr) {
    para(`Verdict: Gap. Your ${a.fundraise.targetMoic}× MOIC claim implies ${calcIrr.toFixed(1)}% IRR, but your forecast only supports ${implied.impliedIrrPct.toFixed(1)}%. Investors will ask what drives the difference.`);
  } else {
    para(`Verdict: Below target. Both MOIC-claimed (${calcIrr.toFixed(1)}%) and forecast-implied (${implied.impliedIrrPct.toFixed(1)}%) IRR fall under the ${a.fundraise.targetIrr}% target.`);
  }
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

  // Forecast chart
  if (charts?.forecastImg) {
    const props = doc.getImageProperties(charts.forecastImg);
    const imgW = W - M * 2;
    const imgH = (props.height * imgW) / props.width;
    if (y + imgH > 740) { doc.addPage(); y = M; }
    doc.addImage(charts.forecastImg, "PNG", M, y, imgW, imgH, undefined, "FAST");
    y += imgH + 12;
  }

  // Cashflow
  title("Cashflow & runway");
  row("Starting cash", fmtUsd(a.cashflow.startingCash));
  row("Starting OpEx", `${fmtUsd(a.cashflow.startingBurn)}/mo`);
  row("OpEx growth", `${a.cashflow.opexGrowthRate}%/mo`);
  row("Gross margin", `${a.cashflow.grossMargin}%`);
  row("Fundraise inflow", `${fmtM(a.fundraise.raise)} in mo ${a.cashflow.monthsUntilRaise}`);
  row("Runway hits zero", cf.runwayMonth ? `Month ${cf.runwayMonth}` : "Beyond 36 months");
  row("Runway after raise", cf.monthsRunwayAfterRaise === null ? "—" : `${cf.monthsRunwayAfterRaise} mo`);
  row("Break-even", cf.breakEvenMonth ? `Month ${cf.breakEvenMonth}` : "Not within 36 mo");
  row("Burn multiple (Y1)", isFinite(cf.burnMultiple) ? `${cf.burnMultiple.toFixed(1)}×` : "∞");
  y += 12;

  if (charts?.cashflowImg) {
    const props = doc.getImageProperties(charts.cashflowImg);
    const imgW = W - M * 2;
    const imgH = (props.height * imgW) / props.width;
    if (y + imgH > 740) { doc.addPage(); y = M; }
    doc.addImage(charts.cashflowImg, "PNG", M, y, imgW, imgH, undefined, "FAST");
    y += imgH + 12;
  }

  // Footer note
  doc.addPage(); y = M;
  title("Notes");
  para("All figures are illustrative and based on the assumptions you entered. Validate against benchmarks (SaaS Capital, OpenView, Bessemer State of the Cloud) before sharing with investors.");
  para("Export the JSON file from the toolkit to back up your full plan including pricing strategy, and re-import it any time to continue editing.");

  doc.save("fundraise-plan.pdf");
}
