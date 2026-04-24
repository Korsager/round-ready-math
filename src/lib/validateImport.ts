// Pure validator for imported plan JSON. Catches structural problems and
// inconsistent values BEFORE they reach mergeAssumptionsPayload, and returns
// a "repaired" payload with auto-fixes applied (clamps, stripped legacy fields).

import { currentMonthISO } from "./dateAnchor";

export type Severity = "error" | "warning";

export interface Issue {
  severity: Severity;
  field: string;
  message: string;
}

export interface ValidationResult {
  errors: Issue[];
  warnings: Issue[];
  repaired: unknown;
}

const KNOWN_TOP_LEVEL = new Set([
  "fundraise",
  "forecast",
  "cashflow",
  "pricing",
  "forecastOverrides",
  "fundraiseOverrides",
  "forecastManuallyEdited",
  "planStartDate",
]);

function isPlainObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function validateImport(parsed: unknown): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  if (!isPlainObject(parsed)) {
    errors.push({
      severity: "error",
      field: "(root)",
      message: "Plan file must be a JSON object at the top level.",
    });
    return { errors, warnings, repaired: parsed };
  }

  // Deep-ish clone so repairs don't mutate caller's object.
  const repaired: Record<string, any> = JSON.parse(JSON.stringify(parsed));

  // Unknown top-level keys → warning, leave in place (mergeAssumptionsPayload ignores them).
  for (const key of Object.keys(repaired)) {
    if (!KNOWN_TOP_LEVEL.has(key)) {
      warnings.push({
        severity: "warning",
        field: key,
        message: `Unknown field '${key}' will be ignored.`,
      });
    }
  }

  // Slice shape checks.
  for (const slice of ["fundraise", "forecast", "cashflow", "pricing", "forecastOverrides"] as const) {
    if (slice in repaired && !isPlainObject(repaired[slice])) {
      errors.push({
        severity: "error",
        field: slice,
        message: `'${slice}' must be an object.`,
      });
    }
  }
  if (errors.length) return { errors, warnings, repaired };

  // --- Fundraise ---
  if (isPlainObject(repaired.fundraise)) {
    const f = repaired.fundraise;
    if (typeof f.dilutionPct === "number" && (f.dilutionPct <= 0 || f.dilutionPct > 100)) {
      const fixed = clamp(f.dilutionPct, 1, 100);
      warnings.push({
        severity: "warning",
        field: "fundraise.dilutionPct",
        message: `Dilution % was ${f.dilutionPct}, outside (0, 100]. Clamped to ${fixed}.`,
      });
      f.dilutionPct = fixed;
    }
    for (const key of ["targetIrr", "targetMoic", "yearsToExit", "revenueMultiple", "raise"] as const) {
      if (typeof f[key] === "number" && f[key] < 0) {
        warnings.push({
          severity: "warning",
          field: `fundraise.${key}`,
          message: `'${key}' was negative (${f[key]}). Clamped to 0.`,
        });
        f[key] = 0;
      }
    }
  }

  // --- Cashflow ---
  if (isPlainObject(repaired.cashflow)) {
    const c = repaired.cashflow;

    // Cross-slice: legacy fundraiseAmount.
    if ("fundraiseAmount" in c) {
      const raise = isPlainObject(repaired.fundraise) ? repaired.fundraise.raise : undefined;
      if (typeof raise === "number" && c.fundraiseAmount !== raise) {
        warnings.push({
          severity: "warning",
          field: "cashflow.fundraiseAmount",
          message: `Legacy 'cashflow.fundraiseAmount' (${c.fundraiseAmount}) differs from 'fundraise.raise' (${raise}). The legacy field will be discarded.`,
        });
      } else {
        warnings.push({
          severity: "warning",
          field: "cashflow.fundraiseAmount",
          message: `Legacy 'cashflow.fundraiseAmount' field will be discarded.`,
        });
      }
      delete c.fundraiseAmount;
    }

    for (const key of ["startingCash", "startingBurn"] as const) {
      if (typeof c[key] === "number" && c[key] < 0) {
        warnings.push({
          severity: "warning",
          field: `cashflow.${key}`,
          message: `'${key}' was negative (${c[key]}). Clamped to 0.`,
        });
        c[key] = 0;
      }
    }
    if (typeof c.grossMargin === "number" && (c.grossMargin < 0 || c.grossMargin > 100)) {
      const fixed = clamp(c.grossMargin, 0, 100);
      warnings.push({
        severity: "warning",
        field: "cashflow.grossMargin",
        message: `Gross margin was ${c.grossMargin}%, outside [0, 100]. Clamped to ${fixed}%.`,
      });
      c.grossMargin = fixed;
    }
    if (typeof c.monthsUntilRaise === "number" && (c.monthsUntilRaise < 0 || c.monthsUntilRaise > 60)) {
      const fixed = clamp(c.monthsUntilRaise, 0, 60);
      warnings.push({
        severity: "warning",
        field: "cashflow.monthsUntilRaise",
        message: `Months until raise was ${c.monthsUntilRaise}, outside [0, 60]. Clamped to ${fixed}.`,
      });
      c.monthsUntilRaise = fixed;
    }
  }

  // --- Plan start date ---
  if ("planStartDate" in repaired && repaired.planStartDate !== undefined) {
    if (typeof repaired.planStartDate !== "string" || !/^\d{4}-\d{2}$/.test(repaired.planStartDate)) {
      const fallback = currentMonthISO();
      warnings.push({
        severity: "warning",
        field: "planStartDate",
        message: `'planStartDate' must be 'YYYY-MM' (got '${repaired.planStartDate}'). Replaced with current month '${fallback}'.`,
      });
      repaired.planStartDate = fallback;
    }
  }

  // --- Pricing tiers: clamp targetMix ---
  if (isPlainObject(repaired.pricing) && Array.isArray(repaired.pricing.tiers)) {
    repaired.pricing.tiers.forEach((tier: any, i: number) => {
      if (!isPlainObject(tier)) return;
      if (typeof tier.targetMix === "number" && (tier.targetMix < 0 || tier.targetMix > 100)) {
        const fixed = clamp(tier.targetMix, 0, 100);
        warnings.push({
          severity: "warning",
          field: `pricing.tiers[${i}].targetMix`,
          message: `Tier '${tier.name || i}' targetMix was ${tier.targetMix}, outside [0, 100]. Clamped to ${fixed}.`,
        });
        tier.targetMix = fixed;
      }
      if (typeof tier.grossMarginPct === "number" && (tier.grossMarginPct < 0 || tier.grossMarginPct > 100)) {
        const fixed = clamp(tier.grossMarginPct, 0, 100);
        warnings.push({
          severity: "warning",
          field: `pricing.tiers[${i}].grossMarginPct`,
          message: `Tier '${tier.name || i}' grossMarginPct was ${tier.grossMarginPct}, outside [0, 100]. Clamped to ${fixed}.`,
        });
        tier.grossMarginPct = fixed;
      }
    });

    // Pricing ↔ forecast coherence.
    const anyPricedTier = repaired.pricing.tiers.some(
      (t: any) => isPlainObject(t) && typeof t.monthlyPriceNum === "number" && t.monthlyPriceNum > 0,
    );
    const f = isPlainObject(repaired.forecast) ? repaired.forecast : {};
    const startingMRR = typeof f.startingMRR === "number" ? f.startingMRR : 0;
    const newBookings = typeof f.monthlyNewBookings === "number" ? f.monthlyNewBookings : 0;
    if (anyPricedTier && startingMRR === 0 && newBookings === 0) {
      warnings.push({
        severity: "warning",
        field: "pricing/forecast",
        message:
          "Pricing tiers are defined but the forecast shows zero starting MRR and zero new bookings. Re-seed the forecast from pricing on the Pricing step.",
      });
    }
  }

  return { errors, warnings, repaired };
}
