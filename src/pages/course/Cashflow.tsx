import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Lock, Unlock } from "lucide-react";
import CourseLayout from "@/components/course/CourseLayout";
import AssumptionRow from "@/components/assumptions/AssumptionRow";
import CashflowChart from "@/components/cashflow/CashflowChart";
import RunwayCards from "@/components/cashflow/RunwayCards";
import CashflowTable from "@/components/cashflow/CashflowTable";
import PlanSummary from "@/components/cashflow/PlanSummary";
import { useAssumptions } from "@/lib/assumptions";
import { computePlanSummary } from "@/lib/planSummary";
import { derivedGrossMargin } from "@/lib/pricingStrategy";
import { simulateCashflow, type CashflowResult } from "@/lib/cashflow";
import { SCENARIOS } from "@/lib/forecast";

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};
const fmtPct = (d = 1) => (v: number) => `${v.toFixed(d)}%`;
const fmtNum = (s = "") => (v: number) => `${v.toLocaleString("en-US")}${s}`;

export default function CourseCashflow() {
  const { assumptions, setCashflow, setForecastOverrides, setPlanStartDate } = useAssumptions();
  const c = assumptions.cashflow;
  const fundraiseAmount = assumptions.fundraise.raise;
  const { forecastOverrides, pricing, planStartDate } = assumptions;
  const [showDetails, setShowDetails] = useState(false);

  const seedGM = useMemo(() => derivedGrossMargin(pricing), [pricing]);
  const hasPricingGM = seedGM > 0;

  // Auto-derive: when unlocked AND pricing implies a margin, push the derived
  // value into cashflow.grossMargin. Mirrors the Revenue page lock pattern.
  useEffect(() => {
    if (forecastOverrides.grossMarginLocked) return;
    if (!hasPricingGM) return;
    if (Math.abs(c.grossMargin - seedGM) > 0.05) {
      setCashflow({ ...c, grossMargin: seedGM });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedGM, forecastOverrides.grossMarginLocked, hasPricingGM]);

  const overrideGM = () => {
    setCashflow({ ...c, grossMargin: hasPricingGM ? seedGM : c.grossMargin });
    setForecastOverrides({ ...forecastOverrides, grossMarginLocked: true });
  };
  const resyncGM = () => {
    if (hasPricingGM) setCashflow({ ...c, grossMargin: seedGM });
    setForecastOverrides({ ...forecastOverrides, grossMarginLocked: false });
  };

  const summary = useMemo(() => computePlanSummary(assumptions), [assumptions]);
  const [scenario, setScenario] = useState<"bull" | "base" | "bear">("base");

  // Per-scenario cashflow uses the same multipliers as forecast scenarios so
  // the bull/base/bear runway numbers stay consistent with Revenue/Fundraising.
  const scenarioResults = useMemo(() => {
    const horizon = summary.horizonMonths;
    const run = (key: "bull" | "base" | "bear"): CashflowResult => {
      const s = SCENARIOS[key];
      const adjForecast = {
        ...assumptions.forecast,
        monthlyGrowthRate: assumptions.forecast.monthlyGrowthRate * s.growthMult,
        monthlyGrossChurnRate: assumptions.forecast.monthlyGrossChurnRate * s.churnMult,
        monthlyDowngradeRate: assumptions.forecast.monthlyDowngradeRate * s.downMult,
        monthlyExpansionRate: assumptions.forecast.monthlyExpansionRate * s.expMult,
        hiringLagDays: assumptions.forecast.hiringLagDays * s.rampMult,
      };
      return simulateCashflow({ ...c, fundraiseAmount, forecast: adjForecast }, horizon);
    };
    return { bull: run("bull"), base: summary.cfBase, bear: run("bear") };
  }, [assumptions.forecast, c, fundraiseAmount, summary.horizonMonths, summary.cfBase]);

  const result = scenarioResults[scenario];
  const gmLocked = forecastOverrides.grossMarginLocked || !hasPricingGM;

  const scenarioTabs: Array<{ key: "bull" | "base" | "bear"; label: string }> = [
    { key: "bull", label: "Bull" },
    { key: "base", label: "Base" },
    { key: "bear", label: "Bear" },
  ];
  const defaultAliveLabel = (r: CashflowResult) => r.defaultAliveMonth ? `mo ${r.defaultAliveMonth}` : "not reached";

  return (
    <CourseLayout
      step="cashflow"
      title="4. Cashflow & runway"
      intro="Your full plan in one view. Runway, the next raise, and the growth you need to hit the investor target."
    >
      <PlanSummary summary={summary} />

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="flex items-center gap-2 text-[13px] font-medium text-[#374151] hover:text-[#111827] py-2"
        >
          <ChevronDown size={16} className={`transition-transform ${showDetails ? "rotate-180" : ""}`} />
          {showDetails ? "Hide" : "Show"} detailed model
        </button>

        {showDetails && (
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
            <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 lg:sticky lg:top-32 self-start">
              <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Inputs</h2>
              <p className="text-[11px] text-[#9CA3AF] mb-2">Burn, runway & raise timing.</p>
              <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[#F3F4F6]">
                <div className="min-w-0">
                  <div className="text-[13px] text-[#111827]">Plan start month</div>
                  <div className="text-[11px] text-[#9CA3AF] mt-0.5 leading-snug">Anchors month 0 for runway, raise timing, and exports.</div>
                </div>
                <input
                  type="month"
                  value={planStartDate}
                  onChange={(e) => setPlanStartDate(e.target.value)}
                  className="h-7 text-[13px] tabular-nums border border-[#E5E7EB] hover:border-primary rounded-md px-2 outline-none focus:border-primary"
                />
              </div>
              <AssumptionRow label="Starting cash" value={c.startingCash} format={fmtUsd} onChange={(v) => setCashflow({ ...c, startingCash: v })} />
              <AssumptionRow label="Fundraise amount" value={fundraiseAmount} format={fmtUsd} derived description="Set on the Fundraising step" />
              <AssumptionRow label="Months until raise" value={c.monthsUntilRaise} format={fmtNum(" mo")} onChange={(v) => setCashflow({ ...c, monthsUntilRaise: v })} />
              <AssumptionRow label="Starting OpEx" value={c.startingBurn} format={fmtUsd} onChange={(v) => setCashflow({ ...c, startingBurn: v })} />
              <AssumptionRow label="OpEx growth" value={c.opexGrowthRate} format={fmtPct(1)} onChange={(v) => setCashflow({ ...c, opexGrowthRate: v })} />
              {gmLocked ? (
                <>
                  <AssumptionRow label="Gross margin" value={c.grossMargin} format={fmtPct(0)} onChange={(v) => setCashflow({ ...c, grossMargin: v })} />
                  {hasPricingGM && (
                    <CashflowLockToggle locked onClick={resyncGM} label="Manual override" actionLabel="Re-sync to pricing" />
                  )}
                </>
              ) : (
                <>
                  <AssumptionRow label="Gross margin" value={c.grossMargin} format={fmtPct(0)} derived description="Auto-derived from pricing tiers" />
                  <CashflowLockToggle locked={false} onClick={overrideGM} label="Auto from pricing" actionLabel="Override" />
                </>
              )}
            </section>

            <div className="space-y-4 min-w-0">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 rounded-md bg-secondary p-0.5">
                    {scenarioTabs.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setScenario(t.key)}
                        className={`text-[12px] font-medium px-3 py-1 rounded ${
                          scenario === t.key ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#111827]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">
                    Default-alive · bear: {defaultAliveLabel(scenarioResults.bear)} · base: {defaultAliveLabel(scenarioResults.base)} · bull: {defaultAliveLabel(scenarioResults.bull)}
                  </div>
                </div>
              </div>
              <RunwayCards result={result} monthsUntilRaise={c.monthsUntilRaise} planStartDate={planStartDate} />
              <CashflowChart result={result} monthsUntilRaise={c.monthsUntilRaise} planStartDate={planStartDate} />
              <CashflowTable result={result} />
            </div>
          </div>
        )}
      </div>
    </CourseLayout>
  );
}

function CashflowLockToggle({
  locked, onClick, label, actionLabel,
}: { locked: boolean; onClick: () => void; label: string; actionLabel: string }) {
  const Icon = locked ? Unlock : Lock;
  return (
    <div className="flex items-center justify-between gap-2 -mt-1 mb-1.5 pb-2 border-b border-[#F3F4F6]">
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon size={10} /> {label}
      </span>
      <button
        type="button"
        onClick={onClick}
        className="text-[10px] uppercase tracking-wide font-semibold text-primary hover:underline"
      >
        {actionLabel}
      </button>
    </div>
  );
}
