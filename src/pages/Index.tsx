import React, { useState, useCallback, useRef } from "react";
import {
  Rocket, TrendingUp, DollarSign, PieChart,
  BarChart3, Target, RotateCcw, ChevronDown, ChevronUp
} from "lucide-react";
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as ReTooltip
} from "recharts";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import rocketImg from "@/assets/rocket-launch.png";
import HeatmapGrid from "@/components/HeatmapGrid";
import NavBar from "@/components/NavBar";

/* ── Calc Engine ── */
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

const fmtM = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

function parseShorthand(raw: string): number | null {
  const s = raw.trim().replace(/[$,]/g, "").replace(/%$/, "").replace(/×$/, "").replace(/yr$/i, "");
  if (!s) return null;
  const match = s.match(/^(\d+\.?\d*)\s*([mkb]?)$/i);
  if (!match) return null;
  let num = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "k") num *= 1_000;
  else if (unit === "m") num *= 1_000_000;
  else if (unit === "b") num *= 1_000_000_000;
  return isNaN(num) ? null : num;
}

const ManualInput = ({
  label, value, onChange, format, suffix, tooltip
}: {
  label: string; value: number; onChange: (v: number) => void;
  format: (v: number) => string; suffix?: string; tooltip: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(format(value).replace(/[$,]/g, ""));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const parsed = parseShorthand(draft);
    if (parsed !== null && parsed > 0) onChange(parsed);
    setEditing(false);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {editing ? (
            <input
              ref={inputRef}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
              className="w-24 text-right text-sm font-bold text-foreground bg-secondary rounded-md px-2 py-1 outline-none ring-1 ring-primary/30 tabular-nums"
            />
          ) : (
            <button
              onClick={startEdit}
              className="text-sm font-bold text-foreground tabular-nums hover:text-primary hover:bg-secondary px-2 py-1 rounded-md transition-colors"
            >
              {format(value)}
            </button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[200px] text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
};

const MetricCard = ({
  label, value, sub, icon: Icon, color, explainer
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; explainer: string;
}) => (
  <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-lg ${color}`}>
        <Icon size={15} />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className="text-xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    <p className="text-[11px] text-muted-foreground/80 mt-2 leading-snug border-t border-border pt-2">{explainer}</p>
  </div>
);

const GLOSSARY = [
  { term: "Pre-Money", def: "Your company's value right before investors put money in." },
  { term: "Post-Money", def: "Pre-Money plus the new investment = total value after the round." },
  { term: "Dilution", def: "The % of ownership you give up to investors." },
  { term: "MOIC", def: "Multiple on Invested Capital — how many times investors get their money back." },
  { term: "IRR", def: "Internal Rate of Return — the annual % growth rate of the investment." },
];

const Index = () => {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const update = useCallback((k: keyof Inputs, v: number) => setInputs(p => ({ ...p, [k]: v })), []);
  const reset = useCallback(() => setInputs(DEFAULTS), []);
  const r = compute(inputs);

  const ownershipData = [
    { name: "Founders", value: +(100 - inputs.dilutionPct).toFixed(1) },
    { name: "Investors", value: +inputs.dilutionPct.toFixed(1) },
  ];
  const PIE_COLORS = ["hsl(217, 91%, 60%)", "hsl(160, 84%, 39%)"];

  const irrStatus = r.calcIrr >= inputs.targetIrr ? "text-emerald-600" : r.calcIrr >= inputs.targetIrr * 0.7 ? "text-amber-600" : "text-destructive";
  const verdict = r.calcIrr >= inputs.targetIrr
    ? { icon: "✅", label: "Strong deal", msg: `Your ${inputs.targetMoic}× MOIC beats the ${inputs.targetIrr}% IRR target. You're in a strong negotiating position.` }
    : r.calcIrr >= inputs.targetIrr * 0.7
    ? { icon: "⚠️", label: "Close, but tight", msg: `Your IRR (${r.calcIrr.toFixed(1)}%) is just under the ${inputs.targetIrr}% target. Aim for a higher exit or shorter timeline.` }
    : { icon: "🔴", label: "Needs work", msg: `Your IRR (${r.calcIrr.toFixed(1)}%) is well below the ${inputs.targetIrr}% target. Investors will likely push back.` };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Greeting */}
        <div className="mb-8 flex items-start justify-between gap-4 animate-fade-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Rocket className="text-primary" size={26} />
              Fundraise Math Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Adjust your round → see valuation, dilution, IRR & required exit instantly</p>
          </div>
          <button onClick={reset} className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-secondary border border-border">
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-md animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" /> Adjust Your Round
              </h3>
              <p className="text-[11px] text-muted-foreground mb-4">Click any value to edit. Try shorthand like "2M" or "500K".</p>
              <div className="space-y-0">
                <ManualInput label="Raise Amount" value={inputs.raise} onChange={(v) => update("raise", v)} format={fmtM} tooltip="How much capital you're raising." />
                <ManualInput label="Pre-Money Valuation" value={r.preMoney} onChange={(v) => { if (v > 0 && inputs.raise > 0) update("dilutionPct", +((inputs.raise / (v + inputs.raise)) * 100).toFixed(2)); }} format={fmtM} tooltip="Editing this recalculates dilution." />
                <ManualInput label="Dilution %" value={inputs.dilutionPct} onChange={(v) => update("dilutionPct", v)} format={(v) => `${v}%`} suffix="%" tooltip="Ownership % you give to investors." />
                <ManualInput label="Target IRR" value={inputs.targetIrr} onChange={(v) => update("targetIrr", v)} format={(v) => `${v}%`} suffix="%" tooltip="Annual return rate investors expect." />
                <ManualInput label="Years to Exit" value={inputs.yearsToExit} onChange={(v) => update("yearsToExit", Math.round(v))} format={(v) => `${v}yr`} suffix="yr" tooltip="Years until exit/liquidity." />
                <ManualInput label="Your MOIC" value={inputs.targetMoic} onChange={(v) => update("targetMoic", v)} format={(v) => `${v}×`} suffix="×" tooltip="Multiple on Invested Capital." />
              </div>
            </div>

            <div className="flex justify-center animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <img src={rocketImg} alt="Growth" className="w-48 sm:w-56 drop-shadow-xl animate-pulse-gentle opacity-90" />
            </div>
          </div>

          {/* CENTER */}
          <div className="lg:col-span-5 space-y-6">
            {/* Post-Money */}
            <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-lg animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <h3 className="text-sm font-medium opacity-80 mb-1">Post-Money Valuation</h3>
              <p className="text-[11px] opacity-70 mb-3">What your company is worth right after the round closes.</p>
              <p className="text-4xl sm:text-5xl font-bold mb-1 tabular-nums">{fmtM(r.postMoney)}</p>
              <p className="text-xs opacity-70 mb-5">Pre-Money: {fmtM(r.preMoney)} · Raising {fmtM(inputs.raise)}</p>

              <div className="flex items-center gap-5">
                <div className="w-28 h-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie data={ownershipData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={48} strokeWidth={0}>
                        {ownershipData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <ReTooltip contentStyle={{ background: "rgba(0,0,0,0.85)", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }} />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[0] }} />
                    <span className="text-xs opacity-80">Founders keep {ownershipData[0].value}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[1] }} />
                    <span className="text-xs opacity-80">Investors get {ownershipData[1].value}%</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                    <DollarSign size={12} />
                    <span className="text-[11px] font-medium">{inputs.dilutionPct}% dilution</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics with explainers */}
            <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <MetricCard
                icon={TrendingUp} color="bg-emerald-50 text-emerald-600"
                label="Required MOIC" value={`${r.reqMoic.toFixed(1)}×`} sub={`for ${inputs.targetIrr}% IRR`}
                explainer="How many times investors must multiply their money to hit their target."
              />
              <MetricCard
                icon={Target} color="bg-primary/10 text-primary"
                label="Required Exit" value={fmtM(r.reqExit)} sub={`in ${inputs.yearsToExit} years`}
                explainer="The sale or IPO price your company needs to reach to deliver that return."
              />
              <MetricCard
                icon={BarChart3} color="bg-purple-50 text-purple-500"
                label="Your IRR" value={`${r.calcIrr.toFixed(1)}%`} sub={`at ${inputs.targetMoic}× MOIC`}
                explainer="The yearly return rate your chosen MOIC actually produces."
              />
              <MetricCard
                icon={PieChart} color="bg-amber-50 text-amber-600"
                label="Investor Ownership" value={fmtPct(r.ownership)} sub="post-round"
                explainer="The slice of the company investors will hold after this round."
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3 space-y-6">
            {/* Verdict */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-md animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <h3 className="text-base font-semibold text-foreground mb-3">Is this a good deal?</h3>
              <div className="text-center py-2">
                <p className="text-3xl mb-1">{verdict.icon}</p>
                <p className={`text-lg font-bold ${irrStatus}`}>{verdict.label}</p>
                <p className={`text-2xl font-bold tabular-nums mt-2 ${irrStatus}`}>{r.calcIrr.toFixed(1)}% IRR</p>
                <p className="text-[11px] text-muted-foreground mt-1">target: {inputs.targetIrr}%</p>
              </div>
              <div className="mt-3 p-3 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground leading-relaxed">{verdict.msg}</p>
              </div>
            </div>

            {/* Plain English summary */}
            <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">In plain English</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You're raising <span className="font-semibold text-foreground">{fmtM(inputs.raise)}</span> for{" "}
                <span className="font-semibold text-foreground">{inputs.dilutionPct}%</span> of your company
                (valuing it at <span className="font-semibold text-foreground">{fmtM(r.postMoney)}</span>).
                To make investors happy, you need to sell or IPO for{" "}
                <span className="font-semibold text-foreground">{fmtM(r.reqExit)}</span> within{" "}
                <span className="font-semibold text-foreground">{inputs.yearsToExit} years</span>.
              </p>
            </div>

            {/* Glossary */}
            <Collapsible open={glossaryOpen} onOpenChange={setGlossaryOpen}>
              <div className="bg-card rounded-2xl border border-border shadow-sm animate-fade-up" style={{ animationDelay: "0.35s" }}>
                <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-secondary/40 rounded-2xl transition-colors">
                  <span className="text-sm font-semibold text-foreground">📖 Glossary</span>
                  {glossaryOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <div className="space-y-2.5 pt-2 border-t border-border">
                    {GLOSSARY.map((g) => (
                      <div key={g.term}>
                        <p className="text-xs font-semibold text-foreground">{g.term}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">{g.def}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mt-10 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <p className="text-xs text-muted-foreground mb-3 max-w-2xl">
            🟢 <span className="font-medium text-foreground">How to read this:</span> Each cell shows the IRR if you exit at that MOIC after that many years. Green beats your {inputs.targetIrr}% target, red falls short.
          </p>
          <HeatmapGrid inputs={{ ...inputs, shares: 0 }} />
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Fundraise Math — For informational purposes only. Not financial advice.
      </footer>
    </div>
  );
};

export default Index;
