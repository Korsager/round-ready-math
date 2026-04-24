import { useEffect, useMemo, useState } from "react";

import {
  Check, ChevronLeft, ChevronRight, Target, Layers,
  DollarSign, Zap, ClipboardCheck, Lightbulb, Sparkles, RotateCcw, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import CourseLayout from "@/components/course/CourseLayout";
import {
  PricingStrategy,
  PricingModel,
  PricingTier,
  VanWestendorp,
  blankPricingStrategy,
  blankVanWestendorp,
  blendedARPU,
  blendedGrossMargin,
  derivedStartingMRR,
  derivedMonthlyNewBookings,
  parseVwPrice,
  vwAcceptableRange,
} from "@/lib/pricingStrategy";
import { computePricingMaturity } from "@/lib/pricingMaturity";
import { useAssumptions } from "@/lib/assumptions";

const fmtUsd0 = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

const CHECKLIST_ITEMS = [
  "We know which features our users value most",
  "We have defined our value metric",
  "Packaging is aligned to usage and outcomes",
  "We've spoken to 20+ customers about willingness-to-pay",
  "Pricing is reviewed at least monthly",
];

const STEPS = [
  { id: 0, title: "Your Business",       icon: Sparkles,        short: "Context" },
  { id: 1, title: "Value Metric",        icon: Target,          short: "Step 1" },
  { id: 2, title: "Pricing Model",       icon: Layers,          short: "Step 2" },
  { id: 3, title: "3 Tiers",             icon: Layers,          short: "Step 3" },
  { id: 4, title: "Price Points",        icon: DollarSign,      short: "Step 4" },
  { id: 5, title: "Willingness to Pay",  icon: BarChart3,       short: "Step 5" },
  { id: 6, title: "Upgrade Triggers",    icon: Zap,             short: "Step 6" },
  { id: 7, title: "Review",              icon: ClipboardCheck,  short: "Step 7" },
];

const MODELS: { id: PricingModel; desc: string }[] = [
  { id: "Tiered", desc: "Good / Better / Best — most common & effective" },
  { id: "Usage-based", desc: "Best for >120% NRR (Twilio, AWS, Snowflake)" },
  { id: "Freemium", desc: "When users share what they create" },
  { id: "Free Trial", desc: "Notion, Superhuman — earn the upgrade" },
  { id: "Hybrid", desc: "Combine two — e.g. tiered + usage overage" },
];

export default function CoursePricing() {
  const [step, setStep] = useState(0);
  const { assumptions, seedForecast, clearForecastEditedFlag, setPricing } = useAssumptions();

  // Local working copy mirrors the store; seeded from assumptions.pricing on
  // first mount and ensures the checklist always carries every item.
  const [s, setS] = useState<PricingStrategy>(() => {
    const loaded = assumptions.pricing;
    const checklist = { ...Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i, false])), ...loaded.checklist };
    return { ...loaded, checklist };
  });

  // Persist to the unified store on every change.
  useEffect(() => {
    setPricing(s);
  }, [s, setPricing]);

  const update = <K extends keyof PricingStrategy>(key: K, value: PricingStrategy[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const updateTier = (i: 0 | 1 | 2, patch: Partial<PricingTier>) =>
    setS((prev) => {
      const tiers = [...prev.tiers] as [PricingTier, PricingTier, PricingTier];
      tiers[i] = { ...tiers[i], ...patch };
      return { ...prev, tiers };
    });

  const reset = () => {
    if (confirm("Reset the entire strategy? This cannot be undone.")) {
      setS(blankPricingStrategy());
      setStep(0);
      toast({ title: "Strategy reset" });
    }
  };

  const prev = () => setStep((n) => Math.max(n - 1, 0));

  const seedFromPricing = () => {
    const startingMRR = derivedStartingMRR(s);
    const monthlyNewBookings = derivedMonthlyNewBookings(s);
    if (startingMRR > 0 || monthlyNewBookings > 0) {
      seedForecast({ ...assumptions.forecast, startingMRR, monthlyNewBookings });
      clearForecastEditedFlag();
    }
  };

  const next = () => {
    if (step === 4) seedFromPricing();
    setStep((n) => Math.min(n + 1, STEPS.length - 1));
  };

  return (
    <CourseLayout
      step="pricing"
      title="1. Pricing"
      intro="Lock in your value metric, model, tiers, and price points. Strong pricing is the single biggest lever on revenue — get this right before forecasting."
      onNext={() => { seedFromPricing(); }}
    >
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <section className="grid lg:grid-cols-[260px_1fr] gap-6 p-4 sm:p-6">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
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
            {step === 5 && <WillingnessToPayStep s={s} update={update} />}
            {step === 6 && <TriggersStep s={s} update={update} />}
            {step === 7 && <ReviewStep s={s} update={update} />}

            {/* Inner step nav */}
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
    </CourseLayout>
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
      <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground">{blurb}</p>
    </div>
  );
}

// ---------- Step components ----------
function ContextStep({ s, update }: { s: PricingStrategy; update: <K extends keyof PricingStrategy>(k: K, v: PricingStrategy[K]) => void }) {
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

function ValueMetricStep({ s, update }: { s: PricingStrategy; update: <K extends keyof PricingStrategy>(k: K, v: PricingStrategy[K]) => void }) {
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

function ModelStep({ s, update }: { s: PricingStrategy; update: <K extends keyof PricingStrategy>(k: K, v: PricingStrategy[K]) => void }) {
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

function TiersStep({ s, updateTier }: { s: PricingStrategy; updateTier: (i: 0|1|2, p: Partial<PricingTier>) => void }) {
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
              <Textarea rows={3} value={t.job} onChange={(e) => updateTier(i as 0|1|2, { job: e.target.value })} />
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
}: { s: PricingStrategy; updateTier: (i: 0|1|2, p: Partial<PricingTier>) => void; update: <K extends keyof PricingStrategy>(k: K, v: PricingStrategy[K]) => void }) {
  const intToStr = (n: number) => (n === 0 ? "" : String(n));
  const numToStr = (n: number) => (n === 0 ? "" : String(n));
  const parseInt0 = (raw: string) => {
    const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const parseFloat0 = (raw: string) => {
    const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const totalMix = s.tiers.reduce((sum, t) => sum + (t.targetMix || 0), 0);
  const mixOff = Math.abs(totalMix - 100) > 0.01 && totalMix > 0;
  const arpu = blendedARPU(s);
  const startMRR = derivedStartingMRR(s);
  const newBookings = derivedMonthlyNewBookings(s);
  const blendedGM = blendedGrossMargin(s);

  return (
    <div className="space-y-5">
      <StepHeader kicker="Step 4" title="Set your price points"
        blurb="Type each number yourself. Anchor with the high tier — price signals quality." />
      <Hint>
        £9/mo says "commodity tool." £900/mo says "serious partner." Always lead with your highest tier publicly to anchor effectively.
      </Hint>
      <p className="text-xs text-muted-foreground">
        The numeric price and target mix feed your revenue forecast. Use the display field for anything ("$29", "Custom") and the numeric field for the math.
      </p>
      <div className="rounded-lg border border-border overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[1.1fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr] bg-muted text-[11px] font-semibold uppercase tracking-wider">
            <div className="p-3">Tier</div>
            <div className="p-3">Monthly (display)</div>
            <div className="p-3">As a number</div>
            <div className="p-3">Annual (per mo)</div>
            <div className="p-3">Target mix %</div>
            <div className="p-3">Gross margin %</div>
          </div>
          {s.tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-[1.1fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr] border-t border-border items-center">
              <div className="p-3 font-semibold">{t.name || `Tier ${i + 1}`}</div>
              <div className="p-3">
                <Input value={t.monthlyPrice} onChange={(e) => updateTier(i as 0|1|2, { monthlyPrice: e.target.value })}
                  placeholder="$29 or Custom" />
              </div>
              <div className="p-3">
                <Input type="number" min={0} step={1} inputMode="decimal"
                  value={numToStr(t.monthlyPriceNum)}
                  onChange={(e) => updateTier(i as 0|1|2, { monthlyPriceNum: parseFloat0(e.target.value) })}
                  placeholder="29" />
              </div>
              <div className="p-3">
                <Input value={t.annualPrice} onChange={(e) => updateTier(i as 0|1|2, { annualPrice: e.target.value })}
                  placeholder="$24" />
              </div>
              <div className="p-3">
                <Input type="number" min={0} max={100} step={1} inputMode="numeric"
                  value={numToStr(t.targetMix)}
                  onChange={(e) => updateTier(i as 0|1|2, { targetMix: parseFloat0(e.target.value) })}
                  placeholder="0" />
              </div>
              <div className="p-3">
                <Input type="number" min={0} max={100} step={1} inputMode="numeric"
                  value={numToStr(t.grossMarginPct)}
                  onChange={(e) => updateTier(i as 0|1|2, { grossMarginPct: parseFloat0(e.target.value) })}
                  placeholder="75" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {mixOff && (
        <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Target mix sums to {totalMix}% — should add up to 100% for an accurate blended ARPU.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Current customers (today)" hint="Total paying customers across all tiers right now.">
          <Input type="number" min={0} step={1} inputMode="numeric"
            value={intToStr(s.currentCustomers)}
            onChange={(e) => update("currentCustomers", parseInt0(e.target.value))}
            placeholder="0" />
        </Field>
        <Field label="New customers per month" hint="Net new logos you expect to add monthly.">
          <Input type="number" min={0} step={1} inputMode="numeric"
            value={intToStr(s.targetNewCustomersPerMonth)}
            onChange={(e) => update("targetNewCustomersPerMonth", parseInt0(e.target.value))}
            placeholder="0" />
        </Field>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
        {arpu > 0 ? (
          <p className="text-sm">
            Blended ARPU: <strong>{fmtUsd0(arpu)}</strong> · implies starting MRR of{" "}
            <strong>{fmtUsd0(startMRR)}</strong> and new bookings of{" "}
            <strong>{fmtUsd0(newBookings)} / month</strong>.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add numeric prices, target mix, and customer counts above to see your blended ARPU and forecast seed.
          </p>
        )}
        {blendedGM > 0 && (
          <p className="text-xs text-muted-foreground">
            Blended gross margin: <strong className="text-foreground">{blendedGM.toFixed(1)}%</strong> — flows into Cashflow unless overridden.
          </p>
        )}
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

function TriggersStep({ s, update }: { s: PricingStrategy; update: <K extends keyof PricingStrategy>(k: K, v: PricingStrategy[K]) => void }) {
  return (
    <div className="space-y-5">
      <StepHeader kicker="Step 6" title="Add upgrade triggers"
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

function ReviewStep({ s, update }: { s: PricingStrategy; update: <K extends keyof PricingStrategy>(k: K, v: PricingStrategy[K]) => void }) {
  const toggleCheck = (key: string) =>
    update("checklist", { ...s.checklist, [key]: !s.checklist[key] });

  return (
    <div className="space-y-6">
      <StepHeader kicker="Step 7" title="Review your strategy"
        blurb="Your complete strategy. Edit any earlier step if something looks off — full export (JSON, PDF, PPTX) happens at the end of the course." />

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
          <PricingMaturityScore checklist={s.checklist} />
          <div className="space-y-2 mt-4">
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

function PricingMaturityScore({ checklist }: { checklist: Record<string, boolean> }) {
  const m = computePricingMaturity({ checklist } as PricingStrategy);
  const palette = {
    good: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warn: "bg-amber-50 border-amber-200 text-amber-900",
    bad: "bg-red-50 border-red-200 text-red-900",
  }[m.tone];
  return (
    <div className={`rounded-lg border p-3 ${palette}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Pricing maturity score</div>
        <div className="text-2xl font-bold tabular-nums">{m.score}/{m.total}</div>
      </div>
      <p className="text-sm mt-1">{m.verdict}</p>
    </div>
  );
}
