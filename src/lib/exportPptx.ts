import pptxgen from "pptxgenjs";
import type { Assumptions } from "./assumptions";
import { simulateCashflow } from "./cashflow";
import { runScenario } from "./forecast";

const fmtM = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;
const fmtUsd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

const NAVY = "1E2761";
const ICE = "CADCFC";
const ACCENT = "F96167";
const INK = "111827";
const MUTED = "6B7280";

export function exportPptx(a: Assumptions) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

  const ownership = a.fundraise.dilutionPct / 100;
  const postMoney = ownership > 0 ? a.fundraise.raise / ownership : 0;
  const preMoney = postMoney - a.fundraise.raise;
  const reqReturn = a.fundraise.raise * Math.pow(1 + a.fundraise.targetIrr / 100, a.fundraise.yearsToExit);
  const reqExit = ownership > 0 ? reqReturn / ownership : 0;
  const calcIrr = a.fundraise.yearsToExit > 0 && a.fundraise.targetMoic > 0
    ? (Math.pow(a.fundraise.targetMoic, 1 / a.fundraise.yearsToExit) - 1) * 100 : 0;
  const base = runScenario(a.forecast, "base");
  const cf = simulateCashflow({ ...a.cashflow, forecast: a.forecast }, 36);

  // Cover
  const cover = pres.addSlide();
  cover.background = { color: NAVY };
  cover.addText("Fundraise Plan", { x: 0.6, y: 2.6, w: 12, h: 1.0, fontSize: 54, bold: true, color: "FFFFFF", fontFace: "Calibri" });
  cover.addText("Pricing · Revenue · Fundraising · Cashflow", { x: 0.6, y: 3.7, w: 12, h: 0.5, fontSize: 20, color: ICE, fontFace: "Calibri" });
  cover.addText(new Date().toLocaleDateString(), { x: 0.6, y: 6.6, w: 12, h: 0.4, fontSize: 12, color: ICE });

  const sectionSlide = (kicker: string, title: string, stats: { label: string; value: string }[], note: string) => {
    const s = pres.addSlide();
    s.background = { color: "FFFFFF" };
    // Side bar
    s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.35, h: 7.5, fill: { color: NAVY } });
    s.addText(kicker.toUpperCase(), { x: 0.7, y: 0.5, w: 12, h: 0.35, fontSize: 12, bold: true, color: ACCENT, charSpacing: 4 });
    s.addText(title, { x: 0.7, y: 0.85, w: 12, h: 0.9, fontSize: 36, bold: true, color: INK, fontFace: "Calibri" });

    // Stats grid
    const startY = 2.2;
    const cardW = 2.85, cardH = 1.6, gap = 0.2;
    stats.slice(0, 4).forEach((stat, i) => {
      const x = 0.7 + i * (cardW + gap);
      s.addShape(pres.ShapeType.roundRect, { x, y: startY, w: cardW, h: cardH, fill: { color: "F3F4F6" }, line: { color: "E5E7EB" }, rectRadius: 0.1 });
      s.addText(stat.label, { x: x + 0.2, y: startY + 0.15, w: cardW - 0.4, h: 0.3, fontSize: 11, color: MUTED });
      s.addText(stat.value, { x: x + 0.2, y: startY + 0.5, w: cardW - 0.4, h: 0.9, fontSize: 26, bold: true, color: NAVY, fontFace: "Calibri" });
    });

    if (stats.length > 4) {
      stats.slice(4, 8).forEach((stat, i) => {
        const x = 0.7 + i * (cardW + gap);
        const y = startY + cardH + 0.25;
        s.addShape(pres.ShapeType.roundRect, { x, y, w: cardW, h: cardH, fill: { color: "F3F4F6" }, line: { color: "E5E7EB" }, rectRadius: 0.1 });
        s.addText(stat.label, { x: x + 0.2, y: y + 0.15, w: cardW - 0.4, h: 0.3, fontSize: 11, color: MUTED });
        s.addText(stat.value, { x: x + 0.2, y: y + 0.5, w: cardW - 0.4, h: 0.9, fontSize: 26, bold: true, color: NAVY, fontFace: "Calibri" });
      });
    }

    s.addText(note, { x: 0.7, y: 6.3, w: 12, h: 0.8, fontSize: 14, italic: true, color: MUTED, fontFace: "Calibri" });
  };

  sectionSlide("Step 1", "Pricing", [
    { label: "Annual discount", value: "—" },
    { label: "Tiers", value: "Starter · Pro · Enterprise" },
    { label: "Strategy", value: "Anchor high" },
    { label: "Reviewed", value: "Monthly" },
  ], "Pricing strategy is captured in the Pricing step. The full playbook lives in your JSON export.");

  sectionSlide("Step 2", "Revenue forecast", [
    { label: "Starting MRR", value: fmtUsd(a.forecast.startingMRR) },
    { label: "Growth", value: `${a.forecast.monthlyGrowthRate}%/mo` },
    { label: "Ending MRR (mo 36)", value: fmtUsd(base.endingMRR) },
    { label: "Ending ARR", value: fmtUsd(base.endingARR) },
  ], `Base case grows from ${fmtUsd(a.forecast.startingMRR)} to ${fmtUsd(base.endingMRR)} MRR over 36 months.`);

  sectionSlide("Step 3", "Fundraising", [
    { label: "Raise", value: fmtM(a.fundraise.raise) },
    { label: "Pre-money", value: fmtM(preMoney) },
    { label: "Post-money", value: fmtM(postMoney) },
    { label: "Dilution", value: `${a.fundraise.dilutionPct}%` },
    { label: "Target IRR", value: `${a.fundraise.targetIrr}%` },
    { label: "Years to exit", value: `${a.fundraise.yearsToExit}yr` },
    { label: "Required exit", value: fmtM(reqExit) },
    { label: "Calculated IRR", value: `${calcIrr.toFixed(1)}%` },
  ], calcIrr >= a.fundraise.targetIrr
    ? `Strong deal: ${a.fundraise.targetMoic}× MOIC beats the ${a.fundraise.targetIrr}% IRR target.`
    : `Below target: aim for a higher exit or shorter timeline.`);

  sectionSlide("Step 4", "Cashflow & runway", [
    { label: "Starting cash", value: fmtUsd(a.cashflow.startingCash) },
    { label: "Starting burn", value: `${fmtUsd(a.cashflow.startingBurn)}/mo` },
    { label: "Runway hits zero", value: cf.runwayMonth ? `Mo ${cf.runwayMonth}` : ">36 mo" },
    { label: "After raise", value: cf.monthsRunwayAfterRaise === null ? "—" : `${cf.monthsRunwayAfterRaise} mo` },
    { label: "Break-even", value: cf.breakEvenMonth ? `Mo ${cf.breakEvenMonth}` : "Not in 36 mo" },
    { label: "Burn multiple", value: isFinite(cf.burnMultiple) ? `${cf.burnMultiple.toFixed(1)}×` : "∞" },
    { label: "Raise size", value: fmtM(a.cashflow.fundraiseAmount) },
    { label: "Raise timing", value: `Mo ${a.cashflow.monthsUntilRaise}` },
  ], `Healthy burn multiple is < 2×. Above signals inefficient growth.`);

  // Summary
  const sum = pres.addSlide();
  sum.background = { color: NAVY };
  sum.addText("Summary", { x: 0.6, y: 0.5, w: 12, h: 0.6, fontSize: 14, bold: true, color: ACCENT, charSpacing: 4 });
  sum.addText(`Raising ${fmtM(a.fundraise.raise)} at ${fmtM(postMoney)} post-money`, {
    x: 0.6, y: 1.3, w: 12, h: 1.0, fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Calibri",
  });
  sum.addText([
    { text: "Plan to grow ", options: { color: ICE } },
    { text: `${fmtUsd(a.forecast.startingMRR)} → ${fmtUsd(base.endingMRR)} MRR`, options: { color: "FFFFFF", bold: true } },
    { text: ` in 36 months, with `, options: { color: ICE } },
    { text: cf.runwayMonth ? `${cf.runwayMonth} months runway` : "36+ months runway", options: { color: "FFFFFF", bold: true } },
    { text: ` and a ${calcIrr.toFixed(1)}% projected IRR.`, options: { color: ICE } },
  ], { x: 0.6, y: 3.0, w: 12, h: 1.5, fontSize: 18, fontFace: "Calibri" });
  sum.addText("Generated by the Founders Toolkit", { x: 0.6, y: 6.8, w: 12, h: 0.3, fontSize: 11, color: ICE, italic: true });

  pres.writeFile({ fileName: "fundraise-presentation.pptx" });
}
