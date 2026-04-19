import { useMemo } from "react";
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
} from "recharts";
import { TrendingUp, Target, BarChart3, PieChart } from "lucide-react";
import CourseLayout from "@/components/course/CourseLayout";
import AssumptionRow from "@/components/assumptions/AssumptionRow";
import HeatmapGrid from "@/components/HeatmapGrid";
import { useAssumptions } from "@/lib/assumptions";

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};
const fmtPct = (d = 1) => (v: number) => `${v.toFixed(d)}%`;
const fmtNum = (s = "") => (v: number) => `${v.toLocaleString("en-US")}${s}`;
const fmtMoic = (v: number) => `${v.toFixed(1)}×`;
const fmtM = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;

export default function CourseFundraising() {
  const { assumptions, setFundraise } = useAssumptions();
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

  const ownershipData = [
    { name: "Founders", value: +(100 - f.dilutionPct).toFixed(1) },
    { name: "Investors", value: +f.dilutionPct.toFixed(1) },
  ];
  const PIE_COLORS = ["hsl(217, 91%, 60%)", "hsl(160, 84%, 39%)"];

  const verdictTone = r.calcIrr >= f.targetIrr ? "text-emerald-600" : r.calcIrr >= f.targetIrr * 0.7 ? "text-amber-600" : "text-destructive";

  return (
    <CourseLayout
      step="fundraising"
      title="3. Fundraising"
      intro="Connect raise size, dilution, and target return. See exactly what exit value justifies the round."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 lg:sticky lg:top-32 self-start">
          <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Inputs</h2>
          <p className="text-[11px] text-[#9CA3AF] mb-2">Pre-money and post-money are derived.</p>
          <AssumptionRow label="Raise amount" value={f.raise} format={fmtUsd} onChange={(v) => setFundraise({ ...f, raise: v })} />
          <AssumptionRow label="Dilution" value={f.dilutionPct} format={fmtPct(1)} onChange={(v) => setFundraise({ ...f, dilutionPct: v })} />
          <AssumptionRow label="Pre-money" value={r.preMoney} format={fmtUsd} derived />
          <AssumptionRow label="Post-money" value={r.postMoney} format={fmtUsd} derived />
          <AssumptionRow label="Target IRR" value={f.targetIrr} format={fmtPct(0)} onChange={(v) => setFundraise({ ...f, targetIrr: v })} />
          <AssumptionRow label="Years to exit" value={f.yearsToExit} format={fmtNum(" yr")} onChange={(v) => setFundraise({ ...f, yearsToExit: v })} />
          <AssumptionRow label="Target MOIC" value={f.targetMoic} format={fmtMoic} onChange={(v) => setFundraise({ ...f, targetMoic: v })} />
        </section>

        <div className="space-y-4 min-w-0">
          <div className="bg-primary rounded-2xl p-5 sm:p-6 text-primary-foreground shadow-md">
            <h3 className="text-[13px] font-medium opacity-80 mb-1">Post-Money Valuation</h3>
            <p className="text-[36px] sm:text-[44px] font-semibold tabular-nums leading-tight">{fmtM(r.postMoney)}</p>
            <p className="text-[12px] opacity-70 mb-4">Pre-Money: {fmtM(r.preMoney)} · Raising {fmtM(f.raise)}</p>
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

          <div className="grid grid-cols-2 gap-3">
            <Metric icon={TrendingUp} label="Required MOIC" value={`${r.reqMoic.toFixed(1)}×`} sub={`for ${f.targetIrr}% IRR`} />
            <Metric icon={Target} label="Required Exit" value={fmtM(r.reqExit)} sub={`in ${f.yearsToExit} years`} />
            <Metric icon={BarChart3} label="Your IRR" value={`${r.calcIrr.toFixed(1)}%`} sub={`at ${f.targetMoic}× MOIC`} tone={verdictTone} />
            <Metric icon={PieChart} label="Investor Ownership" value={`${(r.ownership * 100).toFixed(1)}%`} sub="post-round" />
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <h3 className="text-[13px] font-semibold text-[#111827] mb-2">IRR sensitivity</h3>
            <HeatmapGrid inputs={{ ...f, shares: 0 }} />
          </div>
        </div>
      </div>
    </CourseLayout>
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
