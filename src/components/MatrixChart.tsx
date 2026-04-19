import { forwardRef } from "react";
import { buildMatrix } from "@/lib/forecast";
import type { ForecastInputs } from "@/lib/forecast";
import { fmt, fmtDollars } from "@/lib/format";

interface Props {
  inputs: ForecastInputs;
  onCellClick: (nrr: number, growth: number) => void;
}

// 5-stop gradient: red -> orange -> yellow -> lime -> green
const STOPS = ["#EF4444", "#F59E0B", "#FDE047", "#84CC16", "#0A9E5E"];

function hexToRgb(h: string) {
  const v = h.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function colorFor(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  const seg = clamped * (STOPS.length - 1);
  const i = Math.floor(seg);
  const f = seg - i;
  const c1 = hexToRgb(STOPS[i]);
  const c2 = hexToRgb(STOPS[Math.min(i + 1, STOPS.length - 1)]);
  return `rgb(${Math.round(lerp(c1[0], c2[0], f))},${Math.round(lerp(c1[1], c2[1], f))},${Math.round(lerp(c1[2], c2[2], f))})`;
}

const MatrixChart = forwardRef<HTMLDivElement, Props>(({ inputs, onCellClick }, ref) => {
  const { nrrRows, growCols, values, min, max } = buildMatrix(inputs);

  return (
    <div ref={ref} className="bg-white rounded-lg border border-[#E5E7EB] p-5">
      <h2 className="sr-only">NRR by monthly growth matrix of month-36 MRR outcomes</h2>
      <h3 className="text-[18px] font-medium text-[#111827]">Where will you be in 36 months? The two assumptions that decide everything.</h3>
      <p className="text-[14px] text-[#6B7280] mt-1">
        Starting MRR: {fmtDollars(inputs.startingMRR)}. Each cell shows the outcome at month 36 based on NRR and monthly growth rate alone.
      </p>

      <div className="mt-5 flex gap-4 overflow-x-auto">
        <div className="flex items-center">
          <div className="text-[11px] text-[#6B7280] whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            Net revenue retention (NRR)
          </div>
        </div>

        <div>
          {/* column headers */}
          <div className="flex pl-[44px] mb-1">
            {growCols.map((g) => (
              <div key={g} className="w-[64px] text-center text-[11px] text-[#6B7280]">{g}%</div>
            ))}
          </div>
          {nrrRows.slice().reverse().map((nrr) => {
            const rowIdx = nrrRows.indexOf(nrr);
            return (
              <div key={nrr} className="flex items-center">
                <div className="w-[44px] text-right pr-2 text-[11px] text-[#6B7280]">{nrr}%</div>
                {growCols.map((g, ci) => {
                  const v = values[rowIdx][ci];
                  const t = max > min ? (v - min) / (max - min) : 0.5;
                  const isMedian = nrr === 100 && (g === 5 || g === 6);
                  return (
                    <button
                      key={g}
                      onClick={() => onCellClick(nrr, g)}
                      className="w-[64px] h-[44px] m-[2px] rounded-md text-[12px] font-medium tabular-nums text-[#111827] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                      style={{
                        background: colorFor(t),
                        boxShadow: isMedian ? "inset 0 0 0 2px #3B82F6" : undefined,
                        borderStyle: isMedian ? "dashed" : undefined,
                      }}
                      aria-label={`NRR ${nrr}% growth ${g}% — ${fmt(v)}`}
                    >
                      {fmt(v)}
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div className="text-center text-[11px] text-[#6B7280] mt-2 pl-[44px]">Monthly new revenue growth rate</div>
          <div className="text-[11px] text-[#3B82F6] mt-1 pl-[44px]">Median founder lives here (NRR 100% × 5–6% growth)</div>
        </div>

        {/* color bar */}
        <div className="flex flex-col items-center pl-2">
          <div className="text-[10px] text-[#6B7280] mb-1">{fmt(max)}</div>
          <div className="w-[14px] h-[220px] rounded" style={{ background: `linear-gradient(to bottom, ${STOPS.slice().reverse().join(",")})` }} />
          <div className="text-[10px] text-[#6B7280] mt-1">{fmt(min)}</div>
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
