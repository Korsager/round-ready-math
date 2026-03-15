import React from "react";
import TooltipIcon from "./TooltipIcon";
import type { CalcResults, CalcInputs } from "@/hooks/useCalc";

interface Props {
  results: CalcResults;
  inputs: CalcInputs;
}

const SummaryBoxes: React.FC<Props> = ({ results, inputs }) => {
  const yearsNeeded = isFinite(results.yearsNeededAtMoic) ? results.yearsNeededAtMoic.toFixed(1) : "∞";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card text-center">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
          MOIC Needed <TooltipIcon text="Multiple needed to hit target IRR in your chosen timeline." />
        </p>
        <p className="text-2xl font-bold tabular-nums text-primary tracking-display">
          {results.moicNeededForTargetIrr.toFixed(1)}x
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">for {inputs.targetIrr}% IRR in {inputs.yearsToExit}y</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card text-center">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
          Years Needed <TooltipIcon text="Years needed at your MOIC to hit target IRR." />
        </p>
        <p className="text-2xl font-bold tabular-nums text-accent tracking-display">
          {yearsNeeded}y
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">at {inputs.targetMoic}x for {inputs.targetIrr}% IRR</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card text-center">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
          Max Hold Time <TooltipIcon text="Maximum years before IRR drops below target at your MOIC." />
        </p>
        <p className="text-2xl font-bold tabular-nums tracking-display">
          {results.maxHoldYears > 0 ? `${results.maxHoldYears.toFixed(1)}y` : "N/A"}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">before IRR {"<"} {inputs.targetIrr}%</p>
      </div>
    </div>
  );
};

export default SummaryBoxes;
