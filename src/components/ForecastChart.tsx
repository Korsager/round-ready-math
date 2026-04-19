import { forwardRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea, Label,
} from "recharts";
import type { ScenarioResult } from "@/lib/forecast";
import { fmt, fmtDollars } from "@/lib/format";

interface Props {
  bull: ScenarioResult;
  base: ScenarioResult;
  bear: ScenarioResult;
  startingMRR: number;
}

const ForecastChart = forwardRef<HTMLDivElement, Props>(({ bull, base, bear, startingMRR }, ref) => {
  const data = bull.months.map((m, i) => ({
    month: i,
    bull: m.mrr,
    base: base.months[i].mrr,
    bear: bear.months[i].mrr,
  }));

  const dangerCap = startingMRR * 1.2;

  return (
    <div ref={ref} className="bg-white rounded-lg border border-[#E5E7EB] p-5">
      <h2 className="sr-only">36-month forecast line chart showing bull, base, and bear cases</h2>
      <h3 className="text-[18px] font-medium text-[#111827]">The 36-month forecast: three paths, one decision</h3>
      <p className="text-[14px] text-[#6B7280] mt-1">
        The gap between bull and bear isn't luck. It's the assumptions you build today — hiring, churn, pricing, growth rate.
      </p>

      <div className="flex items-center gap-4 mt-4 text-[12px] text-[#111827]">
        {[
          { c: "#0A9E5E", l: "Bull" },
          { c: "#6366F1", l: "Base", dashed: true },
          { c: "#EF4444", l: "Bear" },
        ].map((x) => (
          <div key={x.l} className="flex items-center gap-2">
            <span className="inline-block w-[10px] h-[10px]" style={{ background: x.c, border: x.dashed ? `1px dashed ${x.c}` : "none" }} />
            <span>{x.l}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 380 }} className="mt-2">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 20, right: 60, bottom: 20, left: 10 }}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="month"
              ticks={[0, 6, 12, 18, 24, 30, 36]}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              stroke="#E5E7EB"
              label={{ value: "Month", position: "insideBottom", offset: -8, fill: "#6B7280", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(v) => "$" + Math.round(v / 1000) + "K"}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              stroke="#E5E7EB"
              label={{ value: "Monthly recurring revenue ($K)", angle: -90, position: "insideLeft", fill: "#6B7280", fontSize: 12, dy: 80 }}
            />
            <ReferenceArea y1={0} y2={dangerCap} fill="rgba(239,68,68,0.08)" stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5}>
              <Label value="Danger zone — cash-flow threshold" position="insideBottomLeft" fill="#EF4444" fontSize={10} />
            </ReferenceArea>
            <Tooltip
              formatter={(v: number, name) => [fmtDollars(v), String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
              labelFormatter={(l) => `Month ${l}`}
              contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E5E7EB" }}
            />
            <Line type="monotone" dataKey="bull" stroke="#0A9E5E" strokeWidth={2.5} dot={false} isAnimationActive={false}>
              <Label value={fmt(bull.endingMRR)} position="right" fill="#0A9E5E" fontSize={11} />
            </Line>
            <Line type="monotone" dataKey="base" stroke="#6366F1" strokeWidth={2.5} strokeDasharray="6 4" dot={false} isAnimationActive={false}>
              <Label value={fmt(base.endingMRR)} position="right" fill="#6366F1" fontSize={11} />
            </Line>
            <Line type="monotone" dataKey="bear" stroke="#EF4444" strokeWidth={2.5} dot={false} isAnimationActive={false}>
              <Label value={fmt(bear.endingMRR)} position="right" fill="#EF4444" fontSize={11} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-[#9CA3AF] mt-2">
        Illustrative model. Inputs: current MRR starting point, variable monthly growth and churn assumptions across three scenarios.
      </p>
    </div>
  );
});

ForecastChart.displayName = "ForecastChart";
export default ForecastChart;
