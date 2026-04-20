import { useEffect, useState, useCallback } from "react";
import type { ForecastInputs } from "./forecast";
import { DEFAULT_INPUTS } from "./presets";
import { DEFAULT_CASHFLOW } from "./cashflow";
import { DEFAULT_AUTO_PLAN, type PlannedRaise, type AutoPlanConfig } from "./raises";

export interface FundraiseAssumptions {
  raise: number;
  dilutionPct: number;
  targetIrr: number;
  yearsToExit: number;
  targetMoic: number;
  revenueMultiple: number;
  valuationMethod: "auto" | "revenue" | "ownership";
}

export interface CashflowAssumptions {
  startingCash: number;
  monthsUntilRaise: number;
  startingBurn: number;
  opexGrowthRate: number;
  grossMargin: number;
}

export interface RaisePlanAssumptions {
  manualRaises: PlannedRaise[];
  autoPlan: AutoPlanConfig;
}

export interface Assumptions {
  fundraise: FundraiseAssumptions;
  forecast: ForecastInputs;
  cashflow: CashflowAssumptions;
  raisePlan: RaisePlanAssumptions;
  forecastManuallyEdited: boolean;
}

export const DEFAULT_FUNDRAISE: FundraiseAssumptions = {
  raise: 2_000_000,
  dilutionPct: 20,
  targetIrr: 30,
  yearsToExit: 5,
  targetMoic: 4,
  revenueMultiple: 8,
  valuationMethod: "auto",
};

export const DEFAULT_RAISE_PLAN: RaisePlanAssumptions = {
  manualRaises: [],
  autoPlan: DEFAULT_AUTO_PLAN,
};

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  fundraise: DEFAULT_FUNDRAISE,
  forecast: DEFAULT_INPUTS,
  cashflow: DEFAULT_CASHFLOW,
  raisePlan: DEFAULT_RAISE_PLAN,
  forecastManuallyEdited: false,
};

const STORAGE_KEY = "founders-toolkit-assumptions-v1";

function load(): Assumptions {
  if (typeof window === "undefined") return DEFAULT_ASSUMPTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ASSUMPTIONS;
    const parsed = JSON.parse(raw);
    const { fundraiseAmount: _legacy, ...cashflowRest } = parsed.cashflow ?? {};
    const rp = parsed.raisePlan ?? {};
    return {
      fundraise: { ...DEFAULT_FUNDRAISE, ...(parsed.fundraise ?? {}) },
      forecast: { ...DEFAULT_INPUTS, ...(parsed.forecast ?? {}) },
      cashflow: { ...DEFAULT_CASHFLOW, ...cashflowRest },
      raisePlan: {
        manualRaises: Array.isArray(rp.manualRaises) ? rp.manualRaises : [],
        autoPlan: { ...DEFAULT_AUTO_PLAN, ...(rp.autoPlan ?? {}) },
      },
      forecastManuallyEdited: !!parsed.forecastManuallyEdited,
    };
  } catch {
    return DEFAULT_ASSUMPTIONS;
  }
}

const listeners = new Set<(a: Assumptions) => void>();
let current: Assumptions = load();

function save(next: Assumptions) {
  current = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l(next));
}

export function useAssumptions() {
  const [state, setState] = useState<Assumptions>(current);
  useEffect(() => {
    const l = (a: Assumptions) => setState(a);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const setForecast = useCallback((f: ForecastInputs | ((p: ForecastInputs) => ForecastInputs)) => {
    const next = typeof f === "function" ? (f as (p: ForecastInputs) => ForecastInputs)(current.forecast) : f;
    save({ ...current, forecast: next, forecastManuallyEdited: true });
  }, []);
  const seedForecast = useCallback((f: ForecastInputs | ((p: ForecastInputs) => ForecastInputs)) => {
    const next = typeof f === "function" ? (f as (p: ForecastInputs) => ForecastInputs)(current.forecast) : f;
    save({ ...current, forecast: next });
  }, []);
  const clearForecastEditedFlag = useCallback(() => {
    save({ ...current, forecastManuallyEdited: false });
  }, []);
  const setCashflow = useCallback((c: CashflowAssumptions | ((p: CashflowAssumptions) => CashflowAssumptions)) => {
    const next = typeof c === "function" ? (c as (p: CashflowAssumptions) => CashflowAssumptions)(current.cashflow) : c;
    save({ ...current, cashflow: next });
  }, []);
  const setFundraise = useCallback((f: FundraiseAssumptions | ((p: FundraiseAssumptions) => FundraiseAssumptions)) => {
    const next = typeof f === "function" ? (f as (p: FundraiseAssumptions) => FundraiseAssumptions)(current.fundraise) : f;
    save({ ...current, fundraise: next });
  }, []);
  const setRaisePlan = useCallback((r: RaisePlanAssumptions | ((p: RaisePlanAssumptions) => RaisePlanAssumptions)) => {
    const next = typeof r === "function" ? (r as (p: RaisePlanAssumptions) => RaisePlanAssumptions)(current.raisePlan) : r;
    save({ ...current, raisePlan: next });
  }, []);
  const reset = useCallback(() => save(DEFAULT_ASSUMPTIONS), []);

  return { assumptions: state, setForecast, seedForecast, clearForecastEditedFlag, setCashflow, setFundraise, setRaisePlan, reset };
}

export function parseShorthand(raw: string): number | null {
  const s = raw.trim().replace(/[$,]/g, "").replace(/%$/, "").replace(/×$/, "").replace(/x$/i, "").replace(/yr$/i, "");
  if (!s) return null;
  const match = s.match(/^(-?\d+\.?\d*)\s*([mkb]?)$/i);
  if (!match) return null;
  let num = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "k") num *= 1_000;
  else if (unit === "m") num *= 1_000_000;
  else if (unit === "b") num *= 1_000_000_000;
  return isNaN(num) ? null : num;
}
