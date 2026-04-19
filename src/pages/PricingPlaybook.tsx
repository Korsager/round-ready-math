import { useState } from "react";
import {
  CheckCircle2, Sparkles, Zap, Target, TrendingUp, Lock, ArrowRight,
  Lightbulb, Layers, DollarSign, Loader2, X, Rocket, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import NavBar from "@/components/NavBar";
import { supabase } from "@/integrations/supabase/client";

interface Tier {
  name: string;
  price: string;
  tagline: string;
  targetShare: string;
  features: string[];
  recommended: boolean;
}
interface Strategy {
  valueMetric: { name: string; rationale: string };
  revenueUpliftPct: number;
  tiers: Tier[];
  upgradeTriggers: string[];
  annualDiscount: string;
  anchoringNotes: string;
  nextSteps: string[];
  expectedOutcome: string;
}

const CHECKLIST = [
  "Do we know which features our users actually value most?",
  "Have we defined our value metric?",
  "Is our packaging aligned to usage and outcomes?",
  "Have we spoken to 20+ customers about willingness-to-pay?",
  "Is pricing reviewed monthly?",
];

const PLAYBOOK_STEPS = [
  { n: 1, title: "Start with value, not cost", body: "Price reflects value delivered — not your costs, not competitors. Ask your best customers: \"What would you miss most?\" \"What's the ROI?\"" },
  { n: 2, title: "Pick your value metric", body: "The single unit that scales as your customer succeeds. Stripe → per transaction. HubSpot → per contact. Snowflake → per compute unit. Avoid charging for inputs (seats, time)." },
  { n: 3, title: "Pick the model that fits", body: "Free trial, freemium, usage-based, or tiered (Good/Better/Best). Usage-based is best when you can hit 120%+ NRR." },
  { n: 4, title: "Your price says something", body: "$9/mo says \"commodity tool.\" $900/mo says \"serious partner.\" Always lead with your highest tier (anchoring effect)." },
  { n: 5, title: "Set the number", body: "Anchor to value created. Use Van Westendorp Price Sensitivity with real customers. Competitors are a reference — never a ceiling." },
  { n: 6, title: "Tiers that sell themselves", body: "Starter makes Pro look obvious. Pro is where 60-70% should land. Enterprise is \"talk to us.\" Build upgrade triggers (limits) so customers come to you." },
];

export default function PricingPlaybook() {
  const [businessModel, setBusinessModel] = useState("");
  const [customerSegments, setCustomerSegments] = useState("");
  const [currentPricing, setCurrentPricing] = useState("");
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [checked, setChecked] = useState<boolean[]>(Array(CHECKLIST.length).fill(false));

  const generate = async () => {
    if (businessModel.trim().length < 10) {
      toast({ title: "Tell us a bit more", description: "Describe your business model in at least 10 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setStrategy(null);
    try {
      const { data, error } = await supabase.functions.invoke("pricing-strategy", {
        body: { businessModel, customerSegments, currentPricing },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setStrategy((data as any).strategy);
      setTimeout(() => document.getElementById("ai-output")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: any) {
      toast({ title: "Could not generate strategy", description: e?.message ?? "Try again in a moment.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1729 0%, #001233 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #00d4ff 0%, transparent 40%), radial-gradient(circle at 80% 70%, #6366F1 0%, transparent 40%)" }} />
        <div className="relative max-w-[1100px] mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles size={12} /> JUST LAUNCHED — AI Pricing Playbook
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Most founders spend more time picking a font than their pricing strategy.
            </h1>
            <p className="text-lg text-slate-300 mt-6 leading-relaxed">
              This is the pricing playbook I wish I had — now available as a simple, powerful AI tool for founders.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button onClick={() => scrollTo("ai-tool")} size="lg" className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold">
                <Zap size={16} className="mr-2" /> Get your pricing strategy in minutes
              </Button>
              <Button onClick={() => scrollTo("how")} size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-white/5">
                How it works
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-400" /> Backed by $150M exits</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-400" /> Data-backed frameworks</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-400" /> Ship-ready in minutes</div>
            </div>
          </div>

          {/* Live demo card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-cyan-400/20">
            <div className="text-[11px] font-semibold tracking-widest text-cyan-600 mb-1">LIVE DEMO OUTPUT</div>
            <div className="text-sm text-muted-foreground mb-5">Your AI-generated pricing strategy</div>
            <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-5 mb-4 border border-emerald-100">
              <div className="text-4xl font-bold text-emerald-600 tabular-nums">42%</div>
              <div className="text-xs text-muted-foreground mt-1">Projected revenue uplift</div>
              <div className="text-[11px] text-muted-foreground/80">from right value metric + tier architecture</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
              <div className="text-[10px] font-semibold tracking-widest text-slate-500 mb-1">YOUR VALUE METRIC</div>
              <div className="text-base font-semibold text-slate-900">Monthly Active Contacts</div>
              <div className="text-xs text-muted-foreground">Scales perfectly with customer success</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"><span className="text-slate-700">Starter</span><span className="font-semibold tabular-nums">$29/mo</span></div>
              <div className="flex items-center justify-between bg-cyan-50 border-2 border-cyan-400 rounded-lg px-3 py-2 text-sm"><span className="text-slate-900 font-medium">Pro <span className="text-[10px] text-cyan-600">(80% land here)</span></span><span className="font-semibold tabular-nums">$99/mo</span></div>
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"><span className="text-slate-700">Enterprise</span><span className="font-semibold">Custom</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-[1100px] mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-semibold tracking-widest text-cyan-600 mb-2">SIMPLE YET POWERFUL</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            One input. One powerful pricing strategy.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            No spreadsheets. No guesswork. Just your business context → complete pricing system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* INPUT */}
          <div className="bg-card rounded-2xl border border-border p-7">
            <div className="flex items-center justify-between mb-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-full">
                <ArrowRight size={12} /> INPUT
              </div>
              <span className="text-xs text-muted-foreground">3 quick fields</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-5">Tell us about your business in plain English</h3>
            <div className="space-y-4">
              {[
                { n: 1, title: "Your model & positioning", body: "SaaS? Marketplace? Usage-based? Who you are and how you win.", ex: "B2B AI sales assistant for mid-market teams, positioned as the most reliable & accurate option." },
                { n: 2, title: "Your customer segments", body: "Who pays you today? Who you want to attract? SMB, Mid-market, Enterprise?" },
                { n: 3, title: "Current pricing (optional)", body: "What you charge today and any friction you're seeing." },
              ].map((s) => (
                <div key={s.n} className="flex gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-cyan-50 text-cyan-700 font-semibold text-xs flex items-center justify-center">{s.n}</div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.body}</div>
                    {s.ex && <div className="text-[11px] text-muted-foreground/80 mt-1.5 italic bg-muted/50 px-2 py-1.5 rounded">Example: "{s.ex}"</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span>⏱ Takes ~60 seconds</span>
              <span className="flex items-center gap-1"><Lock size={11} /> 100% private</span>
            </div>
          </div>

          {/* OUTPUT */}
          <div className="bg-card rounded-2xl border border-border p-7">
            <div className="flex items-center justify-between mb-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                <Sparkles size={12} /> OUTPUT
              </div>
              <span className="text-xs text-muted-foreground">Instant pricing system</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-5">Your complete, ready-to-ship pricing strategy</h3>
            <div className="space-y-3">
              {[
                { icon: Target, title: "Value metric", body: "The single unit you should actually charge for (the one that scales with customer success)." },
                { icon: Layers, title: "Pricing architecture + tier structure", body: "Good / Better / Best tiers engineered to sell themselves." },
                { icon: DollarSign, title: "Exact price points + anchoring", body: "Grounded in willingness-to-pay logic and Van Westendorp curves." },
                { icon: TrendingUp, title: "Upgrade triggers + annual discount logic", body: "Built-in mechanics that increase revenue without extra sales effort." },
              ].map((o) => {
                const Icon = o.icon;
                return (
                  <div key={o.title} className="flex gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center"><Icon size={15} /></div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{o.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{o.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-border text-[11px] text-muted-foreground space-y-1">
              <div>✅ McKinsey-backed frameworks</div>
              <div>📊 Real examples from $150M businesses</div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          {["No cost data needed", "Works for any business model", "Updated with latest 2026 benchmarks"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 bg-muted/40 border border-border rounded-full px-3 py-1.5"><CheckCircle2 size={12} className="text-emerald-600" /> {t}</span>
          ))}
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section id="why" className="bg-gradient-to-b from-slate-50 to-white border-y border-border py-20">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Pricing is the highest-ROI decision you'll ever make
            </h2>
            <p className="text-muted-foreground mt-3">
              A 1% improvement in pricing delivers 8% more operating profit — more than volume, acquisition, or cost-cutting combined (McKinsey S&P 1500 study).
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { stat: "8×", label: "Higher impact than acquisition", body: "Data-backed comparison of growth levers shows pricing beats every other lever." },
              { stat: "40%", label: "Average price increase after one customer interview", body: "One founder discovered a \"minor\" feature saved clients 10+ hours/week." },
              { stat: "120%+", label: "Net revenue retention", body: "Usage-based models with the right value metric consistently deliver this." },
            ].map((c) => (
              <div key={c.stat} className="bg-card rounded-2xl border border-border p-6">
                <div className="text-5xl font-bold text-cyan-600 tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.stat}</div>
                <div className="text-sm font-semibold text-foreground mt-3">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLAYBOOK */}
      <section id="playbook" className="max-w-[1100px] mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-xs font-semibold tracking-widest text-cyan-600 mb-2">THE PLAYBOOK</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>The complete framework</h2>
          </div>
          <button onClick={() => scrollTo("ai-tool")} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium inline-flex items-center gap-1">
            Skip to AI version <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
          <Lightbulb className="text-cyan-400 mb-3" size={28} />
          <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>The one decision that touches everything</h3>
          <p className="text-slate-300 leading-relaxed">
            Pricing is not just a revenue decision. It's a signal to your market about what kind of company you are. Get it wrong and you attract price-sensitive, high-churn customers. Get it right and you attract customers who stay longer, refer more, and give better feedback.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-cyan-300 text-sm font-medium bg-cyan-400/10 border border-cyan-400/30 rounded-lg px-3 py-2">
            <BarChart3 size={14} /> McKinsey: 1% better pricing = 8% more operating profit.
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {PLAYBOOK_STEPS.map((s) => (
            <div key={s.n} className="bg-card border border-border rounded-2xl p-6 hover:border-cyan-400/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold flex items-center justify-center text-sm">{s.n}</div>
                <h4 className="text-base font-semibold text-foreground">{s.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CHECKLIST */}
      <section id="checklist" className="bg-slate-50 border-y border-border py-20">
        <div className="max-w-[800px] mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground mb-2 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Pricing maturity checklist
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Tick what's true today. Anything unchecked? That's your next move.</p>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            {CHECKLIST.map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/40 transition-colors">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={(e) => setChecked((c) => c.map((v, idx) => (idx === i ? e.target.checked : v)))}
                  className="mt-0.5 h-5 w-5 rounded border-border accent-cyan-500"
                />
                <span className={`text-sm ${checked[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>{item}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            {checked.filter(Boolean).length} / {CHECKLIST.length} complete
          </div>
        </div>
      </section>

      {/* AI TOOL */}
      <section id="ai-tool" className="max-w-[900px] mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Sparkles size={12} /> AI-POWERED
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to build your pricing system?
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Fill the 3 fields below. Our AI (trained on this exact playbook + $150M case studies) will return your complete strategy in seconds.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-7 shadow-md">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">1. Your business model & positioning</label>
              <Textarea value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} rows={3}
                placeholder="e.g. B2B AI sales assistant for mid-market RevOps teams. We win on accuracy and reliability vs cheaper competitors." />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">2. Primary customer segments</label>
                <Textarea value={customerSegments} onChange={(e) => setCustomerSegments(e.target.value)} rows={3}
                  placeholder="e.g. Mid-market SaaS (200-2000 employees), some SMB self-serve" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">3. Current pricing (optional)</label>
                <Textarea value={currentPricing} onChange={(e) => setCurrentPricing(e.target.value)} rows={3}
                  placeholder="e.g. $99/seat/month, customers complain it's hard to predict cost" />
              </div>
            </div>

            <Button onClick={generate} disabled={loading} size="lg" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-base h-14">
              {loading ? (<><Loader2 className="mr-2 animate-spin" size={18} /> Generating your strategy…</>) : (<><Zap size={18} className="mr-2" /> Generate my pricing strategy</>)}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">Takes 15–45 seconds • Powered by the exact playbook above</p>
          </div>
        </div>

        {/* AI Output */}
        {strategy && (
          <div id="ai-output" className="mt-8 bg-card rounded-2xl border-2 border-cyan-400 shadow-xl overflow-hidden animate-fade-up">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Rocket size={18} />
                <span className="font-semibold">Your AI pricing strategy is ready</span>
              </div>
              <button onClick={() => setStrategy(null)} className="text-white/80 hover:text-white"><X size={18} /></button>
            </div>

            <div className="p-7 space-y-6">
              {/* Uplift */}
              <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-5 border border-emerald-100 flex items-center gap-5">
                <div className="text-5xl font-bold text-emerald-600 tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{strategy.revenueUpliftPct}%</div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Projected revenue uplift</div>
                  <div className="text-xs text-muted-foreground">{strategy.expectedOutcome}</div>
                </div>
              </div>

              {/* Value metric */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="text-[10px] font-semibold tracking-widest text-slate-500 mb-1">YOUR VALUE METRIC</div>
                <div className="text-xl font-semibold text-slate-900">{strategy.valueMetric.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{strategy.valueMetric.rationale}</div>
              </div>

              {/* Tiers */}
              <div>
                <div className="text-sm font-semibold text-foreground mb-3">Pricing architecture</div>
                <div className="grid md:grid-cols-3 gap-3">
                  {strategy.tiers.map((t) => (
                    <div key={t.name} className={`rounded-xl p-4 border-2 ${t.recommended ? "border-cyan-400 bg-cyan-50/50 relative" : "border-border bg-card"}`}>
                      {t.recommended && <div className="absolute -top-2 left-3 bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">RECOMMENDED</div>}
                      <div className="text-sm font-semibold text-foreground">{t.name}</div>
                      <div className="text-2xl font-bold text-foreground tabular-nums mt-1">{t.price}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{t.tagline}</div>
                      <div className="text-[10px] text-cyan-700 font-medium mt-2 bg-cyan-100/60 inline-block px-2 py-0.5 rounded">{t.targetShare}</div>
                      <ul className="mt-3 space-y-1.5">
                        {t.features.map((f, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-600 mt-0.5 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Triggers + discount */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><TrendingUp size={14} className="text-cyan-600" /> Upgrade triggers</div>
                  <ul className="space-y-1.5">
                    {strategy.upgradeTriggers.map((u, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <ArrowRight size={11} className="text-cyan-600 mt-1 shrink-0" /> {u}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><DollarSign size={14} className="text-emerald-600" /> Annual discount</div>
                  <p className="text-xs text-muted-foreground">{strategy.annualDiscount}</p>
                  <div className="text-sm font-semibold text-foreground mt-3 mb-1.5 flex items-center gap-1.5"><Target size={14} className="text-blue-600" /> Anchoring</div>
                  <p className="text-xs text-muted-foreground">{strategy.anchoringNotes}</p>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
                <div className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Lightbulb size={14} className="text-cyan-400" /> Your next steps</div>
                <ol className="space-y-2">
                  {strategy.nextSteps.map((s, i) => (
                    <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground px-6">
        Inspired by the original Founders Corner pricing playbook • McKinsey, OpenView and Bessemer benchmarks • For informational purposes only.
      </footer>
    </div>
  );
}
