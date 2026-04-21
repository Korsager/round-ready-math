import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Calculator } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deriveBlendedARPA, type PricingStrategy } from "@/lib/pricingStrategy";

const fmtUsd = (v: number) => {
  const n = Math.round(v);
  return n < 0 ? `-$${Math.abs(n).toLocaleString("en-US")}` : `$${n.toLocaleString("en-US")}`;
};
const fmtUsd2 = (v: number) => `$${v.toFixed(2)}`;
const fmtCount = (v: number) =>
  v >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(1);

export interface PricingReconciliationProps {
  pricing: PricingStrategy;
  startingMRR: number;
  monthlyNewBookings: number;
  /** Called when user clicks "Estimate from pricing" and confirms a customer count. */
  onEstimateMRR: (customers: number) => void;
}

export default function PricingReconciliation({
  pricing, startingMRR, monthlyNewBookings, onEstimateMRR,
}: PricingReconciliationProps) {
  const arpa = deriveBlendedARPA(pricing);
  const tiers = pricing?.tiers;
  const anyTier = !!tiers && tiers.some((t) => (t.monthlyPriceNum && t.monthlyPriceNum > 0) || /\d/.test(t.monthlyPrice ?? ""));
  const onlyCustom = anyTier && arpa === null;

  // No pricing at all → soft nudge.
  if (!anyTier) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-[12px] text-muted-foreground">
        <Link to="/course/pricing" className="text-primary hover:underline font-medium">
          Set your tiers in Step 1
        </Link>{" "}
        to cross-check this forecast.
      </div>
    );
  }

  // Tiers exist but only "Custom" → can't compute.
  if (onlyCustom) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
        Add at least one numeric price in{" "}
        <Link to="/course/pricing" className="underline font-medium">Step 1</Link> to cross-check this forecast.
      </div>
    );
  }

  const arpaNum = arpa ?? 0;
  const impliedCustomers = arpaNum > 0 ? startingMRR / arpaNum : 0;
  const impliedNew = arpaNum > 0 ? monthlyNewBookings / arpaNum : 0;

  // "Wildly large" sanity-check: >1M is heroic for any seed-stage app; <1 means
  // the MRR is below the price of a single subscription.
  const warnCustomers =
    impliedCustomers > 0 && (impliedCustomers < 1 || impliedCustomers > 1_000_000);
  const warnNew =
    impliedNew > 0 && (impliedNew < 1 || impliedNew > 1_000_000);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-[13px] font-semibold text-[#111827]">Pricing → Forecast cross-check</h3>
          <p className="text-[11px] text-muted-foreground">
            Blended ARPA derived from your tiers (Starter 20% · Pro 65% · Enterprise 15%).
          </p>
        </div>
        <EstimateButton arpa={arpaNum} onEstimateMRR={onEstimateMRR} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Cell label="Blended ARPA" value={fmtUsd2(arpaNum)} />
        <Cell label="Implied customers @ Starting MRR" value={fmtCount(impliedCustomers)} />
        <Cell label="Implied new customers / mo" value={fmtCount(impliedNew)} />
      </div>
      {(warnCustomers || warnNew) && (
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
          <AlertTriangle size={11} className="shrink-0 mt-0.5" />
          <span>
            Your pricing and forecast imply{" "}
            {warnCustomers ? <strong>{fmtCount(impliedCustomers)} customers</strong> : null}
            {warnCustomers && warnNew ? " and " : ""}
            {warnNew ? <strong>{fmtCount(impliedNew)} new customers / mo</strong> : null}
            {" "}— double-check that this matches reality.
          </span>
        </div>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFB] p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-[16px] font-semibold tabular-nums text-[#111827]">{value}</div>
    </div>
  );
}

function EstimateButton({ arpa, onEstimateMRR }: { arpa: number; onEstimateMRR: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const disabled = arpa <= 0;
  const submit = () => {
    const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
    if (!isFinite(n) || n <= 0) {
      toast.error("Enter a positive customer count.");
      return;
    }
    const newMRR = Math.round(n * arpa);
    onEstimateMRR(newMRR);
    toast.success("Starting MRR updated", {
      description: `${n.toLocaleString("en-US")} customers × ${fmtUsd2(arpa)} = ${fmtUsd(newMRR)}`,
    });
    setOpen(false);
    setRaw("");
  };
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-[11px] gap-1"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Calculator size={12} /> Estimate from pricing
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Estimate Starting MRR</DialogTitle>
            <DialogDescription>
              We'll multiply your current paying customers by the blended ARPA ({fmtUsd2(arpa)}/mo).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rec-customers" className="text-[12px]">Current paying customers</Label>
            <Input
              id="rec-customers"
              type="text"
              inputMode="numeric"
              autoFocus
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="e.g. 120"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Set MRR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
