import { useMemo } from "react";
import CourseLayout from "@/components/course/CourseLayout";
import AssumptionRow from "@/components/assumptions/AssumptionRow";
import CashflowChart from "@/components/cashflow/CashflowChart";
import RunwayCards from "@/components/cashflow/RunwayCards";
import CashflowTable from "@/components/cashflow/CashflowTable";
import { useAssumptions } from "@/lib/assumptions";
import { simulateCashflow, type CashflowInputs } from "@/lib/cashflow";

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};
const fmtPct = (d = 1) => (v: number) => `${v.toFixed(d)}%`;
const fmtNum = (s = "") => (v: number) => `${v.toLocaleString("en-US")}${s}`;

export default function CourseCashflow() {
  const { assumptions, setCashflow } = useAssumptions();
  const c = assumptions.cashflow;
  const inputs: CashflowInputs = { ...c, forecast: assumptions.forecast };
  const result = useMemo(() => simulateCashflow(inputs, 36), [inputs]);

  return (
    <CourseLayout
      step="cashflow"
      title="4. Cashflow & runway"
      intro="Tie revenue, costs, and your raise together. See exactly when you run out — and whether the round actually saves you."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 lg:sticky lg:top-32 self-start">
          <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Inputs</h2>
          <p className="text-[11px] text-[#9CA3AF] mb-2">Burn, runway & raise timing.</p>
          <AssumptionRow label="Starting cash" value={c.startingCash} format={fmtUsd} onChange={(v) => setCashflow({ ...c, startingCash: v })} />
          <AssumptionRow label="Fundraise amount" value={c.fundraiseAmount} format={fmtUsd} onChange={(v) => setCashflow({ ...c, fundraiseAmount: v })} />
          <AssumptionRow label="Months until raise" value={c.monthsUntilRaise} format={fmtNum(" mo")} onChange={(v) => setCashflow({ ...c, monthsUntilRaise: v })} />
          <AssumptionRow label="Starting OpEx" value={c.startingBurn} format={fmtUsd} onChange={(v) => setCashflow({ ...c, startingBurn: v })} />
          <AssumptionRow label="OpEx growth" value={c.opexGrowthRate} format={fmtPct(1)} onChange={(v) => setCashflow({ ...c, opexGrowthRate: v })} />
          <AssumptionRow label="Gross margin" value={c.grossMargin} format={fmtPct(0)} onChange={(v) => setCashflow({ ...c, grossMargin: v })} />
        </section>

        <div className="space-y-4 min-w-0">
          <RunwayCards result={result} monthsUntilRaise={c.monthsUntilRaise} />
          <CashflowChart result={result} monthsUntilRaise={c.monthsUntilRaise} />
          <CashflowTable result={result} />
        </div>
      </div>
    </CourseLayout>
  );
}
