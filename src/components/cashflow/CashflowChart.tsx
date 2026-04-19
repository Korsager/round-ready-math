import { forwardRef } from "react";
import { ComposedChart, Area, Bar, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import type { CashflowResult } from "@/lib/cashflow";
import { fmt } from "@/lib/format";

interface Props {
  result: CashflowResult;
  monthsUntilRaise: number;
}

const CashflowChart = forwardRef<HTMLDivElement, Props>(({ result, monthsUntilRaise }, ref) => {
  const data = result.months.map((m) => ({
    month: m.month,
    cash: Math.round(m.cashBalance),
    burn: m.netBurn > 0 ? -Math.round(m.netBurn) : 0,
    profit: m.netBurn < 0 ? -Math.round(m.netBurn) : 0,
    revenue: Math.round(m.revenue),
  }));

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
      <h3 className="text-[15px] font-semibold text-[#111827] mb-1">Cash balance over 36 months</h3>
      <p className="text-[12px] text-[#6B7280] mb-4">Blue area = cash on hand. Red bars = monthly burn. Green bars = monthly profit. Dashed line = raise closes.</p>
      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <defs>
              <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => fmt(v)} />
            <Tooltip
              formatter={(value: number, name: string) => [fmt(value), name]}
              labelFormatter={(l) => `Month ${l}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={0} stroke="#9CA3AF" />
            {monthsUntilRaise > 0 && monthsUntilRaise <= 36 && (
              <ReferenceLine x={monthsUntilRaise} stroke="#10B981" strokeDasharray="4 4" label={{ value: "Raise", fill: "#10B981", fontSize: 11, position: "top" }} />
            )}
            {result.runwayMonth !== null && (
              <ReferenceLine x={result.runwayMonth} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "Out of cash", fill: "#EF4444", fontSize: 11, position: "top" }} />
            )}
            <Area type="monotone" dataKey="cash" name="Cash balance" stroke="#6366F1" strokeWidth={2} fill="url(#cashFill)" />
            <Bar dataKey="burn" name="Monthly burn" fill="#EF4444" opacity={0.7} />
            <Bar dataKey="profit" name="Monthly profit" fill="#10B981" opacity={0.7} />
            <Line type="monotone" dataKey="revenue" name="Revenue (MRR)" stroke="#6B7280" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
