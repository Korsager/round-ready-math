import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import CourseLayout from "@/components/course/CourseLayout";
import AssumptionRow from "@/components/assumptions/AssumptionRow";
import CashflowChart from "@/components/cashflow/CashflowChart";
import RunwayCards from "@/components/cashflow/RunwayCards";
import CashflowTable from "@/components/cashflow/CashflowTable";
import { Button } from "@/components/ui/button";
import { useAssumptions } from "@/lib/assumptions";
import { simulateCashflow, type CashflowInputs } from "@/lib/cashflow";
import { newRaiseId, type PlannedRaise } from "@/lib/raises";

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};
const fmtPct = (d = 1) => (v: number) => `${v.toFixed(d)}%`;
const fmtNum = (s = "") => (v: number) => `${v.toLocaleString("en-US")}${s}`;
const fmtM = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;

export default function CourseCashflow() {
  const { assumptions, setCashflow, setRaisePlan } = useAssumptions();
  const c = assumptions.cashflow;
  const fundraiseAmount = assumptions.fundraise.raise;
  const rp = assumptions.raisePlan;

  const inputs: CashflowInputs = {
    ...c,
    currentRound: { month: c.monthsUntilRaise, amount: fundraiseAmount, dilutionPct: assumptions.fundraise.dilutionPct },
    manualRaises: rp.manualRaises,
    autoPlan: rp.autoPlan,
    forecast: assumptions.forecast,
  };
  const result = useMemo(() => simulateCashflow(inputs, 36), [inputs]);

  const setAuto = (patch: Partial<typeof rp.autoPlan>) =>
    setRaisePlan({ ...rp, autoPlan: { ...rp.autoPlan, ...patch } });
  const toggleMode = (enabled: boolean) => setAuto({ enabled });

  const addManualRaise = () => {
    const next: PlannedRaise = {
      id: newRaiseId(),
      month: Math.min(36, c.monthsUntilRaise + 18),
      amount: 5_000_000,
      dilutionPct: 20,
      label: `Series ${String.fromCharCode(66 + rp.manualRaises.length)}`,
      source: "manual",
    };
    setRaisePlan({ ...rp, manualRaises: [...rp.manualRaises, next] });
  };
  const updateManual = (id: string, patch: Partial<PlannedRaise>) =>
    setRaisePlan({ ...rp, manualRaises: rp.manualRaises.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const removeManual = (id: string) =>
    setRaisePlan({ ...rp, manualRaises: rp.manualRaises.filter((r) => r.id !== id) });

  return (
    <CourseLayout
      step="cashflow"
      title="4. Cashflow & runway"
      intro="Tie revenue, costs, and your raise together. See exactly when you run out — and how many more rounds you'll need to reach default-alive."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 lg:sticky lg:top-32 self-start space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Inputs</h2>
            <p className="text-[11px] text-[#9CA3AF] mb-2">Burn, runway & raise timing.</p>
            <AssumptionRow label="Starting cash" value={c.startingCash} format={fmtUsd} onChange={(v) => setCashflow({ ...c, startingCash: v })} />
            <AssumptionRow label="Fundraise amount" value={fundraiseAmount} format={fmtUsd} derived description="Set on the Fundraising step" />
            <AssumptionRow label="Months until raise" value={c.monthsUntilRaise} format={fmtNum(" mo")} onChange={(v) => setCashflow({ ...c, monthsUntilRaise: v })} />
            <AssumptionRow label="Starting OpEx" value={c.startingBurn} format={fmtUsd} onChange={(v) => setCashflow({ ...c, startingBurn: v })} />
            <AssumptionRow label="OpEx growth" value={c.opexGrowthRate} format={fmtPct(1)} onChange={(v) => setCashflow({ ...c, opexGrowthRate: v })} />
            <AssumptionRow label="Gross margin" value={c.grossMargin} format={fmtPct(0)} onChange={(v) => setCashflow({ ...c, grossMargin: v })} />
          </div>

          <div className="border-t border-[#F3F4F6] pt-3">
            <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Future rounds</h2>
            <p className="text-[11px] text-[#9CA3AF] mb-2">Beyond your current round.</p>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-secondary p-0.5 mb-3">
              <button
                onClick={() => toggleMode(true)}
                className={`text-[11px] font-medium py-1.5 rounded ${rp.autoPlan.enabled ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#111827]"}`}
              >
                Auto-plan
              </button>
              <button
                onClick={() => toggleMode(false)}
                className={`text-[11px] font-medium py-1.5 rounded ${!rp.autoPlan.enabled ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#111827]"}`}
              >
                Manual
              </button>
            </div>

            {rp.autoPlan.enabled ? (
              <>
                <AssumptionRow label="Trigger (mo runway)" value={rp.autoPlan.triggerMonthsOfRunway} format={fmtNum(" mo")} onChange={(v) => setAuto({ triggerMonthsOfRunway: Math.max(1, v) })} />
                <AssumptionRow label="Fund forward" value={rp.autoPlan.fundMonthsForward} format={fmtNum(" mo")} onChange={(v) => setAuto({ fundMonthsForward: Math.max(1, v) })} />
                <AssumptionRow label="Dilution / round" value={rp.autoPlan.dilutionPerRound} format={fmtPct(0)} onChange={(v) => setAuto({ dilutionPerRound: Math.max(0, Math.min(100, v)) })} />
                <AssumptionRow label="Max rounds" value={rp.autoPlan.maxRounds} format={fmtNum("")} onChange={(v) => setAuto({ maxRounds: Math.max(1, Math.round(v)) })} />
              </>
            ) : (
              <div className="space-y-2">
                {rp.manualRaises.length === 0 && (
                  <p className="text-[11px] text-[#9CA3AF] italic">No manual rounds yet.</p>
                )}
                {rp.manualRaises.map((r) => (
                  <div key={r.id} className="rounded-md border border-[#E5E7EB] p-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        value={r.label}
                        onChange={(e) => updateManual(r.id, { label: e.target.value })}
                        className="text-[12px] font-medium bg-transparent border-b border-transparent hover:border-[#E5E7EB] focus:border-primary outline-none flex-1 min-w-0"
                      />
                      <button onClick={() => removeManual(r.id)} className="text-[#9CA3AF] hover:text-destructive shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[11px]">
                      <NumInput value={r.month} onChange={(v) => updateManual(r.id, { month: Math.max(0, Math.round(v)) })} suffix="mo" />
                      <NumInput value={r.amount} onChange={(v) => updateManual(r.id, { amount: Math.max(0, v) })} prefix="$" />
                      <NumInput value={r.dilutionPct} onChange={(v) => updateManual(r.id, { dilutionPct: Math.max(0, Math.min(100, v)) })} suffix="%" />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-8 w-full text-[12px]" onClick={addManualRaise}>
                  <Plus size={12} className="mr-1" /> Add round
                </Button>
              </div>
            )}
          </div>
        </section>

        <div className="space-y-4 min-w-0">
          <CapitalPlanCard result={result} />
          <RunwayCards result={result} monthsUntilRaise={c.monthsUntilRaise} />
          <CashflowChart result={result} monthsUntilRaise={c.monthsUntilRaise} />
          <CashflowTable result={result} />
        </div>
      </div>
    </CourseLayout>
  );
}

function CapitalPlanCard({ result }: { result: ReturnType<typeof simulateCashflow> }) {
  const rounds = result.plannedRaises.filter((r) => r.month <= 36 && r.amount > 0);
  const headlineCount = rounds.length;
  const founderPct = result.founderOwnershipAtM36;
  const dilutionPct = result.cumulativeDilutionPct;

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/30 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">Capital plan to month 36</div>
      {result.reachesDefaultAliveBeforeRaising ? (
        <div className="text-[18px] font-semibold text-[#111827] leading-tight mb-3">
          1 round (current) takes you to default-alive — no follow-on funding needed.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-[28px] font-semibold tabular-nums text-[#111827] leading-none">{headlineCount}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{headlineCount === 1 ? "round" : "rounds"} needed to survive</div>
          </div>
          <div>
            <div className="text-[28px] font-semibold tabular-nums text-[#111827] leading-none">{fmtM(result.totalRaisedTo36)}</div>
            <div className="text-[11px] text-muted-foreground mt-1">total raised through m36</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] text-[#374151] mb-3">
        <div>
          <span className="text-muted-foreground">Founders own </span>
          <span className="font-semibold tabular-nums">{founderPct.toFixed(1)}%</span>
          <span className="text-muted-foreground"> after all rounds</span>
        </div>
        <div>
          <span className="text-muted-foreground">Cash at m36: </span>
          <span className={`font-semibold tabular-nums ${result.endingCash < 0 ? "text-destructive" : ""}`}>{fmtUsd(result.endingCash)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Default-alive: </span>
          <span className="font-semibold">{result.defaultAliveMonth ? `month ${result.defaultAliveMonth}` : "not reached"}</span>
        </div>
      </div>

      {result.autoPlanExhausted && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-900 mb-3">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>Auto-plan hit its max-rounds cap and you'd still run out. Raise more in earlier rounds, cut burn, or extend the target.</span>
        </div>
      )}

      <div className="border-t border-[#E5E7EB]/60 pt-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Round schedule</div>
        <div className="space-y-1">
          {rounds.map((r) => (
            <div key={r.id} className="flex items-center gap-3 text-[12px]">
              <span className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${r.source === "current" ? "bg-primary" : r.source === "auto" ? "bg-emerald-500" : "bg-indigo-500"}`} />
              <span className="font-medium text-[#111827] min-w-[120px]">{r.label}</span>
              <span className="text-muted-foreground">Mo {r.month}</span>
              <span className="font-medium tabular-nums text-[#111827]">{fmtM(r.amount)}</span>
              <span className="text-muted-foreground tabular-nums">{r.dilutionPct.toFixed(0)}%</span>
              {r.source === "current" && (
                <Link to="/course/fundraising" className="ml-auto text-[11px] text-primary hover:underline">
                  Set on Fundraising →
                </Link>
              )}
              {r.source === "auto" && <span className="ml-auto text-[10px] uppercase tracking-wide text-emerald-700">auto</span>}
              {r.source === "manual" && <span className="ml-auto text-[10px] uppercase tracking-wide text-indigo-700">manual</span>}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground italic mt-3">
          Cumulative dilution compounded multiplicatively ({dilutionPct.toFixed(1)}%). Does not account for option pool refreshes between rounds.
        </p>
      </div>
    </div>
  );
}

function NumInput({ value, onChange, prefix, suffix }: { value: number; onChange: (v: number) => void; prefix?: string; suffix?: string }) {
  return (
    <div className="flex items-center border border-[#E5E7EB] rounded px-1.5 h-7">
      {prefix && <span className="text-[10px] text-muted-foreground">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="flex-1 min-w-0 text-[11px] tabular-nums bg-transparent outline-none text-right"
      />
      {suffix && <span className="text-[10px] text-muted-foreground ml-0.5">{suffix}</span>}
    </div>
  );
}
