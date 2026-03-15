import React, { useState } from "react";
import { computeIrr } from "@/hooks/useCalc";
import type { CalcInputs } from "@/hooks/useCalc";

interface Props {
  inputs: CalcInputs;
}

const MOICS = [1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
const YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 10];

function getCellColor(irr: number, target: number): string {
  if (irr >= target) return "bg-primary/90 text-primary-foreground";
  if (irr >= target * 0.85) return "bg-primary/20 text-primary";
  if (irr >= target * 0.7) return "bg-warning-light text-warning-foreground";
  return "bg-muted text-muted-foreground";
}

const HeatmapGrid: React.FC<Props> = ({ inputs }) => {
  const [hoveredCell, setHoveredCell] = useState<{ y: number; m: number } | null>(null);
  const target = inputs.targetIrr;

  // Find closest cell to user's scenario
  const closestYear = YEARS.reduce((a, b) =>
    Math.abs(b - inputs.yearsToExit) < Math.abs(a - inputs.yearsToExit) ? b : a
  );
  const closestMoic = MOICS.reduce((a, b) =>
    Math.abs(b - inputs.targetMoic) < Math.abs(a - inputs.targetMoic) ? b : a
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
      <h3 className="text-sm font-semibold mb-1 tracking-display">
        IRR Heatmap: What MOIC do you need over different timelines?
      </h3>
      <p className="text-xs text-muted-foreground mb-6">
        Each cell shows IRR%. Green = meets {target}% target. Your scenario is highlighted with a ring.
      </p>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-center text-[11px] border-separate border-spacing-1 min-w-[600px]">
          <thead>
            <tr>
              <th className="p-2 text-muted-foreground font-normal text-left">Years ↓ MOIC →</th>
              {MOICS.map(m => (
                <th key={m} className="p-2 text-muted-foreground font-semibold">{m}x</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {YEARS.map(y => (
              <tr key={y}>
                <td className="p-2 font-bold text-muted-foreground text-left">{y}y</td>
                {MOICS.map(m => {
                  const irr = computeIrr(m, y);
                  const isUserScenario = y === closestYear && m === closestMoic;
                  const isHovered = hoveredCell?.y === y && hoveredCell?.m === m;
                  return (
                    <td
                      key={m}
                      className={`p-2 rounded-md transition-all duration-200 tabular-nums font-medium cursor-default
                        ${getCellColor(irr, target)}
                        ${isUserScenario ? "ring-2 ring-accent ring-offset-1" : ""}
                        ${isHovered ? "scale-110 shadow-md z-10 relative" : ""}
                      `}
                      onMouseEnter={() => setHoveredCell({ y, m })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${m}x in ${y}y → ${irr.toFixed(1)}% IRR`}
                    >
                      {irr.toFixed(0)}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeatmapGrid;
