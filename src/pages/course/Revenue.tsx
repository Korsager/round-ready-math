import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, AlertTriangle, X } from "lucide-react";
import CourseLayout from "@/components/course/CourseLayout";
import AssumptionRow from "@/components/assumptions/AssumptionRow";
import StatCards from "@/components/forecast/StatCards";
import ForecastChart from "@/components/forecast/ForecastChart";
import MatrixChart from "@/components/forecast/MatrixChart";
import { Button } from "@/components/ui/button";
import { useAssumptions } from "@/lib/assumptions";
import { runScenario, deriveAnnualNRR, type ForecastInputs } from "@/lib/forecast";
import { DEFAULT_INPUTS } from "@/lib/presets";
import { deriveRevenueFromPricing, loadPricingStrategy } from "@/lib/pricingStrategy";

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};
const fmtPct = (digits = 1) => (v: number) => `${v.toFixed(digits)}%`;
const fmtNum = (suffix = "") => (v: number) => `${v.toLocaleString("en-US")}${suffix}`;

export default function CourseRevenue() {
  const { assumptions, setForecast, seedForecast, clearForecastEditedFlag } = useAssumptions();
  const { forecast, forecastManuallyEdited } = assumptions;

  // Recompute pricing-derived numbers on every render (cheap; reads localStorage once).
  const [pricing] = useState(() => loadPricingStrategy());
  const derivedFromPricing = useMemo(() => deriveRevenueFromPricing(pricing), [pricing]);
  const tierCount = derivedFromPricing.perTier.filter((t) => t.mrrContribution > 0).length;

  // Fallback seed on first mount: if forecast is untouched defaults AND pricing yields a value, seed.
  const seededOnceRef = useRef(false);
  useEffect(() => {
    if (seededOnceRef.current) return;
    seededOnceRef.current = true;
    const isUntouched =
      !forecastManuallyEdited &&
      forecast.startingMRR === DEFAULT_INPUTS.startingMRR &&
      forecast.monthlyNewBookings === DEFAULT_INPUTS.monthlyNewBookings;
    if (isUntouched && derivedFromPricing.startingMRR > 0) {
      seedForecast({
        ...forecast,
        startingMRR: derivedFromPricing.startingMRR,
        monthlyNewBookings: derivedFromPricing.monthlyNewBookings,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isStale =
    forecastManuallyEdited &&
    derivedFromPricing.startingMRR > 0 &&
    Math.abs(derivedFromPricing.startingMRR - forecast.startingMRR) > 1;
  const isFreshSeed =
    !forecastManuallyEdited &&
    derivedFromPricing.startingMRR > 0 &&
    Math.abs(derivedFromPricing.startingMRR - forecast.startingMRR) <= 1;

  const reseed = () => {
    seedForecast({
      ...forecast,
      startingMRR: derivedFromPricing.startingMRR,
      monthlyNewBookings: derivedFromPricing.monthlyNewBookings,
    });
    clearForecastEditedFlag();
    setBannerDismissed(false);
  };

  const { bull, base, bear } = useMemo(() => ({
    bull: runScenario(forecast, "bull"),
    base: runScenario(forecast, "base"),
    bear: runScenario(forecast, "bear"),
  }), [forecast]);

  const nrr = useMemo(() => deriveAnnualNRR(forecast), [forecast]);
  const forecastRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const onCellClick = (nrrTarget: number, growth: number) => {
    setForecast((p: ForecastInputs) => {
      const baseNet = -p.monthlyGrossChurnRate - p.monthlyDowngradeRate + p.monthlyExpansionRate;
      const targetMonthlyFactor = Math.pow(nrrTarget / 100, 1 / 12);
      const targetNet = (targetMonthlyFactor - 1) * 100;
      const scale = baseNet === 0 ? 1 : targetNet / baseNet;
      return {
        ...p,
        monthlyGrowthRate: growth,
        monthlyGrossChurnRate: p.monthlyGrossChurnRate * scale,
        monthlyDowngradeRate: p.monthlyDowngradeRate * scale,
        monthlyExpansionRate: p.monthlyExpansionRate * scale,
      };
    });
  };

  return (
    <CourseLayout
      step="revenue"
      title="2. Revenue forecast"
      intro="Project 36 months of MRR across bull, base, and bear scenarios. These numbers are the ones every investor will check."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 lg:sticky lg:top-32 self-start">
          <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Inputs</h2>
          <p className="text-[11px] text-[#9CA3AF] mb-2">Edit any value — charts update live.</p>
          <AssumptionRow label="Starting MRR" value={forecast.startingMRR} format={fmtUsd} onChange={(v) => setForecast({ ...forecast, startingMRR: v })} />
          <AssumptionRow label="Monthly new bookings" value={forecast.monthlyNewBookings} format={fmtUsd} onChange={(v) => setForecast({ ...forecast, monthlyNewBookings: v })} />
          <AssumptionRow label="Growth rate" value={forecast.monthlyGrowthRate} format={fmtPct(1)} onChange={(v) => setForecast({ ...forecast, monthlyGrowthRate: v })} />
          <AssumptionRow label="Gross churn" value={forecast.monthlyGrossChurnRate} format={fmtPct(2)} onChange={(v) => setForecast({ ...forecast, monthlyGrossChurnRate: v })} />
          <AssumptionRow label="Downgrades" value={forecast.monthlyDowngradeRate} format={fmtPct(2)} onChange={(v) => setForecast({ ...forecast, monthlyDowngradeRate: v })} />
          <AssumptionRow label="Expansion" value={forecast.monthlyExpansionRate} format={fmtPct(2)} onChange={(v) => setForecast({ ...forecast, monthlyExpansionRate: v })} />
          <AssumptionRow label="Hiring ramp" value={forecast.hiringLagDays} format={fmtNum(" days")} onChange={(v) => setForecast({ ...forecast, hiringLagDays: v })} />
          <AssumptionRow label="Annual NRR" value={nrr} format={fmtPct(1)} derived />
        </section>

        <div className="space-y-4 min-w-0">
          {!bannerDismissed && isFreshSeed && (
            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
              <div className="flex-1 text-[13px] text-foreground">
                <strong>Seeded from your pricing:</strong> {fmtUsd(derivedFromPricing.startingMRR)} MRR across {tierCount} tier{tierCount === 1 ? "" : "s"}. Edit below if your actuals differ.
              </div>
              <button onClick={() => setBannerDismissed(true)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
          )}
          {!bannerDismissed && isStale && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-[13px] text-amber-900">
                Your pricing now implies <strong>{fmtUsd(derivedFromPricing.startingMRR)} MRR</strong> but you're using <strong>{fmtUsd(forecast.startingMRR)}</strong>.
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={reseed}>Re-seed from pricing</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[12px]" onClick={() => setBannerDismissed(true)}>Keep my numbers</Button>
                </div>
              </div>
              <button onClick={() => setBannerDismissed(true)} aria-label="Dismiss" className="text-amber-700 hover:text-amber-900">
                <X size={14} />
              </button>
            </div>
          )}

          <StatCards startingMRR={forecast.startingMRR} bull={bull} base={base} bear={bear} />
          <ForecastChart ref={forecastRef} bull={bull} base={base} bear={bear} startingMRR={forecast.startingMRR} />
          <MatrixChart ref={matrixRef} inputs={forecast} onCellClick={onCellClick} />
        </div>
      </div>
    </CourseLayout>
  );
}
