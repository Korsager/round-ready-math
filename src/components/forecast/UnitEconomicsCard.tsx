import type { UnitEconomicsResult, UEStatus } from "@/lib/unitEconomics";

interface Props {
  result: UnitEconomicsResult;
  cac: number;
}

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};

const toneClasses: Record<UEStatus, { wrap: string; label: string; chip: string; chipText: string }> = {
  ok:   { wrap: "border-emerald-200 bg-emerald-50",  label: "text-emerald-700", chip: "bg-emerald-100",  chipText: "text-emerald-700" },
  warn: { wrap: "border-amber-200 bg-amber-50",      label: "text-amber-700",   chip: "bg-amber-100",    chipText: "text-amber-700" },
  fail: { wrap: "border-red-200 bg-red-50",          label: "text-destructive", chip: "bg-red-100",      chipText: "text-destructive" },
};

const ratioLabel = (s: UEStatus) =>
  s === "ok" ? "Healthy" : s === "warn" ? "Marginal" : "Underwater";
const paybackLabel = (s: UEStatus) =>
  s === "ok" ? "Healthy" : s === "warn" ? "Stretched" : "Too long";

export default function UnitEconomicsCard({ result, cac }: Props) {
  const { ltv, ltvCacRatio, paybackMonths, paybackStatus, ratioStatus, blendedGrossMarginPct } = result;
  const r = toneClasses[ratioStatus];
  const p = toneClasses[paybackStatus];

  return (
    <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-[15px] font-semibold text-[#111827]">Unit economics</h3>
        <span className="text-[11px] text-muted-foreground">From CAC, ARPU & churn</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* LTV */}
        <div className="rounded-lg border border-[#E5E7EB] p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">LTV</div>
          <div className="text-[22px] font-semibold tabular-nums text-[#111827] leading-tight">{fmtUsd(ltv)}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {blendedGrossMarginPct.toFixed(0)}% GM · capped at 5 yrs
          </div>
        </div>
        {/* LTV:CAC */}
        <div className={`rounded-lg border p-3 ${r.wrap}`}>
          <div className={`text-[10px] uppercase tracking-wide font-semibold ${r.label}`}>LTV : CAC</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <div className="text-[22px] font-semibold tabular-nums text-[#111827] leading-tight">
              {cac > 0 ? `${ltvCacRatio.toFixed(1)}×` : "—"}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${r.chip} ${r.chipText}`}>
              {ratioLabel(ratioStatus)}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">≥ 3× healthy · 1.5–3× marginal</div>
        </div>
        {/* Payback */}
        <div className={`rounded-lg border p-3 ${p.wrap}`}>
          <div className={`text-[10px] uppercase tracking-wide font-semibold ${p.label}`}>CAC payback</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <div className="text-[22px] font-semibold tabular-nums text-[#111827] leading-tight">
              {paybackMonths > 0 ? `${paybackMonths} mo` : "—"}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${p.chip} ${p.chipText}`}>
              {paybackLabel(paybackStatus)}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">≤ 12 mo healthy · 12–18 stretched</div>
        </div>
      </div>
    </section>
  );
}
