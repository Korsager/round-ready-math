import { useState, useCallback } from "react";

export interface CalcInputs {
  raise: number;
  dilutionPct: number;
  shares: number;
  targetIrr: number;
  yearsToExit: number;
  targetMoic: number;
}

export const DEFAULTS: CalcInputs = {
  raise: 2_000_000,
  dilutionPct: 20,
  shares: 10_000_000,
  targetIrr: 30,
  yearsToExit: 5,
  targetMoic: 4,
};

export interface CalcResults {
  postMoney: number;
  pricePerShare: number;
  investorOwnership: number;
  dilution: number;
  requiredExitValue: number;
  requiredMoic: number;
  calculatedIrr: number;
  moicNeededForTargetIrr: number;
  yearsNeededAtMoic: number;
  maxHoldYears: number;
}

export function compute(inputs: CalcInputs): CalcResults {
  const { raise, dilutionPct, shares, targetIrr, yearsToExit, targetMoic } = inputs;
  const irrDecimal = targetIrr / 100;
  const investorOwnership = dilutionPct / 100;

  const postMoney = investorOwnership > 0 ? raise / investorOwnership : 0;
  const preMoney = postMoney - raise;
  const pricePerShare = shares > 0 ? preMoney / shares : 0;
  const dilution = investorOwnership;

  // Required exit for investors to hit target IRR
  const requiredReturnForInvestors = raise * Math.pow(1 + irrDecimal, yearsToExit);
  const requiredExitValue = investorOwnership > 0 ? requiredReturnForInvestors / investorOwnership : 0;
  const requiredMoic = raise > 0 ? requiredReturnForInvestors / raise : 0;

  // Calculated IRR at user's MOIC & years
  const calculatedIrr = yearsToExit > 0 && targetMoic > 0
    ? (Math.pow(targetMoic, 1 / yearsToExit) - 1) * 100
    : 0;

  // MOIC needed to hit target IRR in given years
  const moicNeededForTargetIrr = Math.pow(1 + irrDecimal, yearsToExit);

  // Years needed at given MOIC to hit target IRR
  const yearsNeededAtMoic = targetMoic > 1 && irrDecimal > 0
    ? Math.log(targetMoic) / Math.log(1 + irrDecimal)
    : Infinity;

  // Max hold years before IRR falls below target (at given MOIC)
  const maxHoldYears = targetMoic > 1 && irrDecimal > 0
    ? Math.log(targetMoic) / Math.log(1 + irrDecimal)
    : 0;

  return {
    postMoney,
    pricePerShare,
    investorOwnership,
    dilution,
    requiredExitValue,
    requiredMoic,
    calculatedIrr,
    moicNeededForTargetIrr,
    yearsNeededAtMoic,
    maxHoldYears,
  };
}

export function computeIrr(moic: number, years: number): number {
  if (years <= 0 || moic <= 0) return 0;
  return (Math.pow(moic, 1 / years) - 1) * 100;
}

export function useCalc() {
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULTS);

  const update = useCallback((field: keyof CalcInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => setInputs(DEFAULTS), []);

  const results = compute(inputs);

  return { inputs, update, reset, results };
}
