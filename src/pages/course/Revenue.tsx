import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, AlertTriangle, X, Lock, Unlock } from "lucide-react";
import CourseLayout from "@/components/course/CourseLayout";
import AssumptionRow from "@/components/assumptions/AssumptionRow";
import StatCards from "@/components/forecast/StatCards";
import ForecastChart from "@/components/forecast/ForecastChart";
import MatrixChart from "@/components/forecast/MatrixChart";
import { Button } from "@/components/ui/button";
import { useAssumptions } from "@/lib/assumptions";
import { runScenario, deriveAnnualNRR, type ForecastInputs } from "@/lib/forecast";
import {
  deriveRevenueFromPricing,
  derivedStartingMRR,
  derivedMonthlyNewBookings,
} from "@/lib/pricingStrategy";

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};
const fmtPct = (digits = 1) => (v: number) => `${v.toFixed(digits)}%`;
const fmtNum = (suffix = "") => (v: number) => `${v.toLocaleString("en-US")}${suffix}`;

export default function CourseRevenue() {
  const {
    assumptions, setForecast, seedForecast, clearForecastEditedFlag, setForecastOverrides,
  } = useAssumptions();
  const { forecast, forecastManuallyEdited, pricing, forecastOverrides } = assumptions;

  // Pricing-derived seeds — kept in sync live whenever pricing changes.
  const seedMRR = useMemo(() => derivedStartingMRR(pricing), [pricing]);
  const seedBookings = useMemo(() => derivedMonthlyNewBookings(pricing), [pricing]);
  const derivedFromPricing = useMemo(() => deriveRevenueFromPricing(pricing), [pricing]);
  const tierCount = derivedFromPricing.perTier.filter((t) => t.mrrContribution > 0).length;

  // Auto-derive: when a field is unlocked, push the pricing-derived value into
  // the forecast on every change. Only writes when the value differs.
  useEffect(() => {
    if (forecastOverrides.startingMRRLocked) return;
    if (Math.abs(forecast.startingMRR - seedMRR) > 0.5) {
      seedForecast({ ...forecast, startingMRR: seedMRR });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedMRR, forecastOverrides.startingMRRLocked]);

  useEffect(() => {
    if (forecastOverrides.newBookingsLocked) return;
    if (Math.abs(forecast.monthlyNewBookings - seedBookings) > 0.5) {
      seedForecast({ ...forecast, monthlyNewBookings: seedBookings });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedBookings, forecastOverrides.newBookingsLocked]);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isFreshSeed =
    !forecastManuallyEdited &&
    seedMRR > 0 &&
    !forecastOverrides.startingMRRLocked &&
    Math.abs(seedMRR - forecast.startingMRR) <= 1;

  // "Stale" banner only matters when overrides are locked (auto-derive off).
  const isStale =
    forecastOverrides.startingMRRLocked &&
    seedMRR > 0 &&
    Math.abs(seedMRR - forecast.startingMRR) > 1;

  const reseed = () => {
    seedForecast({
      ...forecast,
      startingMRR: seedMRR,
      monthlyNewBookings: seedBookings,
    });
    setForecastOverrides({ startingMRRLocked: false, newBookingsLocked: false });
    clearForecastEditedFlag();
    setBannerDismissed(false);
  };

  const overrideMRR = () => {
    // Switch to manual: keep the current derived value as the starting point.
    seedForecast({ ...forecast, startingMRR: seedMRR });
    setForecastOverrides({ ...forecastOverrides, startingMRRLocked: true });
  };
  const resyncMRR = () => {
    seedForecast({ ...forecast, startingMRR: seedMRR });
    setForecastOverrides({ ...forecastOverrides, startingMRRLocked: false });
  };
  const overrideBookings = () => {
    seedForecast({ ...forecast, monthlyNewBookings: seedBookings });
    setForecastOverrides({ ...forecastOverrides, newBookingsLocked: true });
  };
  const resyncBookings = () => {
    seedForecast({ ...forecast, monthlyNewBookings: seedBookings });
    setForecastOverrides({ ...forecastOverrides, newBookingsLocked: false });
  };

  const [horizonMonths, setHorizonMonths] = useState<36 | 60>(36);

  const { bull, base, bear } = useMemo(() => ({
    bull: runScenario(forecast, "bull", horizonMonths),
    base: runScenario(forecast, "base", horizonMonths),
    bear: runScenario(forecast, "bear", horizonMonths),
  }), [forecast, horizonMonths]);

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

          {/* Starting MRR — auto-derived unless overridden */}
          {forecastOverrides.startingMRRLocked ? (
            <>
              <AssumptionRow label="Starting MRR" value={forecast.startingMRR} format={fmtUsd} onChange={(v) => setForecast({ ...forecast, startingMRR: v })} />
              <LockToggle locked onClick={resyncMRR} label="Manual override" actionLabel="Re-sync to pricing" />
            </>
          ) : (
            <>
              <AssumptionRow label="Starting MRR" value={forecast.startingMRR} format={fmtUsd} derived />
              <LockToggle locked={false} onClick={overrideMRR} label="Auto from pricing" actionLabel="Override" />
            </>
          )}

          {/* Monthly new bookings — auto-derived unless overridden */}
          {forecastOverrides.newBookingsLocked ? (
            <>
              <AssumptionRow label="Monthly new bookings" value={forecast.monthlyNewBookings} format={fmtUsd} onChange={(v) => setForecast({ ...forecast, monthlyNewBookings: v })} />
              <LockToggle locked onClick={resyncBookings} label="Manual override" actionLabel="Re-sync to pricing" />
            </>
          ) : (
            <>
              <AssumptionRow label="Monthly new bookings" value={forecast.monthlyNewBookings} format={fmtUsd} derived />
              <LockToggle locked={false} onClick={overrideBookings} label="Auto from pricing" actionLabel="Override" />
            </>
          )}

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
                <strong>Auto-derived from your pricing:</strong> {fmtUsd(seedMRR)} MRR across {tierCount} tier{tierCount === 1 ? "" : "s"}. Click Override on any field to type a different value.
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
                Your pricing now implies <strong>{fmtUsd(seedMRR)} MRR</strong> but you're using <strong>{fmtUsd(forecast.startingMRR)}</strong>.
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={reseed}>Re-sync from pricing</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[12px]" onClick={() => setBannerDismissed(true)}>Keep my numbers</Button>
                </div>
              </div>
              <button onClick={() => setBannerDismissed(true)} aria-label="Dismiss" className="text-amber-700 hover:text-amber-900">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <span className="text-[12px] text-muted-foreground">Horizon</span>
            <div className="inline-flex rounded-md border border-[#E5E7EB] bg-white p-0.5">
              {([36, 60] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizonMonths(h)}
                  className={`px-3 py-1 text-[12px] rounded ${horizonMonths === h ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {h} mo
                </button>
              ))}
            </div>
          </div>
          <StatCards startingMRR={forecast.startingMRR} bull={bull} base={base} bear={bear} />
          <ForecastChart ref={forecastRef} bull={bull} base={base} bear={bear} startingMRR={forecast.startingMRR} />
          <MatrixChart ref={matrixRef} inputs={forecast} onCellClick={onCellClick} horizonMonths={horizonMonths} />
        </div>
      </div>
    </CourseLayout>
  );
}

function LockToggle({
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
