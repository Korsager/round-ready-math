import React, { useCallback } from "react";
import { Copy, Save, RotateCcw } from "lucide-react";
import { useCalc } from "@/hooks/useCalc";
import InputsSection from "@/components/InputsSection";
import ResultsDashboard from "@/components/ResultsDashboard";
import HeatmapGrid from "@/components/HeatmapGrid";
import SummaryBoxes from "@/components/SummaryBoxes";
import InsightsBox from "@/components/InsightsBox";
import { toast } from "sonner";

const Index = () => {
  const { inputs, update, reset, results } = useCalc();

  const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

  const copyResults = useCallback(() => {
    const text = [
      `Fundraise Math Results`,
      `─────────────────────`,
      `Raising: ${fmtM(inputs.raise)}`,
      `Dilution: ${inputs.dilutionPct}%`,
      `Post-Money: ${fmtM(results.postMoney)}`,
      `Investor Ownership: ${fmtPct(results.investorOwnership)}`,
      `Price/Share: $${results.pricePerShare.toFixed(2)}`,
      ``,
      `Target IRR: ${inputs.targetIrr}%`,
      `Required Exit: ${fmtM(results.requiredExitValue)}`,
      `Required MOIC: ${results.requiredMoic.toFixed(1)}x`,
      `Your MOIC (${inputs.targetMoic}x) IRR: ${results.calculatedIrr.toFixed(1)}%`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Results copied to clipboard");
  }, [inputs, results]);

  const saveScenario = useCallback(() => {
    const scenarios = JSON.parse(localStorage.getItem("fm-scenarios") || "[]");
    scenarios.push({ inputs, results, timestamp: Date.now() });
    localStorage.setItem("fm-scenarios", JSON.stringify(scenarios));
    toast.success("Scenario saved");
  }, [inputs, results]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-display">Fundraise Math</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Know your numbers. Negotiate like a pro.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyResults}
              className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              <Copy size={14} />
              <span className="hidden sm:inline">Copy</span>
            </button>
            <button
              onClick={saveScenario}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              <Save size={14} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Subtitle */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 pb-2">
        <p className="text-sm text-muted-foreground">
          Adjust your round → see dilution, required exit, MOIC & IRR instantly.{" "}
          <span className="text-xs italic">All calculations update live. Hover any <span className="text-accent">ⓘ</span> for explanation.</span>
        </p>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Inputs */}
          <section className="lg:col-span-5">
            <InputsSection inputs={inputs} update={update} reset={reset} />
          </section>

          {/* Results */}
          <section className="lg:col-span-7 space-y-4 sm:space-y-6">
            <ResultsDashboard results={results} inputs={inputs} />
            <SummaryBoxes results={results} inputs={inputs} />
          </section>
        </div>

        {/* Heatmap */}
        <div className="mt-6 sm:mt-8">
          <HeatmapGrid inputs={inputs} />
        </div>

        {/* Insights */}
        <div className="mt-6 sm:mt-8">
          <InsightsBox results={results} inputs={inputs} />
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-[10px] text-muted-foreground">
        Fundraise Math — For informational purposes only. Not financial advice.
      </footer>
    </div>
  );
};

export default Index;
