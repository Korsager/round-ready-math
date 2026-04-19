import { useMemo } from "react";
import NavBar from "@/components/NavBar";
import AssumptionRow from "@/components/assumptions/AssumptionRow";
import { Button } from "@/components/ui/button";
import { RotateCcw, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAssumptions } from "@/lib/assumptions";
import { deriveAnnualNRR } from "@/lib/forecast";
import { PRESETS } from "@/lib/presets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};
const fmtPct = (digits = 1) => (v: number) => `${v.toFixed(digits)}%`;
const fmtNum = (suffix = "") => (v: number) => `${v.toLocaleString("en-US")}${suffix}`;
const fmtMoic = (v: number) => `${v.toFixed(1)}×`;

export default function Assumptions() {
  const { assumptions, setForecast, setCashflow, setFundraise, reset } = useAssumptions();
  const { fundraise, forecast, cashflow } = assumptions;

  const ownership = fundraise.dilutionPct / 100;
  const postMoney = ownership > 0 ? fundraise.raise / ownership : 0;
  const preMoney = postMoney - fundraise.raise;
  const nrr = useMemo(() => deriveAnnualNRR(forecast), [forecast]);

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(assumptions, null, 2));
    toast("Assumptions copied as JSON");
  };

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (p?.values) setForecast(p.values);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <NavBar />
      <header className="max-w-[1100px] mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] sm:text-[28px] font-semibold text-[#111827] leading-tight">Assumptions</h1>
            <p className="text-[13px] sm:text-[14px] text-[#6B7280] mt-1">Every number powering your model, in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={copyJson} variant="outline" size="sm" className="h-8 text-[12px]">
              <Copy size={13} className="mr-1.5" /> Copy JSON
            </Button>
            <Button onClick={() => { reset(); toast("Reset to defaults"); }} variant="outline" size="sm" className="h-8 text-[12px]">
              <RotateCcw size={13} className="mr-1.5" /> Reset all
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-3 sm:px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fundraise */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5">
          <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Fundraise</h2>
          <p className="text-[11px] text-[#9CA3AF] mb-2">From the Fundraise Math page.</p>
          <AssumptionRow label="Raise amount" description="Total capital you're raising this round." value={fundraise.raise} format={fmtUsd} onChange={(v) => setFundraise({ ...fundraise, raise: v })} />
          <AssumptionRow label="Dilution" description="% of company sold to new investors." value={fundraise.dilutionPct} format={fmtPct(1)} onChange={(v) => setFundraise({ ...fundraise, dilutionPct: v })} />
          <AssumptionRow label="Pre-money" description="Implied valuation before the raise." value={preMoney} format={fmtUsd} derived />
          <AssumptionRow label="Post-money" description="Pre-money + raise amount." value={postMoney} format={fmtUsd} derived />
          <AssumptionRow label="Target IRR" description="Annualized return investors expect." value={fundraise.targetIrr} format={fmtPct(0)} onChange={(v) => setFundraise({ ...fundraise, targetIrr: v })} />
          <AssumptionRow label="Years to exit" description="Holding period assumption." value={fundraise.yearsToExit} format={fmtNum(" yr")} onChange={(v) => setFundraise({ ...fundraise, yearsToExit: v })} />
          <AssumptionRow label="Target MOIC" description="Multiple on invested capital at exit." value={fundraise.targetMoic} format={fmtMoic} onChange={(v) => setFundraise({ ...fundraise, targetMoic: v })} />
        </section>

        {/* Revenue */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[14px] font-semibold text-[#111827]">Revenue</h2>
            <Select onValueChange={applyPreset}>
              <SelectTrigger className="h-7 w-[140px] text-[11px]"><SelectValue placeholder="Preset" /></SelectTrigger>
              <SelectContent>
                {PRESETS.filter((p) => p.values).map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-[12px]">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11px] text-[#9CA3AF] mb-2">Drives the 36-month forecast.</p>
          <AssumptionRow label="Starting MRR" description="MRR at month 0." value={forecast.startingMRR} format={fmtUsd} onChange={(v) => setForecast({ ...forecast, startingMRR: v })} />
          <AssumptionRow label="Monthly new bookings" description="New MRR added each month before growth." value={forecast.monthlyNewBookings} format={fmtUsd} onChange={(v) => setForecast({ ...forecast, monthlyNewBookings: v })} />
          <AssumptionRow label="Growth rate" description="Month-over-month bookings growth." value={forecast.monthlyGrowthRate} format={fmtPct(1)} onChange={(v) => setForecast({ ...forecast, monthlyGrowthRate: v })} />
          <AssumptionRow label="Gross churn" description="% MRR lost to cancellations / month." value={forecast.monthlyGrossChurnRate} format={fmtPct(2)} onChange={(v) => setForecast({ ...forecast, monthlyGrossChurnRate: v })} />
          <AssumptionRow label="Downgrades" description="% MRR lost to plan downgrades / month." value={forecast.monthlyDowngradeRate} format={fmtPct(2)} onChange={(v) => setForecast({ ...forecast, monthlyDowngradeRate: v })} />
          <AssumptionRow label="Expansion" description="% MRR gained from upsells / month." value={forecast.monthlyExpansionRate} format={fmtPct(2)} onChange={(v) => setForecast({ ...forecast, monthlyExpansionRate: v })} />
          <AssumptionRow label="Hiring ramp" description="Days for new reps to reach full productivity." value={forecast.hiringLagDays} format={fmtNum(" days")} onChange={(v) => setForecast({ ...forecast, hiringLagDays: v })} />
          <AssumptionRow label="Annual NRR" description="Compounded from churn, downgrades & expansion." value={nrr} format={fmtPct(1)} derived />
        </section>

        {/* Cashflow */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5">
          <h2 className="text-[14px] font-semibold text-[#111827] mb-1">Cashflow</h2>
          <p className="text-[11px] text-[#9CA3AF] mb-2">Burn, runway & raise timing.</p>
          <AssumptionRow label="Starting cash" description="Cash in the bank today." value={cashflow.startingCash} format={fmtUsd} onChange={(v) => setCashflow({ ...cashflow, startingCash: v })} />
          <AssumptionRow label="Fundraise amount" description="Capital landing at the raise close." value={cashflow.fundraiseAmount} format={fmtUsd} onChange={(v) => setCashflow({ ...cashflow, fundraiseAmount: v })} />
          <AssumptionRow label="Months until raise" description="Months from today until cash hits." value={cashflow.monthsUntilRaise} format={fmtNum(" mo")} onChange={(v) => setCashflow({ ...cashflow, monthsUntilRaise: v })} />
          <AssumptionRow label="Starting OpEx" description="Total monthly operating expense at month 0." value={cashflow.startingBurn} format={fmtUsd} onChange={(v) => setCashflow({ ...cashflow, startingBurn: v })} />
          <AssumptionRow label="OpEx growth" description="Month-over-month OpEx increase." value={cashflow.opexGrowthRate} format={fmtPct(1)} onChange={(v) => setCashflow({ ...cashflow, opexGrowthRate: v })} />
          <AssumptionRow label="Gross margin" description="% of revenue that becomes gross profit." value={cashflow.grossMargin} format={fmtPct(0)} onChange={(v) => setCashflow({ ...cashflow, grossMargin: v })} />
        </section>
      </main>

      <footer className="max-w-[1100px] mx-auto px-4 py-8 text-center text-[12px] text-[#6B7280]">
        Changes here flow into the Forecast and Cashflow pages. Stored locally in your browser.
      </footer>
    </div>
  );
}
