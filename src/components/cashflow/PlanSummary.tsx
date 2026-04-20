import type { PlanSummary } from "@/lib/planSummary";
import { fmtPlanMoney } from "@/lib/planSummary";

interface Props {
  summary: PlanSummary;
}

const verdictStyles: Record<PlanSummary["verdict"], { bar: string; text: string; label: string }> = {
  green: { bar: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "On track" },
  amber: { bar: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Tight" },
  red: { bar: "bg-red-50 border-red-200", text: "text-destructive", label: "Off track" },
};

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] p-3 sm:p-4">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-[20px] font-semibold tabular-nums text-[#111827] leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export default function PlanSummary({ summary: s }: Props) {
  const v = verdictStyles[s.verdict];
  const runwayLabel = s.runwayMonth !== null ? `${s.runwayMonth} mo` : `${s.horizonMonths}+ mo`;
  const afterRaiseLabel = s.monthsRunwayAfterRaise !== null ? `${s.monthsRunwayAfterRaise} mo` : "—";
  const runway = s.runwayMonth !== null ? `${s.runwayMonth}` : `${s.horizonMonths}+`;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6 shadow-sm">
        <p className="text-[17px] leading-[1.6] text-[#111827]">
          You have <strong className="font-semibold">{runway} months</strong> of runway, will need to raise{" "}
          <strong className="font-semibold tabular-nums">{fmtPlanMoney(s.raise)}</strong> in month{" "}
          <strong className="font-semibold tabular-nums">{s.monthsUntilRaise}</strong>, and must grow from{" "}
          <strong className="font-semibold tabular-nums">{fmtPlanMoney(s.startingMRR)}</strong> to{" "}
          <strong className="font-semibold tabular-nums">{fmtPlanMoney(s.endingMRR)}</strong> MRR by year{" "}
          <strong className="font-semibold tabular-nums">{s.yearsToExit}</strong> to hit investors'{" "}
          <strong className="font-semibold tabular-nums">{s.targetIrr}%</strong> IRR target.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard label="Runway today" value={runwayLabel} sub={s.runwayMonth !== null ? "until cash hits zero" : "through horizon"} />
        <MetricCard label="Raise by" value={`Month ${s.monthsUntilRaise}`} sub={s.bufferBeforeZero !== null ? `${Math.max(0, s.bufferBeforeZero)} mo buffer` : "comfortable"} />
        <MetricCard label="Runway after raise" value={afterRaiseLabel} sub={`${fmtPlanMoney(s.raise)} round`} />
        <MetricCard label={`MRR today → yr ${s.yearsToExit}`} value={`${fmtPlanMoney(s.startingMRR)} → ${fmtPlanMoney(s.endingMRR)}`} sub={`${s.mrrMultiple.toFixed(1)}× growth`} />
        <MetricCard label="Required growth" value={`${s.requiredMonthlyGrowth.toFixed(2)}%/mo`} sub={`you plan ${s.actualMonthlyGrowth.toFixed(2)}%/mo`} />
        <MetricCard label="Implied exit value" value={fmtPlanMoney(s.impliedExitValue)} sub={`at ${s.revenueMultiple}× ARR`} />
      </div>

      <div className={`rounded-xl border ${v.bar} p-4 sm:p-5 flex items-start justify-between gap-4`}>
        <div className="min-w-0">
          <div className={`text-[11px] uppercase tracking-wide font-semibold ${v.text} mb-1`}>{v.label}</div>
          <p className="text-[13px] text-[#111827] leading-relaxed">{s.verdictSentence}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Implied IRR</div>
          <div className={`text-[28px] font-semibold tabular-nums ${v.text}`}>{s.impliedIrr.toFixed(1)}%</div>
          <div className="text-[11px] text-muted-foreground">vs {s.targetIrr}% target</div>
        </div>
      </div>
    </div>
  );
}
