
## Plan: Add an Assumptions page

A new `/assumptions` page that surfaces every assumption used across Fundraise Math, Forecast, and Cashflow in one read-only-ish overview, grouped by category, with click-to-edit values and a single "Reset all" action.

### Problem
Assumptions are currently scattered across 3 pages. Founders can't see the full picture of what they're modeling in one place, and there's no shared source of truth — each page holds its own state.

### Approach

**1. Shared assumptions store (`src/lib/assumptions.ts` — new)**
- Define `Assumptions` type combining: fundraise inputs, forecast inputs (`ForecastInputs`), and cashflow inputs (`CashflowInputs` minus the revenue overlap).
- Persist to `localStorage` under `founders-toolkit-assumptions-v1`.
- Export `useAssumptions()` hook (lightweight — `useState` + `useEffect` sync, no context needed for v1).
- Export `DEFAULT_ASSUMPTIONS` reusing existing defaults from `presets.ts` and cashflow defaults.

**2. New page (`src/pages/Assumptions.tsx`)**
Layout (mobile-first, same NavBar, max-width 1100px):

```text
[NavBar]
─────────────────────────────────
Assumptions
Every number powering your model, in one place.
[Reset all] [Copy as JSON]
─────────────────────────────────
[Preset dropdown — applies to revenue block]
─────────────────────────────────
Section: Fundraise
  Raise amount        $2,000,000     [edit]
  Pre-money           $8,000,000     [edit]
  Dilution            20%            (derived)
  Target IRR          25%            [edit]
  ...
─────────────────────────────────
Section: Revenue (36-mo forecast)
  Starting MRR        $10,000        [edit]
  Monthly bookings    $2,000         [edit]
  Growth rate         6%             [edit]
  Gross churn         1.5%           [edit]
  Downgrades          0.4%           [edit]
  Expansion           1.9%           [edit]
  Hiring ramp         75 days        [edit]
  Derived NRR         100%           (computed chip)
─────────────────────────────────
Section: Cashflow
  Starting cash       $1,500,000     [edit]
  Months to raise     6              [edit]
  Starting OpEx       $180,000       [edit]
  OpEx growth         4%/mo          [edit]
  Gross margin        75%            [edit]
─────────────────────────────────
```

Each row: label, current value (click-to-edit inline input matching the existing pattern from `mem://ui/input-behavior` — accepts shorthands like `2M`, `5x`, `20%`), small description on hover.

**3. Wire existing pages to read from the store (light touch)**
- `Forecast.tsx` and `Cashflow.tsx` initialize their state from `useAssumptions()` instead of hard-coded defaults.
- When the user moves a slider on Forecast/Cashflow, it writes back to the store.
- Reset button on Assumptions page restores defaults everywhere.
- (Fundraise/Index page sync is out of scope for v1 — it has its own complex state; we'll mirror just the values it already uses.)

**4. Nav (`src/components/NavBar.tsx`)**
Add "Assumptions" link between "Fundraise" and "Forecast".

### Files
**New:** `src/lib/assumptions.ts`, `src/pages/Assumptions.tsx`, `src/components/assumptions/AssumptionRow.tsx` (reusable click-to-edit row)
**Edited:** `src/App.tsx` (route), `src/components/NavBar.tsx` (link), `src/pages/Forecast.tsx` + `src/pages/Cashflow.tsx` (read/write store)

### Out of scope
- No backend persistence (localStorage only)
- No multi-scenario saving (already covered by existing scenario management on Index)
- No deep sync with Index page state (v1 mirrors values, doesn't drive them)
