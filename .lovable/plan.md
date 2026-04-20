

## Goal
Surface a "valuation efficiency" stat on the Cashflow step so founders can see what each month of runway costs in dilution terms — connecting the Fundraising round (post-money, ownership sold) to the Cashflow plan (months of runway bought).

## Approach
All inputs already exist:
- `assumptions.fundraise.raise`, `dilutionPct` → post-money = raise / (dilutionPct/100)
- `summary.cfBase.monthsRunwayAfterRaise` → months bought by the round

Add a single derived metric **"Valuation per month of runway"** = `postMoney / monthsRunwayAfterRaise`, plus the dilution-cost framing **"Dilution per month"** = `dilutionPct / monthsRunwayAfterRaise`. Render as a new card in the existing `PlanSummary` strip (and as a small line in `RunwayCards`) so it's visible the moment the user lands on Cashflow.

## Changes

### 1. `src/lib/planSummary.ts`
Extend the returned summary with three derived fields (read-only, computed from existing inputs — no new state):
- `postMoney: number` — `raise / (dilutionPct/100)`, or 0 if dilutionPct is 0
- `valuationPerRunwayMonth: number | null` — `postMoney / monthsRunwayAfterRaise`, null if runway is null/0
- `dilutionPerRunwayMonth: number | null` — `dilutionPct / monthsRunwayAfterRaise`, null if runway is null/0

### 2. `src/components/cashflow/PlanSummary.tsx`
Add one stat card to the existing summary strip:
- **Label**: "Cost of runway"
- **Primary value**: `$X.XM per month` (post-money ÷ months bought)
- **Secondary line**: `{dilutionPerMonth.toFixed(2)}% dilution / mo`
- Tooltip: "How much company value (and ownership) each additional month of runway costs at this round's terms."
- Hidden gracefully when `monthsRunwayAfterRaise` is null (pre-raise runway already gone).

### 3. `src/pages/course/Fundraising.tsx`
Mirror the same line under the existing post-money display in the results dashboard so the connection is visible from both ends:
- One small caption: "Buys {monthsRunwayAfterRaise} months → ${valuationPerMonth}M / mo of runway"

No changes to inputs, no new fields in `assumptions.ts`, no schema changes.

## What this does NOT do
- Doesn't judge whether the cost-per-month is "good" or "bad" — that's market-dependent. Just exposes the number.
- Doesn't change `simulateCashflow` or any forecast math.
- Doesn't introduce a new chart — single derived stat in two existing surfaces.

## Files touched
- `src/lib/planSummary.ts` (add 3 derived fields)
- `src/components/cashflow/PlanSummary.tsx` (new "Cost of runway" card)
- `src/pages/course/Fundraising.tsx` (caption under post-money result)

