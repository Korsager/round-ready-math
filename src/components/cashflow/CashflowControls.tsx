import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRESETS } from "@/lib/presets";
import type { CashflowInputs } from "@/lib/cashflow";
import type { ForecastInputs } from "@/lib/forecast";
import { fmtDollars } from "@/lib/format";

interface Props {
  inputs: CashflowInputs;
  onChange: (next: CashflowInputs) => void;
}

const cashFields: { key: keyof Omit<CashflowInputs, "forecast">; label: string; min: number; max: number; step: number; format: (v: number) => string }[] = [
  { key: "startingCash", label: "Starting cash", min: 0, max: 10_000_000, step: 50_000, format: fmtDollars },
  { key: "fundraiseAmount", label: "Fundraise amount", min: 0, max: 20_000_000, step: 100_000, format: fmtDollars },
  { key: "monthsUntilRaise", label: "Months until raise closes", min: 0, max: 24, step: 1, format: (v) => `${v} mo` },
  { key: "startingBurn", label: "Monthly OpEx (starting)", min: 10_000, max: 1_500_000, step: 5_000, format: fmtDollars },
  { key: "opexGrowthRate", label: "OpEx growth / mo", min: 0, max: 15, step: 0.5, format: (v) => `${v}%` },
  { key: "grossMargin", label: "Gross margin", min: 0, max: 100, step: 1, format: (v) => `${v}%` },
];

const revenueFields: { key: keyof ForecastInputs; label: string; min: number; max: number; step: number; format: (v: number) => string }[] = [
  { key: "startingMRR", label: "Starting MRR", min: 0, max: 500_000, step: 1_000, format: fmtDollars },
  { key: "monthlyNewBookings", label: "Monthly new bookings", min: 0, max: 100_000, step: 100, format: fmtDollars },
  { key: "monthlyGrowthRate", label: "MRR growth / mo", min: 0, max: 15, step: 0.5, format: (v) => `${v}%` },
  { key: "monthlyGrossChurnRate", label: "Gross churn / mo", min: 0, max: 10, step: 0.1, format: (v) => `${v.toFixed(1)}%` },
];

export default function CashflowControls({ inputs, onChange }: Props) {
  const setCash = (k: keyof Omit<CashflowInputs, "forecast">, v: number) =>
    onChange({ ...inputs, [k]: v });
  const setRev = (k: keyof ForecastInputs, v: number) =>
    onChange({ ...inputs, forecast: { ...inputs.forecast, [k]: v } });

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset?.values) onChange({ ...inputs, forecast: preset.values });
  };

  return (
    <div className="sticky top-14 z-40 bg-white/95 backdrop-blur border-b border-[#E5E7EB] py-3 sm:py-4">
      <div className="max-w-[1100px] mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <label className="text-[12px] sm:text-[13px] text-[#6B7280] shrink-0" htmlFor="cf-preset">Revenue preset</label>
          <Select onValueChange={applyPreset} defaultValue="custom">
            <SelectTrigger id="cf-preset" className="w-full sm:w-72 h-9 text-[13px]">
              <SelectValue placeholder="Choose preset" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#6B7280] mb-2 font-semibold">Cash & costs</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {cashFields.map((f) => (
              <div key={f.key} className="min-w-0">
                <div className="flex justify-between items-baseline mb-1.5 sm:mb-2 gap-1">
                  <label htmlFor={f.key} className="text-[11px] sm:text-[12px] text-[#6B7280] truncate">{f.label}</label>
                  <span className="text-[12px] sm:text-[13px] font-medium text-[#111827] tabular-nums shrink-0">{f.format(inputs[f.key])}</span>
                </div>
                <Slider id={f.key} min={f.min} max={f.max} step={f.step} value={[inputs[f.key]]} onValueChange={(v) => setCash(f.key, v[0])} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#6B7280] mb-2 font-semibold">Revenue assumptions</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {revenueFields.map((f) => (
              <div key={f.key} className="min-w-0">
                <div className="flex justify-between items-baseline mb-1.5 sm:mb-2 gap-1">
                  <label htmlFor={`rev-${f.key}`} className="text-[11px] sm:text-[12px] text-[#6B7280] truncate">{f.label}</label>
                  <span className="text-[12px] sm:text-[13px] font-medium text-[#111827] tabular-nums shrink-0">{f.format(inputs.forecast[f.key])}</span>
                </div>
                <Slider id={`rev-${f.key}`} min={f.min} max={f.max} step={f.step} value={[inputs.forecast[f.key]]} onValueChange={(v) => setRev(f.key, v[0])} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
