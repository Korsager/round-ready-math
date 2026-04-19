import { useMemo, useRef, useState } from "react";
import ControlPanel from "@/components/ControlPanel";
import StatCards from "@/components/StatCards";
import ForecastChart from "@/components/ForecastChart";
import MatrixChart from "@/components/MatrixChart";
import WaterfallChart from "@/components/WaterfallChart";
import ExportButtons from "@/components/ExportButtons";
import { runScenario, buildWaterfall, type ForecastInputs } from "@/lib/forecast";
import { fmt } from "@/lib/format";
import { toast } from "sonner";

const DEFAULTS: ForecastInputs = {
  startingMRR: 10000,
  monthlyNewBookings: 2000,
  monthlyGrowthRate: 6,
  annualNRR: 100,
  hiringLagDays: 75,
};

export default function Index() {
  const [inputs, setInputs] = useState<ForecastInputs>(DEFAULTS);
  const [stressActive, setStressActive] = useState(false);
  const stressBackup = useRef<ForecastInputs | null>(null);

  const forecastRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);
  const waterfallRef = useRef<HTMLDivElement>(null);

  const { bull, base, bear, waterfall } = useMemo(() => {
    const bull = runScenario(inputs, "bull");
    const base = runScenario(inputs, "base");
    const bear = runScenario(inputs, "bear");
    const waterfall = buildWaterfall(base.months);
    return { bull, base, bear, waterfall };
  }, [inputs]);

  const handleStress = () => {
    if (stressActive) return;
    stressBackup.current = inputs;
    setStressActive(true);
    toast("Stress testing...");
    setInputs({
      ...inputs,
      annualNRR: Math.max(50, inputs.annualNRR - 20),
      monthlyGrowthRate: inputs.monthlyGrowthRate * 0.5,
    });
    setTimeout(() => {
      if (stressBackup.current) setInputs(stressBackup.current);
      setStressActive(false);
    }, 3000);
  };

  const handleCellClick = (nrr: number, growth: number) => {
    setInputs({ ...inputs, annualNRR: nrr, monthlyGrowthRate: growth });
  };

  return (
    <div className="min-h-screen bg-white text-[#111827]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <ControlPanel inputs={inputs} setInputs={setInputs} onStressTest={handleStress} stressActive={stressActive} />

      <main className="max-w-[1100px] mx-auto px-4 py-8 space-y-8">
        <header>
          <h1 className="text-[28px] font-medium tracking-tight">The 36-month revenue forecast</h1>
          <p className="text-[15px] text-[#6B7280] mt-1">Three paths. One decision. The number every investor checks.</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">An interactive tool based on the framework from The Founders Corner.</p>
        </header>

        <StatCards bull={bull} base={base} bear={bear} startingMRR={inputs.startingMRR} />

        <div className="text-[15px] text-[#111827]">
          Your 36-month Base case MRR is <span className="font-medium">{fmt(base.endingMRR)}</span> (Bull {fmt(bull.endingMRR)} – Bear {fmt(bear.endingMRR)})
        </div>

        <ForecastChart ref={forecastRef} bull={bull} base={base} bear={bear} startingMRR={inputs.startingMRR} />
        <MatrixChart ref={matrixRef} inputs={inputs} onCellClick={handleCellClick} />
        <WaterfallChart ref={waterfallRef} data={waterfall} />

        <ExportButtons bull={bull} base={base} bear={bear} forecastRef={forecastRef} matrixRef={matrixRef} waterfallRef={waterfallRef} />

        <footer className="text-center text-[12px] text-[#6B7280] pt-6 pb-10">
          Framework from The Founders Corner — The Number Every Investor Checks. All scenarios are illustrative. Validate your assumptions against SaaS Capital 2025, OpenView SaaS Benchmarks 2024, and Bessemer State of the Cloud 2025 before sharing with investors.
        </footer>
      </main>
    </div>
  );
}
