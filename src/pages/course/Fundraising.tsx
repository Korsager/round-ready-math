import { useMemo } from "react";
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
} from "recharts";
import { TrendingUp, Target, BarChart3, PieChart, LineChart, ChevronDown, AlertTriangle, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import CourseLayout from "@/components/course/CourseLayout";
import AssumptionRow from "@/components/assumptions/AssumptionRow";
import HeatmapGrid from "@/components/HeatmapGrid";
import { useAssumptions } from "@/lib/assumptions";
import { computeImpliedIrr } from "@/lib/impliedIrr";
import { requiredMonthlyGrowth } from "@/lib/forecast";
import { computePlanSummary, fmtPlanMoney } from "@/lib/planSummary";
import { monthCalendar } from "@/lib/dateAnchor";

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};
const fmtPct = (d = 1) => (v: number) => `${v.toFixed(d)}%`;
const fmtNum = (s = "") => (v: number) => `${v.toLocaleString("en-US")}${s}`;
const fmtMoic = (v: number) => `${v.toFixed(1)}×`;
const fmtMult = (v: number) => `${v.toFixed(1)}×`;
const fmtM = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;

export default function CourseFundraising() {
  const { assumptions, setFundraise, setCashflow } = useAssumptions();
  const f = assumptions.fundraise;

  const r = useMemo(() => {
    const ownership = f.dilutionPct / 100;
    const postMoney = ownership > 0 ? f.raise / ownership : 0;
    const preMoney = postMoney - f.raise;
    const irrDec = f.targetIrr / 100;
    const reqReturn = f.raise * Math.pow(1 + irrDec, f.yearsToExit);
    const reqExit = ownership > 0 ? reqReturn / ownership : 0;
    const reqMoic = f.raise > 0 ? reqReturn / f.raise : 0;
    const calcIrr = f.yearsToExit > 0 && f.targetMoic > 0 ? (Math.pow(f.targetMoic, 1 / f.yearsToExit) - 1) * 100 : 0;
    return { postMoney, preMoney, ownership, reqExit, reqMoic, calcIrr };
  }, [f]);

  const implied = useMemo(() => computeImpliedIrr(assumptions), [assumptions]);
  const plan = useMemo(() => computePlanSummary(assumptions), [assumptions]);
  const runwayState: "red" | "amber" | "green" =
    plan.runwayMonth !== null && plan.runwayMonth <= plan.monthsUntilRaise
      ? "red"
      : plan.monthsRunwayAfterRaise !== null && plan.monthsRunwayAfterRaise < 12
        ? "amber"
        : "green";
  const reqGrowth = useMemo(
    () => requiredMonthlyGrowth(
      assumptions.forecast.startingMRR,
      f.targetIrr,
      f.yearsToExit,
      f.raise,
      f.dilutionPct,
      f.revenueMultiple,
    ),
    [assumptions.forecast.startingMRR, f.targetIrr, f.yearsToExit, f.raise, f.dilutionPct, f.revenueMultiple],
  );
  const actualGrowth = assumptions.forecast.monthlyGrowthRate;
  const growthTone = actualGrowth >= reqGrowth ? "text-emerald-600" : actualGrowth >= reqGrowth * 0.7 ? "text-amber-600" : "text-destructive";

  const ownershipData = [
    { name: "Founders", value: +(100 - f.dilutionPct).toFixed(1) },
    { name: "Investors", value: +f.dilutionPct.toFixed(1) },
  ];
  const PIE_COLORS = ["hsl(217, 91%, 60%)", "hsl(160, 84%, 39%)"];

  const tone = (irr: number) =>
    irr >= f.targetIrr ? "text-emerald-600" : irr >= f.targetIrr * 0.7 ? "text-amber-600" : "text-destructive";
  const verdictTone = tone(r.calcIrr);
  const impliedTone = tone(implied.impliedIrrPct);

  const revenueDisabled = f.valuationMethod === "ownership" || (f.valuationMethod === "auto" && implied.basis === "ownership");

  const baseNarrative = (() => {
    if (implied.impliedIrrPct >= f.targetIrr) {
      return `Your forecast supports the IRR investors need. A ${f.targetIrr}% fund hurdle is achievable at your projected trajectory.`;
    }
    if (implied.basis === "revenue") {
      return `At ${f.revenueMultiple}× year-${f.yearsToExit} ARR, your forecast implies ${implied.impliedIrrPct.toFixed(1)}% IRR vs the ${f.targetIrr}% investors target. Either growth needs to be higher, exit timing sooner, or the multiple assumption optimistic.`;
    }
    return `Pricing on dilution, your claimed ${f.targetMoic}× MOIC delivers ${implied.impliedIrrPct.toFixed(1)}% IRR vs the ${f.targetIrr}% target. Investors will ask for a sharper story — what exit buyer pays this, and when?`;
  })();
  const narrative = runwayState === "red"
    ? `Funding gap: this raise doesn't cover the runway needed to execute the plan. ${baseNarrative}`
    : baseNarrative;

  return (
    <CourseLayout
      step="fundraising"
      title="3. Fundraising"
      intro="Connect raise size, dilution, and your investor's required return. See whether your forecast actually supports the IRR their fund needs."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 lg:sticky lg:top-32 self-start">
          <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Inputs</h2>
          <p className="text-[11px] text-[#9CA3AF] mb-2">Pre-money and post-money are derived.</p>
          <AssumptionRow label="Raise amount" value={f.raise} format={fmtUsd} onChange={(v) => setFundraise({ ...f, raise: v })} />
          <AssumptionRow label="Dilution" value={f.dilutionPct} format={fmtPct(1)} onChange={(v) => setFundraise({ ...f, dilutionPct: v })} />
          <AssumptionRow label="Pre-money" value={r.preMoney} format={fmtUsd} derived />
          <AssumptionRow label="Post-money" value={r.postMoney} format={fmtUsd} derived />
          <AssumptionRow
            label="Target IRR"
            description="The annualized return your investor needs to deliver to their LPs. Typical VC fund hurdle: 25–35%."
            value={f.targetIrr}
            format={fmtPct(0)}
            onChange={(v) => setFundraise({ ...f, targetIrr: v })}
          />
          <AssumptionRow
            label="Months until close"
            description="When the round closes and cash arrives. Drives whether the raise lands before runway zero."
            value={assumptions.cashflow.monthsUntilRaise}
            format={fmtNum(" mo")}
            onChange={(v) => setCashflow({ ...assumptions.cashflow, monthsUntilRaise: Math.max(0, v) })}
          />
          <AssumptionRow label="Years to exit" value={f.yearsToExit} format={fmtNum(" yr")} onChange={(v) => setFundraise({ ...f, yearsToExit: v })} />
          <AssumptionRow label="Target MOIC" value={f.targetMoic} format={fmtMoic} onChange={(v) => setFundraise({ ...f, targetMoic: v })} />

          <div className={revenueDisabled ? "opacity-50 pointer-events-none" : ""}>
            <AssumptionRow
              label="Revenue multiple"
              description="EV/Revenue applied to projected exit-year ARR."
              value={f.revenueMultiple}
              format={fmtMult}
              onChange={(v) => setFundraise({ ...f, revenueMultiple: Math.max(0, v) })}
            />
          </div>

          <div className="pt-3 mt-1">
            <div className="text-[11px] text-[#9CA3AF] mb-1.5">Valuation basis</div>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-secondary p-0.5">
              {(["auto", "revenue", "ownership"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setFundraise({ ...f, valuationMethod: m })}
                  className={`text-[11px] font-medium py-1.5 rounded ${
                    f.valuationMethod === m ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#111827]"
                  }`}
                >
                  {m === "auto" ? "Auto" : m === "revenue" ? "EV/Rev" : "Ownership"}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-2 leading-snug">
              Auto picks EV/Revenue if year-{f.yearsToExit} ARR &gt; $500k, else ownership-based. SaaS typically 6–8× revenue; adjust for your sector.
            </p>
          </div>
        </section>

        <div className="space-y-4 min-w-0">
          <div className="bg-primary rounded-2xl p-5 sm:p-6 text-primary-foreground shadow-md">
            <h3 className="text-[13px] font-medium opacity-80 mb-1">Post-Money Valuation</h3>
            <p className="text-[36px] sm:text-[44px] font-semibold tabular-nums leading-tight">{fmtM(r.postMoney)}</p>
            <p className="text-[12px] opacity-70 mb-1">Pre-Money: {fmtM(r.preMoney)} · Raising {fmtM(f.raise)}</p>
            {plan.monthsRunwayAfterRaise !== null && plan.valuationPerRunwayMonth !== null && (
              <p className="text-[12px] opacity-70 mb-4">
                Buys {plan.monthsRunwayAfterRaise} months → {fmtM(plan.valuationPerRunwayMonth)} / mo of runway
              </p>
            )}
            {!(plan.monthsRunwayAfterRaise !== null && plan.valuationPerRunwayMonth !== null) && <div className="mb-4" />}
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie data={ownershipData} dataKey="value" cx="50%" cy="50%" innerRadius={26} outerRadius={44} strokeWidth={0}>
                      {ownershipData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <ReTooltip contentStyle={{ background: "rgba(0,0,0,0.85)", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }} />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[12px] space-y-1">
                <div>Founders keep <strong>{ownershipData[0].value}%</strong></div>
                <div>Investors get <strong>{ownershipData[1].value}%</strong></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Metric icon={Target} label="Target IRR" value={`${f.targetIrr}%`} sub="investor's hurdle" />
            <Metric icon={BarChart3} label="MOIC-implied IRR" value={`${r.calcIrr.toFixed(1)}%`} sub={`at ${f.targetMoic}× MOIC`} tone={verdictTone} />
            <Metric
              icon={LineChart}
              label="Forecast-implied IRR"
              value={`${implied.impliedIrrPct.toFixed(1)}%`}
              sub={implied.basis === "revenue"
                ? `${fmtM(implied.impliedExitValue)} exit at ${f.revenueMultiple}× ARR`
                : `${fmtM(implied.impliedExitValue)} exit (ownership)`}
              tone={impliedTone}
            />
            <Metric icon={TrendingUp} label="Required MOIC" value={`${r.reqMoic.toFixed(1)}×`} sub={`for ${f.targetIrr}% IRR`} />
            <Metric icon={Target} label="Required Exit" value={fmtM(r.reqExit)} sub={`in ${f.yearsToExit} years`} />
            <Metric icon={PieChart} label="Investor Ownership" value={`${(r.ownership * 100).toFixed(1)}%`} sub="post-round" />
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-secondary/40 p-4">
            <p className="text-[13px] text-[#374151] leading-relaxed">{narrative}</p>
            <p className="text-[12px] text-[#374151] mt-2">
              Target requires compounding MRR at <span className="font-semibold tabular-nums">{reqGrowth.toFixed(2)}%/mo</span> — your forecast assumes{" "}
              <span className={`font-semibold tabular-nums ${growthTone}`}>{actualGrowth.toFixed(2)}%/mo</span>.
            </p>
            <details className="mt-3 group">
              <summary className="flex items-center gap-1 cursor-pointer text-[12px] font-medium text-[#6B7280] hover:text-[#111827] list-none">
                <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
                How we derived this
              </summary>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-[#374151]">
                <dt className="text-muted-foreground">Year-{f.yearsToExit} ARR</dt><dd className="text-right tabular-nums">{fmtUsd(implied.arrAtExit)}</dd>
                <dt className="text-muted-foreground">Valuation basis</dt><dd className="text-right">{implied.basis === "revenue" ? "EV/Revenue" : "Ownership"}</dd>
                <dt className="text-muted-foreground">Implied exit value</dt><dd className="text-right tabular-nums">{fmtM(implied.impliedExitValue)}</dd>
                <dt className="text-muted-foreground">Investor proceeds</dt><dd className="text-right tabular-nums">{fmtM(implied.investorProceedsAtExit)}</dd>
                <dt className="text-muted-foreground">Implied MOIC</dt><dd className="text-right tabular-nums">{implied.impliedMoic.toFixed(1)}×</dd>
              </dl>
              <p className="text-[11px] text-muted-foreground italic mt-2">{implied.reasoning}</p>
            </details>
          </div>

          <RunwayCheck plan={plan} state={runwayState} raise={f.raise} horizonMonths={plan.horizonMonths} />

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <h3 className="text-[13px] font-semibold text-[#111827] mb-2">IRR sensitivity</h3>
            <HeatmapGrid inputs={{ ...f, shares: 0 }} />
          </div>
        </div>
      </div>
    </CourseLayout>
  );
}

function RunwayCheck({
  plan,
  state,
  raise,
  horizonMonths,
}: {
  plan: ReturnType<typeof computePlanSummary>;
  state: "red" | "amber" | "green";
  raise: number;
  horizonMonths: number;
}) {
  const runwayLabel = plan.runwayMonth !== null ? `${plan.runwayMonth} mo` : `${horizonMonths}+ mo`;
  const afterLabel = plan.monthsRunwayAfterRaise !== null ? `${plan.monthsRunwayAfterRaise} mo` : "—";
  const styles = {
    red: { wrap: "bg-red-50 border-red-200", icon: AlertCircle, iconClass: "text-destructive", label: "Funding gap", labelClass: "text-destructive" },
    amber: { wrap: "bg-amber-50 border-amber-200", icon: AlertTriangle, iconClass: "text-amber-600", label: "Tight raise", labelClass: "text-amber-700" },
    green: { wrap: "bg-emerald-50 border-emerald-200", icon: CheckCircle2, iconClass: "text-emerald-600", label: "Adequate raise", labelClass: "text-emerald-700" },
  }[state];
  const Icon = styles.icon;

  let body: JSX.Element;
  if (state === "red") {
    body = (
      <>
        <p className="text-[13px] text-[#111827] leading-relaxed">
          You run out of cash in month <strong className="tabular-nums">{plan.runwayMonth}</strong> but the raise isn't planned until month{" "}
          <strong className="tabular-nums">{plan.monthsUntilRaise}</strong>. Either raise earlier, cut burn, or extend the bridge.
        </p>
        <Link to="/course/cashflow" className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline mt-2">
          Adjust on Cashflow step <ArrowRight size={12} />
        </Link>
      </>
    );
  } else if (state === "amber") {
    const needed = plan.monthsRunwayAfterRaise && plan.monthsRunwayAfterRaise > 0
      ? Math.round((raise * 18) / plan.monthsRunwayAfterRaise)
      : null;
    body = (
      <>
        <p className="text-[13px] text-[#111827] leading-relaxed">
          <strong className="tabular-nums">{fmtPlanMoney(raise)}</strong> buys{" "}
          <strong className="tabular-nums">{plan.monthsRunwayAfterRaise}</strong> months after closing. Most investors expect 18–24 months of post-round runway. Consider raising more or trimming opex.
        </p>
        {needed !== null && (
          <p className="text-[12px] text-muted-foreground mt-1">
            18 months would cost ~<strong className="tabular-nums text-[#111827]">{fmtPlanMoney(needed)}</strong>.
          </p>
        )}
      </>
    );
  } else {
    body = (
      <p className="text-[13px] text-[#111827] leading-relaxed">
        <strong className="tabular-nums">{fmtPlanMoney(raise)}</strong> funds{" "}
        <strong className="tabular-nums">{plan.monthsRunwayAfterRaise ?? "—"}</strong> months of post-round runway. Cash zero pushed to month{" "}
        <strong className="tabular-nums">{plan.runwayMonth ?? `${horizonMonths}+`}</strong>.
      </p>
    );
  }

  return (
    <div className={`rounded-xl border ${styles.wrap} p-4`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={`${styles.iconClass} shrink-0 mt-0.5`} />
        <div className="min-w-0 flex-1">
          <div className={`text-[11px] uppercase tracking-wide font-semibold ${styles.labelClass} mb-1`}>{styles.label}</div>
          {body}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#E5E7EB]/60">
        <Stat label="Current runway" value={runwayLabel} />
        <Stat label="Raise lands" value={`Month ${plan.monthsUntilRaise}`} />
        <Stat label="Post-round runway" value={afterLabel} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-[14px] font-semibold tabular-nums text-[#111827]">{value}</div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-primary" />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className={`text-[20px] font-semibold tabular-nums ${tone ?? "text-[#111827]"}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
