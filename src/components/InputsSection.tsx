import React from "react";
import TooltipIcon from "./TooltipIcon";
import type { CalcInputs } from "@/hooks/useCalc";

interface Props {
  inputs: CalcInputs;
  update: (field: keyof CalcInputs, value: number) => void;
  reset: () => void;
}

const fmt = (n: number) => n.toLocaleString("en-US");

interface SliderInputProps {
  label: string;
  tooltip: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  suffix?: string;
  prefix?: string;
  isEmerald?: boolean;
}

const SliderInput: React.FC<SliderInputProps> = ({
  label, tooltip, value, min, max, step, onChange, format, suffix, prefix, isEmerald
}) => {
  const display = format ? format(value) : fmt(value);
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          {label}
          <TooltipIcon text={tooltip} />
        </label>
        <span className={`text-sm font-bold tabular-nums ${isEmerald ? 'text-primary' : 'text-accent'}`}>
          {prefix}{display}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={isEmerald ? "slider-emerald" : ""}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">{prefix}{format ? format(min) : fmt(min)}{suffix}</span>
        <span className="text-[10px] text-muted-foreground">{prefix}{format ? format(max) : fmt(max)}{suffix}</span>
      </div>
    </div>
  );
};

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

      <div className="space-y-6">
        <SliderInput
          label="Amount Raising"
          tooltip="How much money you're asking for in this round."
          value={inputs.raise}
          min={500_000} max={20_000_000} step={100_000}
          onChange={v => update("raise", v)}
          prefix="$"
          format={v => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`)}
        />
        <SliderInput
          label="Pre-Money Valuation"
          tooltip="Your company's value before new cash arrives (what current owners 'own')."
          value={inputs.preMoney}
          min={2_000_000} max={50_000_000} step={500_000}
          onChange={v => update("preMoney", v)}
          prefix="$"
          format={v => `${(v / 1_000_000).toFixed(1)}M`}
        />
        <SliderInput
          label="Fully Diluted Shares"
          tooltip="Total number of shares including all options and convertibles."
          value={inputs.shares}
          min={1_000_000} max={100_000_000} step={500_000}
          onChange={v => update("shares", v)}
          format={v => `${(v / 1_000_000).toFixed(1)}M`}
        />
        <SliderInput
          label="Target IRR for Investors"
          tooltip="Annualized return rate VCs aim for (usually 25-40%+)."
          value={inputs.targetIrr}
          min={15} max={60} step={1}
          onChange={v => update("targetIrr", v)}
          suffix="%"
          format={v => v.toString()}
          isEmerald
        />
        <SliderInput
          label="Expected Years to Exit"
          tooltip="How long until the company is acquired or goes public."
          value={inputs.yearsToExit}
          min={3} max={10} step={0.5}
          onChange={v => update("yearsToExit", v)}
          suffix=" yrs"
          format={v => v.toFixed(1)}
        />
        <SliderInput
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
