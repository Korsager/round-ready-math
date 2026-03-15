import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CalcResults, CalcInputs } from "@/hooks/useCalc";

interface Props {
  results: CalcResults;
  inputs: CalcInputs;
}

const InsightsBox: React.FC<Props> = ({ results, inputs }) => {
  const [open, setOpen] = useState(true);

  const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;
  const irr5 = results.calculatedIrr;
  const irr10 = inputs.targetMoic > 0 ? ((Math.pow(inputs.targetMoic, 1 / 10) - 1) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold hover:bg-muted/50 transition-colors"
      >
        <span>💡 Insights & Warnings</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="px-6 pb-5 space-y-3 text-sm text-muted-foreground animate-fade-in">
          <p>
            At a <span className="font-semibold text-foreground">{fmtM(inputs.preMoney)}</span> pre-money,
            investors need ~<span className="font-semibold text-primary">{results.requiredMoic.toFixed(1)}x</span> in{" "}
            <span className="font-semibold text-foreground">{inputs.yearsToExit}</span> years to hit{" "}
            <span className="font-semibold text-primary">{inputs.targetIrr}% IRR</span> — is that realistic for your stage?
          </p>
          <p>
            ⏱ Time kills IRR: same <span className="font-semibold text-foreground">{inputs.targetMoic}x</span> MOIC gives{" "}
            <span className="font-semibold text-primary">{irr5.toFixed(0)}% IRR</span> in {inputs.yearsToExit}y → only{" "}
            <span className="font-semibold text-warning">{irr10.toFixed(0)}% IRR</span> in 10y.
          </p>
          <p className="text-xs italic text-muted-foreground/70">
            J-curve note: IRR dips early, spikes on exit — speed matters more than size sometimes. Assumes no further dilution until exit.
          </p>
        </div>
      )}
    </div>
  );
};

export default InsightsBox;
