import { useMemo, useRef, useState } from "react";
import NavBar from "@/components/NavBar";
import CashflowControls from "@/components/cashflow/CashflowControls";
import CashflowChart from "@/components/cashflow/CashflowChart";
import RunwayCards from "@/components/cashflow/RunwayCards";
import CashflowTable from "@/components/cashflow/CashflowTable";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { simulateCashflow, type CashflowInputs } from "@/lib/cashflow";
import { useAssumptions } from "@/lib/assumptions";
import { toPng } from "html-to-image";
import { fmtDollars } from "@/lib/format";

export default function Cashflow() {
  const { assumptions, setCashflow, setForecast } = useAssumptions();
  const inputs: CashflowInputs = { ...assumptions.cashflow, forecast: assumptions.forecast };
  const setInputs = (next: CashflowInputs | ((p: CashflowInputs) => CashflowInputs)) => {
    const resolved = typeof next === "function" ? (next as (p: CashflowInputs) => CashflowInputs)(inputs) : next;
    const { forecast, ...cash } = resolved;
    setCashflow(cash);
    setForecast(forecast);
  };
  const result = useMemo(() => simulateCashflow(inputs, 36), [inputs]);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!exportRef.current) return;
    const dataUrl = await toPng(exportRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "cashflow-runway.png";
    link.href = dataUrl;
    link.click();
  };

  const burnMultiple = isFinite(result.burnMultiple) ? result.burnMultiple.toFixed(1) : "∞";
  const burnMultipleTone = !isFinite(result.burnMultiple) || result.burnMultiple > 2 ? "text-[#991B1B]" : "text-[#065F46]";

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <NavBar />
      <header className="max-w-[1100px] mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-2">
        <h1 className="text-[22px] sm:text-[28px] font-semibold text-[#111827] leading-tight">Cashflow & Runway</h1>
        <p className="text-[13px] sm:text-[14px] text-[#6B7280] mt-1">Tie revenue, costs, and your raise together. See exactly when you run out — and whether the round actually saves you.</p>
      </header>
      <CashflowControls inputs={inputs} onChange={setInputs} />
      <main className="max-w-[1100px] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div ref={exportRef} className="space-y-4 sm:space-y-6">
          <RunwayCards result={result} monthsUntilRaise={inputs.monthsUntilRaise} />
          <CashflowChart result={result} monthsUntilRaise={inputs.monthsUntilRaise} />
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5">
            <h3 className="text-[15px] font-semibold text-[#111827] mb-3">Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
              <div>
                <div className="text-[12px] text-[#6B7280]">Burn multiple (Y1)</div>
                <div className={`text-[20px] font-semibold tabular-nums ${burnMultipleTone}`}>{burnMultiple}x</div>
                <div className="text-[11px] text-[#6B7280]">Healthy &lt; 2x. Above 2x signals inefficient growth.</div>
              </div>
              <div>
                <div className="text-[12px] text-[#6B7280]">Runway after raise</div>
                <div className="text-[20px] font-semibold tabular-nums text-[#111827]">
                  {result.monthsRunwayAfterRaise === null ? "—" : `${result.monthsRunwayAfterRaise} mo`}
                </div>
                <div className="text-[11px] text-[#6B7280]">Months between raise close and zero cash.</div>
              </div>
              <div>
                <div className="text-[12px] text-[#6B7280]">Break-even month</div>
                <div className="text-[20px] font-semibold tabular-nums text-[#111827]">
                  {result.breakEvenMonth ? `Month ${result.breakEvenMonth}` : "Not within 36 mo"}
                </div>
                <div className="text-[11px] text-[#6B7280]">When gross profit covers OpEx.</div>
              </div>
            </div>
          </div>
          <CashflowTable result={result} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleExport} variant="outline" className="h-9 text-[13px]">
            <Download size={14} className="mr-1.5" /> Export PNG
          </Button>
        </div>
      </main>
    </div>
  );
}
