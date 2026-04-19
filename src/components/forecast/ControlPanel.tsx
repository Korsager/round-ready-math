import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PRESETS } from "@/lib/presets";
import type { ForecastInputs } from "@/lib/forecast";
import { fmtDollars } from "@/lib/format";

interface Props {
  inputs: ForecastInputs;
  onChange: (next: ForecastInputs) => void;
  onStressTest: () => void;
  stressing: boolean;
}

const fields: { key: keyof ForecastInputs; label: string; min: number; max: number; step: number; format: (v: number) => string }[] = [
  { key: "startingMRR", label: "Starting MRR", min: 1000, max: 500000, step: 1000, format: fmtDollars },
  { key: "monthlyNewBookings", label: "Monthly new bookings", min: 200, max: 100000, step: 100, format: fmtDollars },
  { key: "monthlyGrowthRate", label: "Monthly growth rate", min: 0, max: 15, step: 0.5, format: (v) => `${v}%` },
  { key: "annualNRR", label: "Annual NRR", min: 70, max: 130, step: 1, format: (v) => `${v}%` },
  { key: "hiringLagDays", label: "Hiring ramp", min: 0, max: 180, step: 15, format: (v) => `${v} days` },
];

export default function ControlPanel({ inputs, onChange, onStressTest, stressing }: Props) {
  const setField = (key: keyof ForecastInputs, v: number) => onChange({ ...inputs, [key]: v });

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset?.values) onChange(preset.values);
  };

  return (
    <div className="sticky top-14 z-40 bg-white/95 backdrop-blur border-b border-[#E5E7EB] py-4">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <label className="text-[13px] text-[#6B7280]" htmlFor="preset">Business model preset</label>
          <Select onValueChange={applyPreset} defaultValue="custom">
            <SelectTrigger id="preset" className="w-full md:w-72 h-9 text-[13px]">
              <SelectValue placeholder="Choose preset" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={onStressTest}
            disabled={stressing}
            variant="outline"
            className="h-9 text-[13px] border-[#EF4444] text-[#EF4444] hover:bg-[#FEE2E2] hover:text-[#991B1B]"
          >
            {stressing ? "Stress testing…" : "Stress test"}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <div className="flex justify-between items-baseline mb-2">
                <label htmlFor={f.key} className="text-[12px] text-[#6B7280]">{f.label}</label>
                <span className="text-[13px] font-medium text-[#111827] tabular-nums">{f.format(inputs[f.key])}</span>
              </div>
              <Slider
                id={f.key}
                min={f.min}
                max={f.max}
                step={f.step}
                value={[inputs[f.key]]}
                onValueChange={(v) => setField(f.key, v[0])}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
