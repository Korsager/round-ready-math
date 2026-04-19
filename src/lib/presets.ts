import type { ForecastInputs } from "./forecast";

export interface Preset {
  id: string;
  label: string;
  values: ForecastInputs | null;
}

export const PRESETS: Preset[] = [
  { id: "custom", label: "Custom", values: null },
  { id: "b2b", label: "B2B SaaS (mid-market)", values: { startingMRR: 50000, monthlyNewBookings: 10000, monthlyGrowthRate: 6, annualNRR: 108, hiringLagDays: 75, monthlyGrossChurnRate: 1.0, monthlyDowngradeRate: 0.3, monthlyExpansionRate: 1.5 } },
  { id: "consumer", label: "Consumer SaaS", values: { startingMRR: 20000, monthlyNewBookings: 5000, monthlyGrowthRate: 8, annualNRR: 88, hiringLagDays: 45, monthlyGrossChurnRate: 2.5, monthlyDowngradeRate: 0.5, monthlyExpansionRate: 1.0 } },
  { id: "marketplace", label: "Marketplace", values: { startingMRR: 30000, monthlyNewBookings: 8000, monthlyGrowthRate: 7, annualNRR: 95, hiringLagDays: 60, monthlyGrossChurnRate: 1.8, monthlyDowngradeRate: 0.4, monthlyExpansionRate: 1.8 } },
  { id: "ecom", label: "E-commerce / DTC", values: { startingMRR: 25000, monthlyNewBookings: 6000, monthlyGrowthRate: 5, annualNRR: 92, hiringLagDays: 30, monthlyGrossChurnRate: 2.0, monthlyDowngradeRate: 0.5, monthlyExpansionRate: 1.8 } },
  { id: "services", label: "Services / Agency", values: { startingMRR: 40000, monthlyNewBookings: 7000, monthlyGrowthRate: 4, annualNRR: 100, hiringLagDays: 90, monthlyGrossChurnRate: 1.5, monthlyDowngradeRate: 0.4, monthlyExpansionRate: 1.9 } },
];

export const DEFAULT_INPUTS: ForecastInputs = {
  startingMRR: 10000,
  monthlyNewBookings: 2000,
  monthlyGrowthRate: 6,
  annualNRR: 100,
  hiringLagDays: 75,
  monthlyGrossChurnRate: 1.5,
  monthlyDowngradeRate: 0.4,
  monthlyExpansionRate: 1.9,
};
