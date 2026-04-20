// Multi-round raise planning types & defaults.
// A PlannedRaise is one capital event that lands on a specific month.
// AutoPlanConfig drives the automatic raise planner used by simulateCashflow.

export interface PlannedRaise {
  id: string;
  month: number;
  amount: number;
  dilutionPct: number;
  label: string;
  source: "current" | "manual" | "auto";
}

export interface AutoPlanConfig {
  enabled: boolean;
  triggerMonthsOfRunway: number;
  fundMonthsForward: number;
  dilutionPerRound: number;
  maxRounds: number;
}

export const DEFAULT_AUTO_PLAN: AutoPlanConfig = {
  enabled: true,
  triggerMonthsOfRunway: 6,
  fundMonthsForward: 18,
  dilutionPerRound: 20,
  maxRounds: 5,
};

// Tiny stable-ish id generator. Avoids pulling in a uuid dep.
export function newRaiseId(): string {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Compound multiplicative dilution.
// Two 20% rounds → founders own 0.8 × 0.8 = 64%, dilution = 36% (NOT 40%).
export function cumulativeDilution(rounds: { dilutionPct: number }[]): {
  founderOwnership: number; // 0–1
  cumulativeDilutionPct: number; // 0–100
} {
  let founderOwnership = 1;
  for (const r of rounds) {
    const d = Math.max(0, Math.min(100, r.dilutionPct)) / 100;
    founderOwnership *= 1 - d;
  }
  return {
    founderOwnership,
    cumulativeDilutionPct: (1 - founderOwnership) * 100,
  };
}
