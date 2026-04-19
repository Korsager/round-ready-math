import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ForecastInputs } from "@/lib/forecast";
import { PRESETS } from "@/lib/presets";
import { fmtDollars } from "@/lib/format";

interface Props {
  inputs: ForecastInputs;
  setInputs: (i: ForecastInputs) => void;
  onStressTest: () => void;
  stressActive: boolean;
}

const FIELDS: { key: keyof ForecastInputs; label: string; min: number; max: number; step: number; format: (v: number) => string }[] = [
  { key: "startingMRR", label: "Starting MRR", min: 1000, max: 500000, step: 1000, format: (v) => fmtDollars(v) },
  { key: "monthlyNewBookings", label: "Monthly new bookings", min: 200, max: 100000, step: 100, format: (v) => fmtDollars(v) },
  { key: "monthlyGrowthRate", label: "Monthly growth rate", min: 0, max: 15, step: 0.5, format: (v) => `${v}%` },
  { key: "annualNRR", label: "Annual NRR", min: 70, max: 130, step: 1, format: (v) => `${v}%` },
  { key: "hiringLagDays", label: "Hiring ramp", min: 0, max: 180, step: 15, format: (v) => `${v} days` },
];

export default function ControlPanel({ inputs, setInputs, onStressTest, stressActive }: Props) {
  const update = (k: keyof ForecastInputs, v: number) => setInputs({ ...inputs, [k]: v });

  const handlePreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (p?.inputs) setInputs(p.inputs);
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E5E7EB]">
      <div className="max-w-[1100px] mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <label className="text-[13px] text-[#6B7280]" htmlFor="preset">Business model preset</label>
          <Select onValueChange={handlePreset}>
            <SelectTrigger id="preset" className="w-[220px] h-9 text-[13px]">
              <SelectValue placeholder="Custom" />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={onStressTest}
            disabled={stressActive}
            className="ml-auto h-9 text-[13px] border-[#EF4444] text-[#EF4444] hover:bg-[#FEE2E2] hover:text-[#EF4444]"
          >
            {stressActive ? "Stress testing..." : "Stress test"}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor={f.key} className="text-[12px] text-[#6B7280]">{f.label}</label>
                <span className="text-[12px] font-medium text-[#111827] tabular-nums">{f.format(inputs[f.key])}</span>
              </div>
              <Slider
                id={f.key}
                min={f.min}
                max={f.max}
                step={f.step}
                value={[inputs[f.key]]}
                onValueChange={(v) => update(f.key, v[0])}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
