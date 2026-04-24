import { useEffect, useState, useCallback } from "react";
import type { ForecastInputs } from "./forecast";
import { DEFAULT_INPUTS } from "./presets";
import { DEFAULT_CASHFLOW } from "./cashflow";
import { currentMonthISO } from "./dateAnchor";
import {
  type PricingStrategy,
  blankPricingStrategy,
  mergePricingStrategy,
  LEGACY_PRICING_STORAGE_KEY,
} from "./pricingStrategy";

export type InvestmentType = "preseed" | "seed" | "seriesA";

export interface FundraiseAssumptions {
  investmentType: InvestmentType;
  raise: number;
  dilutionPct: number;
  targetIrr: number;
  yearsToExit: number;
  targetMoic: number;
  revenueMultiple: number;
  valuationMethod: "auto" | "revenue" | "ownership";
}

/** Per-stage preset bundles (numeric only — investmentType is set on the parent). */
export type StagePreset = Omit<FundraiseAssumptions, "investmentType" | "revenueMultiple" | "valuationMethod">;

export const STAGE_PRESETS: Record<InvestmentType, StagePreset> = {
  preseed: { raise: 500_000, dilutionPct: 10, targetIrr: 40, yearsToExit: 8, targetMoic: 20 },
  seed: { raise: 2_500_000, dilutionPct: 20, targetIrr: 35, yearsToExit: 8, targetMoic: 15 },
  seriesA: { raise: 10_000_000, dilutionPct: 20, targetIrr: 30, yearsToExit: 6, targetMoic: 8 },
};

export interface CashflowAssumptions {
  startingCash: number;
  monthsUntilRaise: number;
  startingBurn: number;
  opexGrowthRate: number;
  grossMargin: number;
}

export interface ForecastOverrides {
  startingMRRLocked: boolean;
  newBookingsLocked: boolean;
  grossMarginLocked: boolean;
}

export interface Assumptions {
  fundraise: FundraiseAssumptions;
  forecast: ForecastInputs;
  cashflow: CashflowAssumptions;
  pricing: PricingStrategy;
  forecastOverrides: ForecastOverrides;
  forecastManuallyEdited: boolean;
  /** ISO YYYY-MM. Anchors "month 0" for runway, raise timing, and exports. */
  planStartDate: string;
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

export const DEFAULT_FORECAST_OVERRIDES: ForecastOverrides = {
  startingMRRLocked: false,
  newBookingsLocked: false,
  grossMarginLocked: false,
};

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  fundraise: DEFAULT_FUNDRAISE,
  forecast: DEFAULT_INPUTS,
  cashflow: DEFAULT_CASHFLOW,
  pricing: blankPricingStrategy(),
  forecastOverrides: DEFAULT_FORECAST_OVERRIDES,
  forecastManuallyEdited: false,
  planStartDate: currentMonthISO(),
};

const STORAGE_KEY = "founders-toolkit-assumptions-v1";

// One-time migration: if the old standalone pricing key exists and the new
// store has no pricing yet, fold it in and delete the legacy key.
function readLegacyPricing(): PricingStrategy | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEGACY_PRICING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return mergePricingStrategy(parsed);
  } catch {
    return null;
  }
}

// Exported so UploadJson and tests share the same merge semantics.
export function mergeAssumptionsPayload(parsed: any, legacyPricing: PricingStrategy | null = null): Assumptions {
  // Discard the legacy fundraiseAmount field — raise lives on the fundraise slice.
  const { fundraiseAmount: _legacy, ...cashflowRest } = parsed?.cashflow ?? {};

  let pricing: PricingStrategy;
  if (parsed?.pricing) {
    pricing = mergePricingStrategy(parsed.pricing);
  } else if (legacyPricing) {
    pricing = legacyPricing;
  } else {
    pricing = blankPricingStrategy();
  }

  const planStartDate = typeof parsed?.planStartDate === "string" && /^\d{4}-\d{2}$/.test(parsed.planStartDate)
    ? parsed.planStartDate
    : currentMonthISO();

  return {
    fundraise: { ...DEFAULT_FUNDRAISE, ...(parsed?.fundraise ?? {}) },
    forecast: { ...DEFAULT_INPUTS, ...(parsed?.forecast ?? {}) },
    cashflow: { ...DEFAULT_CASHFLOW, ...cashflowRest },
    pricing,
    forecastOverrides: { ...DEFAULT_FORECAST_OVERRIDES, ...(parsed?.forecastOverrides ?? {}) },
    forecastManuallyEdited: !!parsed?.forecastManuallyEdited,
    planStartDate,
  };
}

interface LoadResult {
  value: Assumptions;
  hadLegacyFundraiseAmount: boolean;
}

function load(): LoadResult {
  if (typeof window === "undefined") return { value: DEFAULT_ASSUMPTIONS, hadLegacyFundraiseAmount: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const legacyPricing = readLegacyPricing();

    if (!raw) {
      const base: Assumptions = {
        ...DEFAULT_ASSUMPTIONS,
        pricing: legacyPricing ?? blankPricingStrategy(),
        forecastOverrides: { ...DEFAULT_FORECAST_OVERRIDES },
      };
      if (legacyPricing) {
        try { localStorage.removeItem(LEGACY_PRICING_STORAGE_KEY); } catch { /* ignore */ }
      }
      return { value: base, hadLegacyFundraiseAmount: false };
    }

    const parsed = JSON.parse(raw);
    const hadLegacyFundraiseAmount =
      parsed?.cashflow && Object.prototype.hasOwnProperty.call(parsed.cashflow, "fundraiseAmount");

    // Clear legacy pricing key if it was folded into the new store via mergeAssumptionsPayload.
    if (!parsed?.pricing && legacyPricing) {
      try { localStorage.removeItem(LEGACY_PRICING_STORAGE_KEY); } catch { /* ignore */ }
    }
    return { value: mergeAssumptionsPayload(parsed, legacyPricing), hadLegacyFundraiseAmount };
  } catch {
    return { value: DEFAULT_ASSUMPTIONS, hadLegacyFundraiseAmount: false };
  }
}

const listeners = new Set<(a: Assumptions) => void>();
const _loaded = load();
let current: Assumptions = _loaded.value;
// One-shot rewrite: if stale localStorage carried cashflow.fundraiseAmount, persist the cleaned shape now.
if (_loaded.hadLegacyFundraiseAmount && typeof window !== "undefined") {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* ignore */ }
}

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

  // User-driven forecast edits — flips the manual-edit flag.
  const setForecast = useCallback((f: ForecastInputs | ((p: ForecastInputs) => ForecastInputs)) => {
    const next = typeof f === "function" ? (f as (p: ForecastInputs) => ForecastInputs)(current.forecast) : f;
    save({ ...current, forecast: next, forecastManuallyEdited: true });
  }, []);
  // Programmatic seeding from pricing — does NOT flip the flag.
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
  const setPricing = useCallback((p: PricingStrategy | ((prev: PricingStrategy) => PricingStrategy)) => {
    const next = typeof p === "function" ? (p as (prev: PricingStrategy) => PricingStrategy)(current.pricing) : p;
    save({ ...current, pricing: next });
  }, []);
  const setForecastOverrides = useCallback((o: ForecastOverrides | ((prev: ForecastOverrides) => ForecastOverrides)) => {
    const next = typeof o === "function" ? (o as (prev: ForecastOverrides) => ForecastOverrides)(current.forecastOverrides) : o;
    save({ ...current, forecastOverrides: next });
  }, []);
  const setPlanStartDate = useCallback((iso: string) => {
    if (!/^\d{4}-\d{2}$/.test(iso)) return;
    save({ ...current, planStartDate: iso });
  }, []);
  const reset = useCallback(() => save(DEFAULT_ASSUMPTIONS), []);

  return {
    assumptions: state,
    setForecast,
    seedForecast,
    clearForecastEditedFlag,
    setCashflow,
    setFundraise,
    setPricing,
    setForecastOverrides,
    setPlanStartDate,
    reset,
  };
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
