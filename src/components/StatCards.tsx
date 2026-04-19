import type { ScenarioResult } from "@/lib/forecast";
import { fmt } from "@/lib/format";

interface Props {
  bull: ScenarioResult;
  base: ScenarioResult;
  bear: ScenarioResult;
  startingMRR: number;
}

const CARDS = [
  { key: "bull", label: "Bull case m36", color: "#0A9E5E" },
  { key: "base", label: "Base case m36", color: "#6366F1" },
  { key: "bear", label: "Bear case m36", color: "#EF4444" },
] as const;

export default function StatCards({ bull, base, bear, startingMRR }: Props) {
  const map = { bull, base, bear };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {CARDS.map((c) => {
        const r = map[c.key];
        const pct = startingMRR > 0 ? Math.round(((r.endingMRR - startingMRR) / startingMRR) * 100) : 0;
        return (
          <div key={c.key} className="bg-white rounded-lg p-4" style={{ border: `1px solid ${c.color}` }}>
            <div className="text-[13px] text-[#6B7280]">{c.label}</div>
            <div className="text-[28px] font-medium tabular-nums leading-tight" style={{ color: c.color }}>
              {fmt(r.endingMRR)}
            </div>
            <div className="text-[12px] text-[#6B7280]">↑ {pct}% vs today</div>
          </div>
        );
      })}
    </div>
  );
}
