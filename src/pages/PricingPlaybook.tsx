import { useEffect, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, Download, Copy, Target, Layers,
  DollarSign, Zap, ClipboardCheck, Lightbulb, Sparkles, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";


// ---------- Types ----------
type PricingModel = "Tiered" | "Usage-based" | "Freemium" | "Free Trial" | "Hybrid";

interface Tier {
  name: string;
  job: string;
  features: string;        // newline-separated
  monthlyPrice: string;
  annualPrice: string;
}

interface Context {
  businessModel: string;
  segments: string;
  currentPricing: string;
}

interface Strategy {
  context: Context;
  valueMetric: { name: string; rationale: string };
  models: PricingModel[];
  modelNotes: string;
  tiers: [Tier, Tier, Tier];                 // Starter, Pro, Enterprise
  annualDiscountPct: string;
  anchoringNotes: string;
  upgradeTriggers: string;                   // newline-separated
  checklist: Record<string, boolean>;
}

const CHECKLIST_ITEMS = [
  "We know which features our users value most",
  "We have defined our value metric",
  "Packaging is aligned to usage and outcomes",
  "We've spoken to 20+ customers about willingness-to-pay",
  "Pricing is reviewed at least monthly",
];

const STORAGE_KEY = "founders-corner-pricing-strategy-v1";

const blankStrategy = (): Strategy => ({
  context: { businessModel: "", segments: "", currentPricing: "" },
  valueMetric: { name: "", rationale: "" },
  models: [],
  modelNotes: "",
  tiers: [
    { name: "Starter", job: "Make Pro look like the obvious choice", features: "", monthlyPrice: "", annualPrice: "" },
    { name: "Pro",     job: "Where 60–70% of customers should land", features: "", monthlyPrice: "", annualPrice: "" },
    { name: "Enterprise", job: "Anchor the high end. Custom — talk to us.", features: "", monthlyPrice: "Custom", annualPrice: "Custom" },
  ],
  annualDiscountPct: "",
  anchoringNotes: "",
  upgradeTriggers: "",
  checklist: Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i, false])),
});

// ---------- Steps config ----------
const STEPS = [
  { id: 0, title: "Your Business",     icon: Sparkles,        short: "Context" },
  { id: 1, title: "Value Metric",      icon: Target,          short: "Step 1" },
  { id: 2, title: "Pricing Model",     icon: Layers,          short: "Step 2" },
  { id: 3, title: "3 Tiers",           icon: Layers,          short: "Step 3" },
  { id: 4, title: "Price Points",      icon: DollarSign,      short: "Step 4" },
  { id: 5, title: "Upgrade Triggers",  icon: Zap,             short: "Step 5" },
  { id: 6, title: "Review & Export",   icon: ClipboardCheck,  short: "Step 6" },
];

const MODELS: { id: PricingModel; desc: string }[] = [
  { id: "Tiered", desc: "Good / Better / Best — most common & effective" },
  { id: "Usage-based", desc: "Best for >120% NRR (Twilio, AWS, Snowflake)" },
  { id: "Freemium", desc: "When users share what they create" },
  { id: "Free Trial", desc: "Notion, Superhuman — earn the upgrade" },
  { id: "Hybrid", desc: "Combine two — e.g. tiered + usage overage" },
];

// ---------- Component ----------
export default function PricingPlaybook() {
  const [step, setStep] = useState(0);
  const [s, setS] = useState<Strategy>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...blankStrategy(), ...JSON.parse(raw) };
    } catch {}
    return blankStrategy();
  });

  // autosave
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  }, [s]);

  const update = <K extends keyof Strategy>(key: K, value: Strategy[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const updateTier = (i: 0 | 1 | 2, patch: Partial<Tier>) =>
    setS((prev) => {
      const tiers = [...prev.tiers] as [Tier, Tier, Tier];
      tiers[i] = { ...tiers[i], ...patch };
      return { ...prev, tiers };
    });

  const reset = () => {
    if (confirm("Reset the entire strategy? This cannot be undone.")) {
      setS(blankStrategy());
      setStep(0);
      toast({ title: "Strategy reset" });
    }
  };

  const next = () => setStep((n) => Math.min(n + 1, STEPS.length - 1));
  const prev = () => setStep((n) => Math.max(n - 1, 0));

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-10 max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> FOUNDERS CORNER · PRICING STRATEGY SETTER
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Most founders spend more time picking a font than their pricing strategy.
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            This tool fixes that. <strong className="text-foreground">You set every number. You own the strategy.</strong> The
            tool simply follows the proven 6-step playbook — it never generates prices or tiers for you.
          </p>
        </div>
      </section>

      {/* Body: sidebar + step */}
      <section className="container mx-auto px-4 py-8 max-w-6xl grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ol className="space-y-1">
            {STEPS.map((st) => {
              const Icon = st.icon;
              const active = step === st.id;
              const done = step > st.id;
              return (
                <li key={st.id}>
                  <button
                    onClick={() => setStep(st.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                        ? "bg-muted text-foreground hover:bg-muted/70"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      active ? "bg-primary-foreground/20" : done ? "bg-primary/15 text-primary" : "bg-muted"
                    }`}>
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <div className="flex-1">
                      <div className="text-[10px] uppercase tracking-wider opacity-70">{st.short}</div>
                      <div className="font-semibold">{st.title}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
          <Button variant="outline" size="sm" className="w-full mt-4 gap-2" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset all
          </Button>
        </aside>

        {/* Step content */}
        <div className="min-w-0">
          {step === 0 && <ContextStep s={s} update={update} />}
          {step === 1 && <ValueMetricStep s={s} update={update} />}
          {step === 2 && <ModelStep s={s} update={update} />}
          {step === 3 && <TiersStep s={s} updateTier={updateTier} />}
          {step === 4 && <PricesStep s={s} updateTier={updateTier} update={update} />}
          {step === 5 && <TriggersStep s={s} update={update} />}
          {step === 6 && <ReviewStep s={s} update={update} />}

          {/* Nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <div className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length} · saved automatically
            </div>
            <Button onClick={next} disabled={step === STEPS.length - 1} className="gap-2">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------- Reusable bits ----------
function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 p-3 rounded-md bg-primary/5 border border-primary/15 text-sm text-muted-foreground">
      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function StepHeader({ kicker, title, blurb }: { kicker: string; title: string; blurb: string }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{kicker}</div>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{title}</h2>
      <p className="text-muted-foreground">{blurb}</p>
    </div>
  );
}

// ---------- Step components ----------
function ContextStep({ s, update }: { s: Strategy; update: <K extends keyof Strategy>(k: K, v: Strategy[K]) => void }) {
  const c = s.context;
  return (
    <div className="space-y-5">
      <StepHeader
        kicker="Context"
        title="Tell us about your business"
        blurb="3 quick fields so the rest of the wizard makes sense. The tool will not use these to generate anything — they're for your own export."
      />
      <Field label="1. Business model & positioning" hint="SaaS? Marketplace? Usage-based? Who you are and how you win.">
        <Textarea rows={3} value={c.businessModel} onChange={(e) => update("context", { ...c, businessModel: e.target.value })}
          placeholder="e.g. B2B AI sales assistant for mid-market teams, positioning as the most reliable option" />
      </Field>
      <Field label="2. Primary customer segments" hint="Who pays you today? Who do you want to attract?">
        <Textarea rows={2} value={c.segments} onChange={(e) => update("context", { ...c, segments: e.target.value })}
          placeholder="e.g. Mid-market SaaS teams, 50–500 employees, US/EU" />
      </Field>
      <Field label="3. Current pricing & friction (optional)" hint="What you charge today and what's not working.">
        <Textarea rows={3} value={c.currentPricing} onChange={(e) => update("context", { ...c, currentPricing: e.target.value })}
          placeholder="e.g. $50/seat/mo flat. Customers churn after 6 months because seats don't reflect value." />
      </Field>
    </div>
  );
}

function ValueMetricStep({ s, update }: { s: Strategy; update: <K extends keyof Strategy>(k: K, v: Strategy[K]) => void }) {
  const v = s.valueMetric;
  return (
    <div className="space-y-5">
      <StepHeader kicker="Step 1" title="Define your value metric"
        blurb="The one unit you charge for that grows exactly when your customer succeeds." />
      <Hint>
        <strong>Examples:</strong> Stripe → per transaction · HubSpot → per contact · Intercom → per active user · Snowflake → per compute unit.
        <br /><strong>Avoid charging for inputs</strong> like seats or time. Charge for outcomes.
      </Hint>
      <Field label="Your value metric" hint="Short — 2 to 5 words.">
        <Input value={v.name} onChange={(e) => update("valueMetric", { ...v, name: e.target.value })}
          placeholder="e.g. Monthly Active Contacts" />
      </Field>
      <Field label="Why this scales with customer success" hint="One sentence — when this number goes up, your customer is winning.">
        <Textarea rows={3} value={v.rationale} onChange={(e) => update("valueMetric", { ...v, rationale: e.target.value })}
          placeholder="e.g. The more contacts a marketing team manages in our app, the more pipeline they're generating." />
      </Field>
    </div>
  );
}

function ModelStep({ s, update }: { s: Strategy; update: <K extends keyof Strategy>(k: K, v: Strategy[K]) => void }) {
  const toggle = (m: PricingModel) => {
    const set = new Set(s.models);
    set.has(m) ? set.delete(m) : set.add(m);
    update("models", Array.from(set));
  };
  return (
    <div className="space-y-5">
      <StepHeader kicker="Step 2" title="Choose your pricing model(s)"
        blurb="Pick the model that fits how value flows. You can combine two." />
      <div className="grid sm:grid-cols-2 gap-3">
        {MODELS.map((m) => {
          const active = s.models.includes(m.id);
          return (
            <button key={m.id} onClick={() => toggle(m.id)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold">{m.id}</div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  active ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                }`}>
                  {active && <Check className="h-3 w-3" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </button>
          );
        })}
      </div>
      <Field label="Notes on your chosen model(s)" hint="Especially if hybrid — explain how you combine them.">
        <Textarea rows={3} value={s.modelNotes} onChange={(e) => update("modelNotes", e.target.value)}
          placeholder="e.g. Tiered base subscription + usage overage above 10k contacts/mo" />
      </Field>
    </div>
  );
}

function TiersStep({ s, updateTier }: { s: Strategy; updateTier: (i: 0|1|2, p: Partial<Tier>) => void }) {
  return (
    <div className="space-y-5">
      <StepHeader kicker="Step 3" title="Build your 3 tiers"
        blurb="Name each tier and define its job. Features only — prices come next." />
      <Hint>
        <strong>Starter</strong> = make Pro look like the obvious choice. <strong>Pro</strong> = where 60–70% of customers should land. <strong>Enterprise</strong> = anchor the high end.
      </Hint>
      <div className="grid md:grid-cols-3 gap-4">
        {s.tiers.map((t, i) => (
          <div key={i} className="p-4 rounded-lg border border-border bg-card space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Tier {i + 1}</div>
            <Field label="Name">
              <Input value={t.name} onChange={(e) => updateTier(i as 0|1|2, { name: e.target.value })} />
            </Field>
            <Field label="Job of this tier">
              <Input value={t.job} onChange={(e) => updateTier(i as 0|1|2, { job: e.target.value })} />
            </Field>
            <Field label="Features (one per line)">
              <Textarea rows={6} value={t.features}
                onChange={(e) => updateTier(i as 0|1|2, { features: e.target.value })}
                placeholder={"e.g.\nUp to 1,000 contacts\nEmail support\nBasic analytics"} />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricesStep({
  s, updateTier, update,
}: { s: Strategy; updateTier: (i: 0|1|2, p: Partial<Tier>) => void; update: <K extends keyof Strategy>(k: K, v: Strategy[K]) => void }) {
  return (
    <div className="space-y-5">
      <StepHeader kicker="Step 4" title="Set your price points"
        blurb="Type each number yourself. Anchor with the high tier — price signals quality." />
      <Hint>
        £9/mo says "commodity tool." £900/mo says "serious partner." Always lead with your highest tier publicly to anchor effectively.
      </Hint>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr] bg-muted text-xs font-semibold uppercase tracking-wider">
          <div className="p-3">Tier</div>
          <div className="p-3">Monthly</div>
          <div className="p-3">Annual (per mo)</div>
        </div>
        {s.tiers.map((t, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr] border-t border-border items-center">
            <div className="p-3 font-semibold">{t.name || `Tier ${i + 1}`}</div>
            <div className="p-3">
              <Input value={t.monthlyPrice} onChange={(e) => updateTier(i as 0|1|2, { monthlyPrice: e.target.value })}
                placeholder="$29 or Custom" />
            </div>
            <div className="p-3">
              <Input value={t.annualPrice} onChange={(e) => updateTier(i as 0|1|2, { annualPrice: e.target.value })}
                placeholder="$24" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Annual discount %" hint="Common: 17% (≈ 2 months free).">
          <Input value={s.annualDiscountPct} onChange={(e) => update("annualDiscountPct", e.target.value)}
            placeholder="17" />
        </Field>
        <Field label="Anchoring notes" hint="How will you present pricing publicly?">
          <Input value={s.anchoringNotes} onChange={(e) => update("anchoringNotes", e.target.value)}
            placeholder="e.g. Show Enterprise first, Pro highlighted as recommended" />
        </Field>
      </div>
    </div>
  );
}

function TriggersStep({ s, update }: { s: Strategy; update: <K extends keyof Strategy>(k: K, v: Strategy[K]) => void }) {
  return (
    <div className="space-y-5">
      <StepHeader kicker="Step 5" title="Add upgrade triggers"
        blurb="The exact limits that will naturally pull customers up a tier — no sales required." />
      <Hint>
        Build triggers so the customer comes to you. Examples: "10 seats", "5,000 API calls/mo", "100GB storage", "more than 3 integrations".
      </Hint>
      <Field label="Upgrade triggers (one per line)">
        <Textarea rows={8} value={s.upgradeTriggers} onChange={(e) => update("upgradeTriggers", e.target.value)}
          placeholder={"10 seats\n5,000 API calls / month\nUnlimited storage\nSSO required\nDedicated CSM"} />
      </Field>
    </div>
  );
}

function ReviewStep({ s, update }: { s: Strategy; update: <K extends keyof Strategy>(k: K, v: Strategy[K]) => void }) {
  const md = buildMarkdown(s);

  const copyMd = async () => {
    await navigator.clipboard.writeText(md);
    toast({ title: "Copied to clipboard", description: "Paste it into Notion, your site, or your deck." });
  };
  const downloadMd = () => {
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pricing-strategy.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCheck = (key: string) =>
    update("checklist", { ...s.checklist, [key]: !s.checklist[key] });

  return (
    <div className="space-y-6">
      <StepHeader kicker="Step 6" title="Review & export"
        blurb="Your complete strategy — exactly as it will export. Edit any earlier step if something looks off." />

      <div className="flex flex-wrap gap-2">
        <Button onClick={copyMd} className="gap-2"><Copy className="h-4 w-4" /> Copy as Markdown</Button>
        <Button onClick={downloadMd} variant="outline" className="gap-2"><Download className="h-4 w-4" /> Download .md</Button>
        <Button onClick={() => window.print()} variant="outline" className="gap-2"><Download className="h-4 w-4" /> Print / Save PDF</Button>
      </div>

      <article className="rounded-lg border border-border bg-card p-6 space-y-6">
        <header>
          <h3 className="text-2xl font-bold">Pricing Strategy</h3>
          {s.context.businessModel && <p className="text-sm text-muted-foreground mt-1">{s.context.businessModel}</p>}
        </header>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Value Metric</h4>
          <div className="text-lg font-semibold">{s.valueMetric.name || <em className="text-muted-foreground font-normal">— not set —</em>}</div>
          <p className="text-sm text-muted-foreground mt-1">{s.valueMetric.rationale}</p>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Pricing Model</h4>
          <div className="flex flex-wrap gap-2">
            {s.models.length === 0 && <em className="text-sm text-muted-foreground">— none selected —</em>}
            {s.models.map((m) => (
              <span key={m} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{m}</span>
            ))}
          </div>
          {s.modelNotes && <p className="text-sm text-muted-foreground mt-2">{s.modelNotes}</p>}
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Tier Architecture</h4>
          <div className="grid md:grid-cols-3 gap-3">
            {s.tiers.map((t, i) => (
              <div key={i} className={`p-4 rounded-lg border ${i === 1 ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="flex items-baseline justify-between mb-1">
                  <div className="font-bold">{t.name}</div>
                  {i === 1 && <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Recommended</span>}
                </div>
                <div className="text-2xl font-bold mb-1">{t.monthlyPrice || "—"}</div>
                {t.annualPrice && t.annualPrice !== t.monthlyPrice && (
                  <div className="text-xs text-muted-foreground mb-2">{t.annualPrice}/mo billed annually</div>
                )}
                <p className="text-xs italic text-muted-foreground mb-2">{t.job}</p>
                <ul className="text-sm space-y-1">
                  {t.features.split("\n").filter(Boolean).map((f, j) => (
                    <li key={j} className="flex gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /><span>{f}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {s.annualDiscountPct && <p className="text-xs text-muted-foreground mt-3">Annual discount: <strong>{s.annualDiscountPct}%</strong></p>}
          {s.anchoringNotes && <p className="text-xs text-muted-foreground mt-1">Anchoring: {s.anchoringNotes}</p>}
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Upgrade Triggers</h4>
          <ul className="text-sm space-y-1">
            {s.upgradeTriggers.split("\n").filter(Boolean).map((u, i) => (
              <li key={i} className="flex gap-2"><Zap className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /><span>{u}</span></li>
            ))}
            {!s.upgradeTriggers.trim() && <em className="text-muted-foreground">— none yet —</em>}
          </ul>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Pricing Maturity Checklist</h4>
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => (
              <label key={item} className="flex items-start gap-2 text-sm cursor-pointer">
                <Checkbox checked={!!s.checklist[item]} onCheckedChange={() => toggleCheck(item)} className="mt-0.5" />
                <span className={s.checklist[item] ? "line-through text-muted-foreground" : ""}>{item}</span>
              </label>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}

// ---------- Markdown export ----------
function buildMarkdown(s: Strategy): string {
  const lines: string[] = [];
  lines.push(`# Pricing Strategy\n`);
  if (s.context.businessModel) lines.push(`**Business:** ${s.context.businessModel}\n`);
  if (s.context.segments) lines.push(`**Segments:** ${s.context.segments}\n`);
  if (s.context.currentPricing) lines.push(`**Current pricing:** ${s.context.currentPricing}\n`);

  lines.push(`\n## Value Metric\n**${s.valueMetric.name || "—"}**\n\n${s.valueMetric.rationale}\n`);
  lines.push(`\n## Pricing Model\n${s.models.join(", ") || "—"}\n\n${s.modelNotes}\n`);

  lines.push(`\n## Tier Architecture\n`);
  s.tiers.forEach((t) => {
    lines.push(`### ${t.name} — ${t.monthlyPrice || "—"}${t.annualPrice && t.annualPrice !== t.monthlyPrice ? ` (${t.annualPrice}/mo annual)` : ""}`);
    lines.push(`*${t.job}*\n`);
    t.features.split("\n").filter(Boolean).forEach((f) => lines.push(`- ${f}`));
    lines.push("");
  });
  if (s.annualDiscountPct) lines.push(`**Annual discount:** ${s.annualDiscountPct}%\n`);
  if (s.anchoringNotes) lines.push(`**Anchoring:** ${s.anchoringNotes}\n`);

  lines.push(`\n## Upgrade Triggers\n`);
  s.upgradeTriggers.split("\n").filter(Boolean).forEach((u) => lines.push(`- ${u}`));

  lines.push(`\n## Pricing Maturity Checklist\n`);
  CHECKLIST_ITEMS.forEach((i) => lines.push(`- [${s.checklist[i] ? "x" : " "}] ${i}`));

  return lines.join("\n");
}
