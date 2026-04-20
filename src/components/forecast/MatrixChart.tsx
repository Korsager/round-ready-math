import { forwardRef } from "react";
import type { ForecastInputs } from "@/lib/forecast";
import { buildMatrix } from "@/lib/forecast";
import { fmt, fmtDollars } from "@/lib/format";

interface Props {
  inputs: ForecastInputs;
  onCellClick: (nrr: number, growth: number) => void;
  horizonMonths?: number;
}

const STOPS = [
  { p: 0, c: [239, 68, 68] },
  { p: 0.25, c: [245, 158, 11] },
  { p: 0.5, c: [253, 224, 71] },
  { p: 0.75, c: [132, 204, 22] },
  { p: 1, c: [10, 158, 94] },
];

function colorFor(t: number): string {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i], b = STOPS[i + 1];
    if (t >= a.p && t <= b.p) {
      const r = (t - a.p) / (b.p - a.p);
      const c = a.c.map((v, j) => Math.round(v + (b.c[j] - v) * r));
      return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    }
  }
  return "rgb(10,158,94)";
}

const MatrixChart = forwardRef<HTMLDivElement, Props>(({ inputs, onCellClick, horizonMonths = 36 }, ref) => {
  const m = buildMatrix(inputs, horizonMonths);

  return (
    <div ref={ref} className="bg-white rounded-lg border border-[#E5E7EB] p-6 mb-8">
      <h2 className="sr-only">NRR by monthly growth matrix showing month {horizonMonths} MRR outcomes</h2>
      <h3 className="text-[18px] font-medium text-[#111827]">Where will you be in {horizonMonths} months? The two assumptions that decide everything.</h3>
      <p className="text-[14px] text-[#6B7280] mt-1 mb-5">
        Starting MRR: <span className="text-[#111827]">{fmtDollars(inputs.startingMRR)}</span>. Each cell shows the outcome at month {horizonMonths} based on NRR and monthly growth rate alone.
      </p>

      <div className="flex gap-4">
        <div className="flex items-center">
          <div className="text-[11px] text-[#6B7280]" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            Net revenue retention (NRR)
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <div className="inline-block min-w-full">
            <div className="grid" style={{ gridTemplateColumns: `48px repeat(${m.growCols.length}, 1fr)`, gap: 4 }}>
              <div />
              {m.growCols.map((g) => (
                <div key={g} className="text-[11px] text-[#6B7280] text-center">{g}%</div>
              ))}
              {m.nrrRows.map((nrr, ri) => (
                <div key={`row-${nrr}`} className="contents">
                  <div className="text-[11px] text-[#6B7280] text-right pr-2 self-center">{nrr}%</div>
                  {m.growCols.map((g, ci) => {
                    const v = m.values[ri][ci];
                    const t = (v - m.min) / (m.max - m.min || 1);
                    const isMedian = nrr === 100 && (g === 5 || g === 6);
                    return (
                      <button
                        key={`${nrr}-${g}`}
                        onClick={() => onCellClick(nrr, g)}
                        className="rounded-md text-[12px] font-medium text-[#111827] transition-shadow hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                        style={{
                          background: colorFor(t),
                          padding: 6,
                          minHeight: 44,
                          boxShadow: isMedian ? "inset 0 0 0 2px #3B82F6" : undefined,
                          borderStyle: isMedian ? "dashed" : undefined,
                        }}
                        title={`NRR ${nrr}% × Growth ${g}% → ${fmt(v)} MRR`}
                      >
                        {fmt(v)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="text-center text-[11px] text-[#6B7280] mt-3">Monthly new revenue growth rate</div>
            <div className="text-[11px] mt-1" style={{ color: "#3B82F6" }}>Median founder lives here (NRR 100%, growth 5–6%)</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-[10px] text-[#6B7280]">{fmt(m.max)}</div>
          <div style={{
            width: 14, height: 220, borderRadius: 4,
            background: "linear-gradient(to bottom, #0A9E5E, #84CC16, #FDE047, #F59E0B, #EF4444)",
          }} />
          <div className="text-[10px] text-[#6B7280]">{fmt(m.min)}</div>
        </div>
      </div>

      <p className="text-[11px] text-[#9CA3AF] mt-4">
        Illustrative model. NRR and growth rate benchmarks: SaaS Capital 2025; OpenView SaaS Benchmarks 2024.
      </p>
    </div>
  );
});

MatrixChart.displayName = "MatrixChart";
export default MatrixChart;
