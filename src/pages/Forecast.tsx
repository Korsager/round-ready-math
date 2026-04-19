import { useMemo, useRef } from "react";
import NavBar from "@/components/NavBar";
import AssumptionsBanner from "@/components/AssumptionsBanner";
import StatCards from "@/components/forecast/StatCards";
import ForecastChart from "@/components/forecast/ForecastChart";
import MatrixChart from "@/components/forecast/MatrixChart";
import WaterfallChart from "@/components/forecast/WaterfallChart";
import ExportButtons from "@/components/forecast/ExportButtons";
import type { ForecastInputs } from "@/lib/forecast";
import { runScenario, buildWaterfall, deriveAnnualNRR } from "@/lib/forecast";
import { useAssumptions } from "@/lib/assumptions";

export default function Forecast() {
  const { assumptions, setForecast } = useAssumptions();
  const inputs = assumptions.forecast;

  const { bull, base, bear, waterfall } = useMemo(() => {
    const b = runScenario(inputs, "base");
    return {
      bull: runScenario(inputs, "bull"),
      base: b,
      bear: runScenario(inputs, "bear"),
      waterfall: buildWaterfall(b.months),
    };
  }, [inputs]);

  const forecastRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);
  const waterfallRef = useRef<HTMLDivElement>(null);

  const onCellClick = (nrr: number, growth: number) => {
    setForecast((p: ForecastInputs) => {
      const baseNet = -p.monthlyGrossChurnRate - p.monthlyDowngradeRate + p.monthlyExpansionRate;
      const targetMonthlyFactor = Math.pow(nrr / 100, 1 / 12);
      const targetNet = (targetMonthlyFactor - 1) * 100;
      const scale = baseNet === 0 ? 1 : targetNet / baseNet;
      return {
        ...p,
        monthlyGrowthRate: growth,
        monthlyGrossChurnRate: p.monthlyGrossChurnRate * scale,
        monthlyDowngradeRate: p.monthlyDowngradeRate * scale,
        monthlyExpansionRate: p.monthlyExpansionRate * scale,
      };
    });
  };

  const nrr = deriveAnnualNRR(inputs);

  return (
    <div className="min-h-screen bg-white text-[#111827]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <NavBar />

      <header className="max-w-[1100px] mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-3 sm:pb-4">
        <h1 className="text-[22px] sm:text-[28px] font-medium leading-tight">The 36-month revenue forecast</h1>
        <p className="text-[13px] sm:text-[15px] text-[#6B7280] mt-1">Three paths. One decision. The number every investor checks.</p>
        <p className="text-[11px] sm:text-[12px] text-[#9CA3AF] mt-1">An interactive tool based on the framework from The Founders Corner.</p>
      </header>

      <AssumptionsBanner>
        Growth {inputs.monthlyGrowthRate}%/mo · Gross churn {inputs.monthlyGrossChurnRate.toFixed(1)}% · NRR {nrr.toFixed(0)}%
      </AssumptionsBanner>

      <main className="max-w-[1100px] mx-auto px-4 py-4">
        <StatCards startingMRR={inputs.startingMRR} bull={bull} base={base} bear={bear} />
        <ForecastChart ref={forecastRef} bull={bull} base={base} bear={bear} startingMRR={inputs.startingMRR} />
        <MatrixChart ref={matrixRef} inputs={inputs} onCellClick={onCellClick} />
        <WaterfallChart ref={waterfallRef} data={waterfall} />
        <ExportButtons
          bull={bull} base={base} bear={bear}
          forecastRef={forecastRef} matrixRef={matrixRef} waterfallRef={waterfallRef}
        />
      </main>

      <footer className="max-w-[1100px] mx-auto px-4 py-8 text-center text-[12px] text-[#6B7280] border-t border-[#E5E7EB] mt-4">
        Framework from The Founders Corner — The Number Every Investor Checks. All scenarios are illustrative.
        Validate your assumptions against SaaS Capital 2025, OpenView SaaS Benchmarks 2024, and Bessemer State of the Cloud 2025 before sharing with investors.
      </footer>
    </div>
  );
}
