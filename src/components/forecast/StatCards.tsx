import type { ScenarioResult } from "@/lib/forecast";
import { fmt } from "@/lib/format";

interface Props {
  startingMRR: number;
  bull: ScenarioResult;
  base: ScenarioResult;
  bear: ScenarioResult;
}

const Card = ({ label, value, color, delta }: { label: string; value: number; color: string; delta: number }) => (
  <div className="bg-white rounded-lg p-4" style={{ border: `1px solid ${color}` }}>
    <div className="text-[13px] text-[#6B7280] mb-1">{label}</div>
    <div className="text-[28px] font-medium tabular-nums leading-tight" style={{ color }}>{fmt(value)}</div>
    <div className="text-[12px] text-[#6B7280] mt-1">↑ {Math.round(delta)}% vs today</div>
  </div>
);

export default function StatCards({ startingMRR, bull, base, bear }: Props) {
  const d = (v: number) => ((v - startingMRR) / startingMRR) * 100;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card label="Bull case m36" value={bull.endingMRR} color="#0A9E5E" delta={d(bull.endingMRR)} />
      <Card label="Base case m36" value={base.endingMRR} color="#6366F1" delta={d(base.endingMRR)} />
      <Card label="Bear case m36" value={bear.endingMRR} color="#EF4444" delta={d(bear.endingMRR)} />
    </div>
  );
}
