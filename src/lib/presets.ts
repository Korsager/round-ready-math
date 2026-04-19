import type { ForecastInputs } from "./forecast";

export interface Preset {
  id: string;
  label: string;
  inputs?: ForecastInputs;
}

export const PRESETS: Preset[] = [
  { id: "b2b", label: "B2B SaaS (mid-market)", inputs: { startingMRR: 50000, monthlyNewBookings: 10000, monthlyGrowthRate: 6, annualNRR: 108, hiringLagDays: 75 } },
  { id: "consumer", label: "Consumer SaaS", inputs: { startingMRR: 20000, monthlyNewBookings: 5000, monthlyGrowthRate: 8, annualNRR: 88, hiringLagDays: 45 } },
  { id: "marketplace", label: "Marketplace", inputs: { startingMRR: 30000, monthlyNewBookings: 8000, monthlyGrowthRate: 7, annualNRR: 95, hiringLagDays: 60 } },
  { id: "ecom", label: "E-commerce / DTC", inputs: { startingMRR: 25000, monthlyNewBookings: 6000, monthlyGrowthRate: 5, annualNRR: 92, hiringLagDays: 30 } },
  { id: "services", label: "Services / Agency", inputs: { startingMRR: 40000, monthlyNewBookings: 7000, monthlyGrowthRate: 4, annualNRR: 100, hiringLagDays: 90 } },
  { id: "custom", label: "Custom" },
];
