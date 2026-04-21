import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, AlertTriangle, X, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import CourseLayout from "@/components/course/CourseLayout";
import AssumptionRow from "@/components/assumptions/AssumptionRow";
import StatCards from "@/components/forecast/StatCards";
import ForecastChart from "@/components/forecast/ForecastChart";
import MatrixChart from "@/components/forecast/MatrixChart";
import UnitEconomicsCard from "@/components/forecast/UnitEconomicsCard";
import { Button } from "@/components/ui/button";
import { useAssumptions } from "@/lib/assumptions";
import { runScenario, deriveAnnualNRR, type ForecastInputs } from "@/lib/forecast";
import {
  blendedARPUWithAnnual,
  deriveRevenueFromPricing,
  derivedStartingMRR,
  derivedMonthlyNewBookings,
} from "@/lib/pricingStrategy";
import { computeUnitEconomics } from "@/lib/unitEconomics";

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};
const fmtUsd2 = (v: number) => `$${v.toFixed(2)}`;
const fmtPct = (digits = 1) => (v: number) => `${v.toFixed(digits)}%`;
const fmtNum = (suffix = "") => (v: number) => `${v.toLocaleString("en-US")}${suffix}`;
const fmtCount = (v: number) =>
  v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(1);

export default function CourseRevenue() {
  const {
    assumptions, setForecast, seedForecast, clearForecastEditedFlag, setForecastOverrides,
  } = useAssumptions();
  const { forecast, forecastManuallyEdited, pricing, forecastOverrides, cashflow } = assumptions;

  // Pricing-derived seeds — kept in sync live whenever pricing changes.
  const seedMRR = useMemo(() => derivedStartingMRR(pricing), [pricing]);
  const seedBookings = useMemo(() => derivedMonthlyNewBookings(pricing), [pricing]);
  const seedArpu = useMemo(() => blendedARPUWithAnnual(pricing), [pricing]);
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

  // Phase 2: ARPU auto-resync (per the user-chosen "Auto-resync, show toast" UX).
  // Whenever the pricing-derived ARPU changes by more than 1¢, snap blendedArpu
  // to the new value and toast. The user's manual override is intentionally
  // clobbered — the live link from Pricing → Revenue wins.
  const lastNotifiedArpuRef = useRef<number>(seedArpu);
  useEffect(() => {
    if (seedArpu <= 0) return;
    const drift = Math.abs(forecast.blendedArpu - seedArpu);
    if (drift > 0.01) {
      seedForecast({ ...forecast, blendedArpu: seedArpu });
      // Only toast when the new value is different from what we last announced.
      if (Math.abs(lastNotifiedArpuRef.current - seedArpu) > 0.01) {
        toast.success("ARPU re-derived from Pricing", {
          description: `Now ${fmtUsd2(seedArpu)} / customer / month.`,
        });
        lastNotifiedArpuRef.current = seedArpu;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedArpu]);

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
    setForecastOverrides({ ...forecastOverrides, startingMRRLocked: false, newBookingsLocked: false });
    clearForecastEditedFlag();
    setBannerDismissed(false);
  };

  const overrideMRR = () => {
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

  // Phase 2: pricing uplift toggle. Per user choice, this is delta-only —
  // doesn't mutate the forecast. We compute a side-by-side scenario.
  const [upliftPct, setUpliftPct] = useState<0 | 5 | 10 | 20>(0);

  const { bull, base, bear } = useMemo(() => ({
    bull: runScenario(forecast, "bull", horizonMonths),
    base: runScenario(forecast, "base", horizonMonths),
    bear: runScenario(forecast, "bear", horizonMonths),
  }), [forecast, horizonMonths]);

  const upliftScenario = useMemo(() => {
    if (upliftPct === 0) return null;
    const upliftFactor = 1 + upliftPct / 100;
    const upliftedForecast: ForecastInputs = {
      ...forecast,
      startingMRR: forecast.startingMRR * upliftFactor,
      monthlyNewBookings: forecast.monthlyNewBookings * upliftFactor,
      blendedArpu: forecast.blendedArpu * upliftFactor,
    };
    return runScenario(upliftedForecast, "base", horizonMonths);
  }, [forecast, upliftPct, horizonMonths]);

  const nrr = useMemo(() => deriveAnnualNRR(forecast), [forecast]);
  const ue = useMemo(
    () => computeUnitEconomics(forecast, pricing, cashflow.grossMargin),
    [forecast, pricing, cashflow.grossMargin],
  );

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

  // ARPU is "linked" to pricing iff pricing-derived ARPU exists AND the
  // current forecast value matches it (auto-resync keeps these aligned).
  const arpuLinkedToPricing = seedArpu > 0 && Math.abs(forecast.blendedArpu - seedArpu) <= 0.01;

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

          {/* Phase 1 — Unit-economics inputs. Sit between bookings and growth. */}
          <AssumptionRow
            label="Blended ARPU"
            description={arpuLinkedToPricing
              ? "Auto-derived from your Pricing step (60% mix, 40% annual). Edit Pricing to change."
              : "$/customer/month. Auto-derives from Pricing step when tiers are priced."}
            value={forecast.blendedArpu}
            format={fmtUsd}
            onChange={(v) => setForecast({ ...forecast, blendedArpu: Math.max(0, v) })}
          />
          {arpuLinkedToPricing && (
            <p className="-mt-1 mb-2 text-[10px] uppercase tracking-wide text-primary font-semibold">
              Derived from Pricing
            </p>
          )}
          <AssumptionRow
            label="CAC"
            description="Fully loaded cost to acquire one customer (sales + marketing)."
            value={forecast.cac}
            format={fmtUsd}
            onChange={(v) => setForecast({ ...forecast, cac: Math.max(0, v) })}
          />
          <AssumptionRow
            label="CAC payback"
            description="Months until gross profit from a new customer covers the CAC. Healthy SaaS: 12 or less."
            value={forecast.cacPaybackMonths}
            format={fmtNum(" mo")}
            onChange={(v) => setForecast({ ...forecast, cacPaybackMonths: Math.max(0, Math.round(v)) })}
          />
          <AssumptionRow
            label="Implied new customers / mo"
            description="monthlyNewBookings ÷ blended ARPU. Sanity-checks whether your sales velocity matches your bookings target."
            value={ue.impliedNewCustomersPerMonth}
            format={(v) => `${fmtCount(v)} / mo`}
            derived
          />
          {ue.customerVelocityWarn && (
            <div className="-mt-1 mb-2 flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
              <AlertTriangle size={11} className="shrink-0 mt-0.5" />
              <span>Acquiring &gt;1,000 customers/mo is heroic for early-stage. Tighten ARPU or revisit bookings.</span>
            </div>
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

          {/* Phase 2: pricing uplift toggle (delta-only — does not mutate forecast). */}
          <PricingUpliftStrip
            upliftPct={upliftPct}
            setUpliftPct={setUpliftPct}
            baseEndingARR={base.endingARR}
            upliftEndingARR={upliftScenario?.endingARR ?? null}
            grossMarginPct={ue.blendedGrossMarginPct}
          />

          <UnitEconomicsCard result={ue} cac={forecast.cac} />
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

function PricingUpliftStrip({
  upliftPct, setUpliftPct, baseEndingARR, upliftEndingARR, grossMarginPct,
}: {
  upliftPct: 0 | 5 | 10 | 20;
  setUpliftPct: (v: 0 | 5 | 10 | 20) => void;
  baseEndingARR: number;
  upliftEndingARR: number | null;
  grossMarginPct: number;
}) {
  const arrDelta = upliftEndingARR !== null ? upliftEndingARR - baseEndingARR : 0;
  const contributionDelta = arrDelta * (grossMarginPct / 100);
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <h3 className="text-[13px] font-semibold text-[#111827]">Pricing uplift — what-if</h3>
          <p className="text-[11px] text-muted-foreground">McKinsey: 1% better pricing ≈ 8% more operating profit. Toggle a price increase to see the delta.</p>
        </div>
        <div className="inline-flex rounded-md border border-[#E5E7EB] bg-white p-0.5 self-start">
          {([0, 5, 10, 20] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setUpliftPct(p)}
              className={`px-2.5 py-1 text-[11px] rounded ${upliftPct === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p === 0 ? "Off" : `+${p}%`}
            </button>
          ))}
        </div>
      </div>
      {upliftPct === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">Pick a level to compare against base ARR. Forecast itself stays untouched.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
          <UpliftCell label="Base ending ARR" value={baseEndingARR} />
          <UpliftCell label={`+${upliftPct}% ending ARR`} value={upliftEndingARR ?? 0} highlight />
          <UpliftCell label="Δ contribution" value={contributionDelta} delta />
        </div>
      )}
    </div>
  );
}

function UpliftCell({ label, value, highlight, delta }: { label: string; value: number; highlight?: boolean; delta?: boolean }) {
  const sign = delta && value > 0 ? "+" : "";
  return (
    <div className={`rounded-lg border p-2.5 ${highlight ? "border-primary/30 bg-primary/5" : "border-[#E5E7EB] bg-white"}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-[16px] font-semibold tabular-nums ${highlight ? "text-primary" : delta && value > 0 ? "text-emerald-600" : "text-[#111827]"}`}>
        {sign}{fmtUsd(value)}
      </div>
    </div>
  );
}
