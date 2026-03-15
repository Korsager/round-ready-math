import React, { useState, useCallback } from "react";
import {
  Rocket, ArrowUpRight, TrendingUp, DollarSign, PieChart,
  BarChart3, Target, RotateCcw, ChevronDown, ChevronUp
} from "lucide-react";
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as ReTooltip
} from "recharts";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import rocketImg from "@/assets/rocket-launch.png";

/* ── Calc Engine (inline) ── */
interface Inputs {
  raise: number;
  dilutionPct: number;
  targetIrr: number;
  yearsToExit: number;
  targetMoic: number;
}
const DEFAULTS: Inputs = { raise: 2_000_000, dilutionPct: 20, targetIrr: 30, yearsToExit: 5, targetMoic: 4 };

function compute(i: Inputs) {
  const ownership = i.dilutionPct / 100;
  const postMoney = ownership > 0 ? i.raise / ownership : 0;
  const preMoney = postMoney - i.raise;
  const irrDec = i.targetIrr / 100;
  const reqReturn = i.raise * Math.pow(1 + irrDec, i.yearsToExit);
  const reqExit = ownership > 0 ? reqReturn / ownership : 0;
  const reqMoic = i.raise > 0 ? reqReturn / i.raise : 0;
  const calcIrr = i.yearsToExit > 0 && i.targetMoic > 0
    ? (Math.pow(i.targetMoic, 1 / i.yearsToExit) - 1) * 100 : 0;
  return { postMoney, preMoney, ownership, reqExit, reqMoic, calcIrr };
}

/* ── Helpers ── */
const fmtM = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

/* ── Slider Input ── */
const SliderInput = ({
  label, value, onChange, min, max, step, format, tooltip
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string; tooltip: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-sm font-bold text-foreground tabular-nums">{format(value)}</span>
        </div>
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to right, hsl(217,91%,60%) ${((value - min) / (max - min)) * 100}%, hsl(220,13%,91%) ${((value - min) / (max - min)) * 100}%)`
          }}
        />
      </div>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[200px] text-xs">{tooltip}</TooltipContent>
  </Tooltip>
);

/* ── Metric Card ── */
const MetricCard = ({
  label, value, sub, icon: Icon, color, tooltip
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; tooltip: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-default">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${color}`}>
            <Icon size={15} />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </TooltipTrigger>
    <TooltipContent className="max-w-[220px] text-xs">{tooltip}</TooltipContent>
  </Tooltip>
);

/* ── Main Page ── */
const Index = () => {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const update = useCallback((k: keyof Inputs, v: number) => setInputs(p => ({ ...p, [k]: v })), []);
  const reset = useCallback(() => setInputs(DEFAULTS), []);
  const r = compute(inputs);

  const ownershipData = [
    { name: "Founders", value: +(100 - inputs.dilutionPct).toFixed(1) },
    { name: "Investors", value: +inputs.dilutionPct.toFixed(1) },
  ];
  const PIE_COLORS = ["hsl(217, 91%, 60%)", "hsl(160, 84%, 39%)"];

  const efficiencyScore = Math.max(0, Math.min(100,
    Math.round(100 - Math.abs(inputs.dilutionPct - 20) * 1.5 - Math.max(0, r.reqMoic - 5) * 3)
  ));
  const effLabel = efficiencyScore >= 75 ? "Strong" : efficiencyScore >= 50 ? "Moderate" : "Weak";
  const effColor = efficiencyScore >= 75 ? "bg-emerald-100 text-emerald-700" : efficiencyScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

  const irrStatus = r.calcIrr >= inputs.targetIrr ? "text-emerald-600" : r.calcIrr >= inputs.targetIrr * 0.7 ? "text-amber-600" : "text-destructive";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="text-primary" size={22} />
            <span className="text-lg font-bold text-foreground tracking-tight">Fundraise Math</span>
          </div>
          <p className="hidden sm:block text-xs text-muted-foreground">Know your numbers. Negotiate like a pro.</p>
          <button onClick={reset} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Greeting */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Fundraise Math Dashboard 🚀
          </h1>
          <p className="text-muted-foreground mt-1">Adjust your round → see valuation, dilution, IRR & required exit instantly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT: Inputs + Illustration ── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Input Card */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-md animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" /> Adjust Your Round
              </h3>
              <div className="space-y-5">
                <SliderInput
                  label="Raise Amount" value={inputs.raise}
                  onChange={(v) => update("raise", v)}
                  min={100_000} max={20_000_000} step={100_000}
                  format={fmtM}
                  tooltip="How much capital you're raising in this round."
                />
                <SliderInput
                  label="Dilution %" value={inputs.dilutionPct}
                  onChange={(v) => update("dilutionPct", v)}
                  min={1} max={50} step={0.5}
                  format={(v) => `${v}%`}
                  tooltip="Percentage of ownership you give to investors."
                />
                <SliderInput
                  label="Target IRR" value={inputs.targetIrr}
                  onChange={(v) => update("targetIrr", v)}
                  min={5} max={100} step={1}
                  format={(v) => `${v}%`}
                  tooltip="Annual return rate investors expect."
                />
                <SliderInput
                  label="Years to Exit" value={inputs.yearsToExit}
                  onChange={(v) => update("yearsToExit", v)}
                  min={1} max={12} step={1}
                  format={(v) => `${v}yr`}
                  tooltip="Expected time horizon until exit/liquidity event."
                />
                <SliderInput
                  label="Your MOIC" value={inputs.targetMoic}
                  onChange={(v) => update("targetMoic", v)}
                  min={1} max={20} step={0.5}
                  format={(v) => `${v}×`}
                  tooltip="Multiple on Invested Capital — how many times the investment returns."
                />
              </div>
            </div>

            {/* Illustration */}
            <div className="flex justify-center animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <img src={rocketImg} alt="Growth" className="w-48 sm:w-56 drop-shadow-xl animate-pulse-gentle opacity-90" />
            </div>
          </div>

          {/* ── CENTER: Main Cards ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Post-Money Card (blue) */}
            <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-lg animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <h3 className="text-sm font-medium opacity-80 mb-3">Post-Money Valuation</h3>
              <p className="text-4xl sm:text-5xl font-bold mb-1 tabular-nums">{fmtM(r.postMoney)}</p>
              <p className="text-xs opacity-70 mb-5">Pre-Money: {fmtM(r.preMoney)} · Raising {fmtM(inputs.raise)}</p>

              <div className="flex items-center gap-5">
                <div className="w-28 h-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie data={ownershipData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={48} strokeWidth={0}>
                        {ownershipData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <ReTooltip contentStyle={{ background: "rgba(0,0,0,0.85)", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }} />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[0] }} />
                    <span className="text-xs opacity-80">Founders {ownershipData[0].value}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[1] }} />
                    <span className="text-xs opacity-80">Investors {ownershipData[1].value}%</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                    <DollarSign size={12} />
                    <span className="text-[11px] font-medium">{inputs.dilutionPct}% dilution</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Round Efficiency */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-md hover:shadow-lg transition-shadow animate-fade-up" style={{ animationDelay: "0.25s" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Round Efficiency</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${effColor}`}>{effLabel}</span>
              </div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-4xl font-bold text-foreground tabular-nums">{efficiencyScore}%</span>
              </div>
              <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                  style={{ width: `${efficiencyScore}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>0%</span><span>100%</span>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <MetricCard
                icon={TrendingUp} color="bg-emerald-50 text-emerald-600"
                label="Required MOIC" value={`${r.reqMoic.toFixed(1)}×`} sub={`for ${inputs.targetIrr}% IRR`}
                tooltip="The MOIC investors need to achieve their target IRR over the hold period."
              />
              <MetricCard
                icon={Target} color="bg-primary/10 text-primary"
                label="Required Exit" value={fmtM(r.reqExit)} sub={`in ${inputs.yearsToExit} years`}
                tooltip="Total exit valuation needed for investors to hit their target return."
              />
              <MetricCard
                icon={BarChart3} color="bg-purple-50 text-purple-500"
                label="Your IRR" value={`${r.calcIrr.toFixed(1)}%`}
                sub={`at ${inputs.targetMoic}× MOIC`}
                tooltip={`IRR implied by achieving ${inputs.targetMoic}× MOIC over ${inputs.yearsToExit} years.`}
              />
              <MetricCard
                icon={PieChart} color="bg-amber-50 text-amber-600"
                label="Investor Own." value={fmtPct(r.ownership)} sub="post-round"
                tooltip="Percentage of the company investors will own after this round."
              />
            </div>
          </div>

          {/* ── RIGHT: Summary ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* At a Glance */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-md animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <h3 className="text-base font-semibold text-foreground mb-4">At a Glance</h3>
              <div className="space-y-3">
                {[
                  { label: "Post-Money", val: fmtM(r.postMoney) },
                  { label: "Pre-Money", val: fmtM(r.preMoney) },
                  { label: "Raising", val: fmtM(inputs.raise) },
                  { label: "Dilution", val: `${inputs.dilutionPct}%` },
                  { label: "Target IRR", val: `${inputs.targetIrr}%` },
                  { label: "Req. MOIC", val: `${r.reqMoic.toFixed(1)}×` },
                  { label: "Req. Exit", val: fmtM(r.reqExit) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* IRR Verdict */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-md animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <h3 className="text-base font-semibold text-foreground mb-3">IRR Verdict</h3>
              <div className="text-center py-3">
                <p className={`text-3xl font-bold tabular-nums ${irrStatus}`}>{r.calcIrr.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your IRR at {inputs.targetMoic}× over {inputs.yearsToExit}yr
                </p>
              </div>
              <div className="mt-3 p-3 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {r.calcIrr >= inputs.targetIrr
                    ? `✅ Your ${inputs.targetMoic}× MOIC exceeds the ${inputs.targetIrr}% IRR target — strong position to negotiate.`
                    : r.calcIrr >= inputs.targetIrr * 0.7
                    ? `⚠️ Your MOIC yields ${r.calcIrr.toFixed(1)}% IRR, slightly below the ${inputs.targetIrr}% target. Consider a higher exit multiple.`
                    : `🔴 At ${inputs.targetMoic}× MOIC, IRR is only ${r.calcIrr.toFixed(1)}% — well below ${inputs.targetIrr}%. Adjust terms or timeline.`}
                </p>
              </div>
            </div>

            {/* Quick Tip */}
            <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 animate-fade-up" style={{ animationDelay: "0.35s" }}>
              <p className="text-xs text-muted-foreground leading-relaxed">
                💡 <span className="font-medium text-foreground">Tip:</span> Investors need a {r.reqMoic.toFixed(1)}× return to hit {inputs.targetIrr}% IRR.
                That means your startup must reach a {fmtM(r.reqExit)} exit in {inputs.yearsToExit} years.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Fundraise Math — For informational purposes only. Not financial advice.
      </footer>
    </div>
  );
};

export default Index;
