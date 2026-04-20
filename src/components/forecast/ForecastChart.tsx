import { forwardRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, Label, ResponsiveContainer,
} from "recharts";
import type { ScenarioResult } from "@/lib/forecast";
import { fmt, fmtDollars } from "@/lib/format";
import { monthCalendar } from "@/lib/dateAnchor";

interface Props {
  bull: ScenarioResult;
  base: ScenarioResult;
  bear: ScenarioResult;
  startingMRR: number;
  planStartDate?: string;
}

const ForecastChart = forwardRef<HTMLDivElement, Props>(({ bull, base, bear, startingMRR, planStartDate }, ref) => {
  const data = bull.months.map((_, i) => ({
    month: i,
    bull: bull.months[i].mrr,
    base: base.months[i].mrr,
    bear: bear.months[i].mrr,
  }));

  const dangerTop = startingMRR * 1.2;
  const horizon = base.horizonMonths;
  const ticks = horizon >= 60 ? [0, 12, 24, 36, 48, 60] : [0, 6, 12, 18, 24, 30, 36];

  return (
    <div ref={ref} className="bg-white rounded-lg border border-[#E5E7EB] p-6 mb-8">
      <h2 className="sr-only">{horizon}-month forecast line chart for bull, base, and bear scenarios</h2>
      <h3 className="text-[18px] font-medium text-[#111827]">The {horizon}-month forecast: three paths, one decision</h3>
      <p className="text-[14px] text-[#6B7280] mt-1 mb-3">
        The gap between bull and bear isn't luck. It's the assumptions you build today — hiring, churn, pricing, growth rate.
      </p>
      <div className="text-[15px] text-[#111827] mb-4">
        Your {horizon}-month Base case MRR is <span className="font-medium" style={{ color: "#6366F1" }}>{fmt(base.endingMRR)}</span>{" "}
        (Bull <span style={{ color: "#0A9E5E" }}>{fmt(bull.endingMRR)}</span> – Bear <span style={{ color: "#EF4444" }}>{fmt(bear.endingMRR)}</span>)
      </div>

      <div className="flex gap-4 mb-3 text-[12px] text-[#6B7280]">
        {[
          { c: "#0A9E5E", l: "Bull" },
          { c: "#6366F1", l: "Base" },
          { c: "#EF4444", l: "Bear" },
        ].map((x) => (
          <div key={x.l} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5" style={{ background: x.c }} />
            {x.l}
          </div>
        ))}
      </div>

      <div style={{ width: "100%", height: 380 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 60, left: 10, bottom: 20 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              ticks={ticks}
              stroke="#9CA3AF"
              tick={{ fontSize: 11, fill: "#6B7280" }}
            >
              <Label value="Month" position="insideBottom" offset={-10} style={{ fontSize: 12, fill: "#6B7280" }} />
            </XAxis>
            <YAxis
              tickFormatter={(v) => "$" + Math.round(v / 1000) + "K"}
              stroke="#9CA3AF"
              tick={{ fontSize: 11, fill: "#6B7280" }}
            >
              <Label value="Monthly recurring revenue ($K)" angle={-90} position="insideLeft" style={{ fontSize: 12, fill: "#6B7280", textAnchor: "middle" }} />
            </YAxis>
            <ReferenceArea y1={0} y2={dangerTop} fill="rgba(239,68,68,0.08)" stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.6}>
              <Label value="Danger zone — cash-flow threshold" position="insideBottomLeft" style={{ fontSize: 10, fill: "#EF4444" }} />
            </ReferenceArea>
            <Tooltip
              formatter={(v: number, name) => [fmtDollars(v), String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
              labelFormatter={(l) => planStartDate ? `Month ${l} (${monthCalendar(planStartDate, Number(l))})` : `Month ${l}`}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
            />
            <Line type="monotone" dataKey="bull" stroke="#0A9E5E" strokeWidth={2.5} dot={false} isAnimationActive={false}>
              <Label value={fmt(bull.endingMRR)} position="right" style={{ fontSize: 11, fill: "#0A9E5E" }} />
            </Line>
            <Line type="monotone" dataKey="base" stroke="#6366F1" strokeWidth={2.5} strokeDasharray="6 4" dot={false} isAnimationActive={false}>
              <Label value={fmt(base.endingMRR)} position="right" style={{ fontSize: 11, fill: "#6366F1" }} />
            </Line>
            <Line type="monotone" dataKey="bear" stroke="#EF4444" strokeWidth={2.5} dot={false} isAnimationActive={false}>
              <Label value={fmt(bear.endingMRR)} position="right" style={{ fontSize: 11, fill: "#EF4444" }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-[#9CA3AF] mt-3">
        Illustrative model. Inputs: current MRR starting point, variable monthly growth and churn assumptions across three scenarios.
      </p>
    </div>
  );
});

ForecastChart.displayName = "ForecastChart";
export default ForecastChart;
