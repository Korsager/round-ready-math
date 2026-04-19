import type { CashflowResult } from "@/lib/cashflow";
import { fmtDollars } from "@/lib/format";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  result: CashflowResult;
  monthsUntilRaise: number;
}

function runwayLabel(result: CashflowResult): { value: string; tone: "good" | "warn" | "bad" } {
  if (result.runwayMonth === null) return { value: "36+ mo", tone: "good" };
  if (result.runwayMonth >= 18) return { value: `${result.runwayMonth} mo`, tone: "good" };
  if (result.runwayMonth >= 9) return { value: `${result.runwayMonth} mo`, tone: "warn" };
  return { value: `${result.runwayMonth} mo`, tone: "bad" };
}

const toneStyles = {
  good: { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
  warn: { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
  bad: { bg: "#FEE2E2", text: "#991B1B", border: "#EF4444" },
};

export default function RunwayCards({ result, monthsUntilRaise }: Props) {
  const runway = runwayLabel(result);
  const cashAtRaise = result.months[Math.min(monthsUntilRaise, result.months.length - 1)]?.cashBalance ?? 0;
  const outBeforeRaise = result.runwayMonth !== null && result.runwayMonth < monthsUntilRaise;

  let verdictIcon = <CheckCircle2 size={20} className="text-[#10B981]" />;
  let verdictText = "Default-alive within 36 months — fundable trajectory";
  let verdictTone: "good" | "warn" | "bad" = "good";

  if (outBeforeRaise) {
    verdictIcon = <XCircle size={20} className="text-[#EF4444]" />;
    verdictText = `You run out of cash in month ${result.runwayMonth} — before your raise closes (month ${monthsUntilRaise}). Cut burn or raise sooner.`;
    verdictTone = "bad";
  } else if (result.runwayMonth !== null && result.runwayMonth < 18) {
    verdictIcon = <AlertTriangle size={20} className="text-[#F59E0B]" />;
    verdictText = `You run out of cash in month ${result.runwayMonth}. Less than 18 months of runway — investors will push back.`;
    verdictTone = "warn";
  } else if (result.defaultAliveMonth !== null) {
    verdictText = `You reach default-alive in month ${result.defaultAliveMonth} — strong fundraising position.`;
  } else if (result.runwayMonth === null) {
    verdictText = "Cash lasts 36+ months but you don't reach profitability — plan another raise.";
    verdictTone = "warn";
    verdictIcon = <AlertTriangle size={20} className="text-[#F59E0B]" />;
  }

  const cards = [
    { label: "Runway", value: runway.value, sub: result.runwayMonth === null ? "Never runs out" : `Out of cash month ${result.runwayMonth}`, tone: runway.tone },
    { label: "Cash at month 36", value: fmtDollars(result.endingCash), sub: result.endingCash > 0 ? "Positive position" : "Underwater", tone: result.endingCash > 0 ? ("good" as const) : ("bad" as const) },
    { label: "Default-alive", value: result.defaultAliveMonth ? `Month ${result.defaultAliveMonth}` : "Not reached", sub: result.defaultAliveMonth ? "Gross profit ≥ OpEx" : "Within 36 months", tone: result.defaultAliveMonth ? ("good" as const) : ("warn" as const) },
  ];

  const v = toneStyles[verdictTone];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => {
          const s = toneStyles[c.tone];
          return (
            <div key={c.label} className="rounded-xl border p-5" style={{ background: s.bg, borderColor: s.border }}>
              <div className="text-[12px] font-medium uppercase tracking-wider" style={{ color: s.text }}>{c.label}</div>
              <div className="text-[28px] font-bold mt-1 tabular-nums" style={{ color: s.text }}>{c.value}</div>
              <div className="text-[12px] mt-1" style={{ color: s.text }}>{c.sub}</div>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border-l-4 p-4 flex items-start gap-3" style={{ background: v.bg, borderColor: v.border }}>
        {verdictIcon}
        <div className="text-[14px] font-medium" style={{ color: v.text }}>{verdictText}</div>
      </div>
    </div>
  );
}
