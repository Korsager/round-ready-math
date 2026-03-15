import React from "react";
import TooltipIcon from "./TooltipIcon";
import type { CalcResults, CalcInputs } from "@/hooks/useCalc";

interface Props {
  results: CalcResults;
  inputs: CalcInputs;
}

const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtDollar = (n: number) => `$${n.toFixed(2)}`;

type Status = "great" | "tight" | "unrealistic";

function getStatus(calculatedIrr: number, targetIrr: number): Status {
  if (calculatedIrr >= targetIrr) return "great";
  if (calculatedIrr >= targetIrr * 0.7) return "tight";
  return "unrealistic";
}

const statusConfig: Record<Status, { label: string; bg: string; text: string; msg: string }> = {
  great: {
    label: "Great Fit ✓",
    bg: "bg-success-light",
    text: "text-success-foreground",
    msg: "Your MOIC and timeline exceed the target IRR. Strong position for negotiation.",
  },
  tight: {
    label: "Tight – Need Faster/Bigger Exit",
    bg: "bg-warning-light",
    text: "text-warning-foreground",
    msg: "Close but below target. Consider a higher MOIC or shorter timeline.",
  },
  unrealistic: {
    label: "Unrealistic ✗",
    bg: "bg-danger-light",
    text: "text-danger-foreground",
    msg: "This scenario falls well below target IRR. Investors likely won't bite.",
  },
};

const ResultsDashboard: React.FC<Props> = ({ results, inputs }) => {
  const status = getStatus(results.calculatedIrr, inputs.targetIrr);
  const cfg = statusConfig[status];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Valuation Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Valuation & Dilution
        </h3>
        <div className="space-y-3">
          <Row label="Pre-Money" tooltip="Your company's value before new cash arrives." value={fmtM(inputs.preMoney)} />
          <Row label="Post-Money" tooltip="Company value after investment = pre-money + cash raised." value={fmtM(results.postMoney)} />
          <Row label="Price Per Share" tooltip="What investors pay per share in this round." value={fmtDollar(results.pricePerShare)} />
          <div className="h-px bg-border my-1" />
          <Row label="Investor Ownership" tooltip="Percentage of the company new investors get." value={fmtPct(results.investorOwnership)} highlight="primary" />
          <Row label="Your Dilution" tooltip="How much existing owners' percentage shrinks (aim ~15–25% per round)." value={fmtPct(results.dilution)} />
        </div>
      </div>

      {/* Exit Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Exit & Return
        </h3>
        <div className="space-y-3">
          <Row label="Required Exit Value" tooltip="The company sale/valuation needed at exit for investors to hit their target return rate." value={fmtM(results.requiredExitValue)} highlight="accent" />
          <Row label="Required MOIC" tooltip="Multiple on Invested Capital needed to hit target IRR." value={`${results.requiredMoic.toFixed(1)}x`} />
          <div className="h-px bg-border my-1" />
          <Row label="Your MOIC IRR" tooltip="IRR at your chosen MOIC and timeline." value={`${results.calculatedIrr.toFixed(1)}%`} highlight={status === "great" ? "primary" : status === "tight" ? "warning" : "danger"} />
        </div>
        <div className={`mt-4 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest text-center ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </div>
        <p className={`mt-2 text-xs text-center ${cfg.text}`}>{cfg.msg}</p>
      </div>
    </div>
  );
};

interface RowProps {
  label: string;
  tooltip: string;
  value: string;
  highlight?: "primary" | "accent" | "warning" | "danger";
}

const highlightClasses: Record<string, string> = {
  primary: "text-primary",
  accent: "text-accent",
  warning: "text-warning",
  danger: "text-danger",
};

const Row: React.FC<RowProps> = ({ label, tooltip, value, highlight }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground flex items-center gap-1">
      {label} <TooltipIcon text={tooltip} />
    </span>
    <span className={`font-bold tabular-nums text-sm ${highlight ? highlightClasses[highlight] : ""}`}>
      {value}
    </span>
  </div>
);

export default ResultsDashboard;
