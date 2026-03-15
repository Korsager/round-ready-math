import React from "react";
import TooltipIcon from "./TooltipIcon";
import type { CalcInputs } from "@/hooks/useCalc";
import { Input } from "./ui/input";

interface Props {
  inputs: CalcInputs;
  update: (field: keyof CalcInputs, value: number) => void;
  reset: () => void;
}

interface FieldInputProps {
  label: string;
  tooltip: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  parse?: (s: string) => number;
  suffix?: string;
  prefix?: string;
  isEmerald?: boolean;
}

const FieldInput: React.FC<FieldInputProps> = ({
  label, tooltip, value, min, max, step, onChange, format, parse, suffix, prefix, isEmerald
}) => {
  const [localValue, setLocalValue] = React.useState(format ? format(value) : value.toString());
  
  React.useEffect(() => {
    setLocalValue(format ? format(value) : value.toString());
  }, [value, format]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    let parsed: number;
    if (parse) {
      parsed = parse(localValue);
    } else {
      parsed = parseFloat(localValue.replace(/[^0-9.\-]/g, ""));
    }
    if (isNaN(parsed)) {
      setLocalValue(format ? format(value) : value.toString());
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    const stepped = Math.round(clamped / step) * step;
    onChange(stepped);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          {label}
          <TooltipIcon text={tooltip} />
        </label>
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''} text-sm font-semibold tabular-nums ${isEmerald ? 'border-primary/30 focus-visible:ring-primary' : 'border-accent/30 focus-visible:ring-accent'}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">Min: {prefix}{format ? format(min) : min.toLocaleString()}{suffix}</span>
        <span className="text-[10px] text-muted-foreground">Max: {prefix}{format ? format(max) : max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
};

const parseMoney = (s: string): number => {
  const clean = s.replace(/[^0-9.mMkK]/g, "");
  const lower = clean.toLowerCase();
  if (lower.includes("m")) return parseFloat(lower.replace("m", "")) * 1_000_000;
  if (lower.includes("k")) return parseFloat(lower.replace("k", "")) * 1_000;
  return parseFloat(clean);
};

const fmtMoney = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`;
const fmtShares = (v: number) => `${(v / 1_000_000).toFixed(1)}M`;

const InputsSection: React.FC<Props> = ({ inputs, update, reset }) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Round Inputs</h2>
        <button
          onClick={reset}
          className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-5">
        <FieldInput
          label="Amount Raising"
          tooltip="How much money you're asking for in this round."
          value={inputs.raise}
          min={500_000} max={20_000_000} step={100_000}
          onChange={v => update("raise", v)}
          prefix="$"
          format={fmtMoney}
          parse={parseMoney}
        />
        <FieldInput
          label="Pre-Money Valuation"
          tooltip="Your company's value before new cash arrives (what current owners 'own')."
          value={inputs.preMoney}
          min={2_000_000} max={50_000_000} step={500_000}
          onChange={v => update("preMoney", v)}
          prefix="$"
          format={fmtMoney}
          parse={parseMoney}
        />
        <FieldInput
          label="Fully Diluted Shares"
          tooltip="Total number of shares including all options and convertibles."
          value={inputs.shares}
          min={1_000_000} max={100_000_000} step={500_000}
          onChange={v => update("shares", v)}
          format={fmtShares}
          parse={parseMoney}
        />
        <FieldInput
          label="Target IRR for Investors"
          tooltip="Annualized return rate VCs aim for (usually 25-40%+)."
          value={inputs.targetIrr}
          min={15} max={60} step={1}
          onChange={v => update("targetIrr", v)}
          suffix="%"
          format={v => v.toString()}
          isEmerald
        />
        <FieldInput
          label="Expected Years to Exit"
          tooltip="How long until the company is acquired or goes public."
          value={inputs.yearsToExit}
          min={3} max={10} step={0.5}
          onChange={v => update("yearsToExit", v)}
          suffix=" yrs"
          format={v => v.toFixed(1)}
        />
        <FieldInput
          label="Target Exit Multiple (MOIC)"
          tooltip="Multiple on Invested Capital – how many times investors get money back (ignores time)."
          value={inputs.targetMoic}
          min={1} max={20} step={0.5}
          onChange={v => update("targetMoic", v)}
          suffix="x"
          format={v => v.toFixed(1)}
          isEmerald
        />
      </div>
    </div>
  );
};

export default InputsSection;
