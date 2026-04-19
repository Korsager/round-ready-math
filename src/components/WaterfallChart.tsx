import { forwardRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import type { WaterfallData } from "@/lib/forecast";
import { fmt, fmtDollars } from "@/lib/format";

interface Props {
  data: WaterfallData;
}

const WaterfallChart = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  // Build waterfall via stacked invisible base + colored value
  const { startingARR, grossChurn, downgrades, expansion, newBusiness, endingARR, nrr } = data;

  let running = startingARR;
  const afterChurn = running - grossChurn;
  const afterDown = afterChurn - downgrades;
  const afterExp = afterDown + expansion;
  const afterNew = afterExp + newBusiness;

  const bars = [
    { name: "Starting ARR", base: 0, value: startingARR, color: "#1E3A8A", display: startingARR },
    { name: "Gross churn", base: afterChurn, value: grossChurn, color: "#EF4444", display: -grossChurn },
    { name: "Downgrades", base: afterDown, value: downgrades, color: "#F87171", display: -downgrades },
    { name: "Expansion", base: afterDown, value: expansion, color: "#10B981", display: expansion },
    { name: "New business", base: afterExp, value: newBusiness, color: "#059669", display: newBusiness },
    { name: "Ending ARR", base: 0, value: endingARR, color: "#1E3A8A", display: endingARR },
  ];

  const nrrPositive = nrr >= 100;

  return (
    <div ref={ref} className="bg-white rounded-lg border border-[#E5E7EB] p-5">
      <h2 className="sr-only">12-month ARR waterfall chart</h2>
      <h3 className="text-[18px] font-medium text-[#111827]">Where your ARR actually comes from: a 12-month waterfall</h3>
      <p className="text-[14px] text-[#6B7280] mt-1">
        Starting ARR: {fmtDollars(startingARR)}. This is the breakdown most founders never model explicitly — until a VC asks for it.
      </p>

      <div className="flex justify-center mt-3">
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium"
          style={{ background: nrrPositive ? "#D1FAE5" : "#FEE2E2", color: nrrPositive ? "#065F46" : "#991B1B" }}
        >
          NRR = {nrr.toFixed(0)}% ↗
        </span>
      </div>

      <div style={{ height: 340 }} className="mt-2">
        <ResponsiveContainer>
          <BarChart data={bars} margin={{ top: 30, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 11 }} interval={0} stroke="#E5E7EB" />
            <YAxis tickFormatter={(v) => "$" + Math.round(v / 1000) + "K"} tick={{ fill: "#6B7280", fontSize: 11 }} stroke="#E5E7EB" />
            <Tooltip
              formatter={(_v: number, _n, p: any) => [fmt(p.payload.display), p.payload.name]}
              contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E5E7EB" }}
            />
            <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="value" stackId="a" isAnimationActive={false}>
              {bars.map((b, i) => <Cell key={i} fill={b.color} />)}
              <LabelList dataKey="display" position="top" formatter={(v: number) => fmt(v)} style={{ fontSize: 11, fill: "#111827" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between mt-2 text-[11px] text-[#6B7280]">
        <span>← Lost revenue (churn + downgrades)</span>
        <span>Gained revenue (expansion + new business) →</span>
      </div>

      <p className="text-[11px] text-[#9CA3AF] mt-3">
        Illustrative waterfall. Churn and expansion rates based on median B2B SaaS benchmarks. SaaS Capital 2025; Bessemer State of the Cloud 2025.
      </p>
    </div>
  );
});

WaterfallChart.displayName = "WaterfallChart";
export default WaterfallChart;
