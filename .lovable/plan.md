

## Goal
Connect the pricing model to the cost model so gross margin reflects what the founder actually designed, instead of being a free-floating number they type into Cashflow.

## Approach
Add per-tier gross margin to the pricing strategy, derive a blended gross margin (weighted by each tier's revenue contribution), and auto-feed it into the Cashflow gross margin field — with the same lock/unlock pattern already used for Starting MRR and Monthly New Bookings on the Revenue page.

This keeps the existing manual override path for founders who want a single number, but makes the default a number that's consistent with the pricing they just designed.

## Changes

### 1. `src/lib/pricingStrategy.ts`
- Add `grossMarginPct: number` to `PricingTier` (per-tier margin estimate, 0–100)
- Default the three seeded tiers to sensible starting points: Starter 80, Pro 78, Enterprise 70 (rationale: lower-touch self-serve = higher margin; enterprise carries more support/CS load)
- Update `mergePricingStrategy` and `mergeTier` to coerce/default the new field
- Add `blendedGrossMargin(pricing: PricingStrategy): number` — revenue-weighted average:
  - weight per tier = `monthlyPriceNum × targetMix`
  - returns `Σ(margin_i × weight_i) / Σ(weight_i)`, or 0 if no priced tiers
- Add `derivedGrossMargin(pricing): number` as the public helper Cashflow consumes (mirrors `derivedStartingMRR` naming)

### 2. `src/lib/assumptions.ts`
- Add `grossMarginLocked: boolean` to `ForecastOverrides` (default `false`), so the lock state lives alongside the existing two locks
- No new slice — `cashflow.grossMargin` stays where it is; the override flag just controls whether it's auto-derived

### 3. `src/pages/course/Pricing.tsx`
- In the per-tier editor, add a "Gross margin %" field next to the price/mix inputs
- Show a small derived line under the tier list: "Blended gross margin: X% — flows into Cashflow unless overridden"

### 4. `src/pages/course/Cashflow.tsx`
- The detailed-model Inputs sidebar already renders Gross margin via `AssumptionRow`. Wrap it with the same `LockToggle` pattern used on Revenue:
  - When unlocked (default): value = `derivedGrossMargin(pricing)`, edits flip lock on
  - When locked: value = `cashflow.grossMargin`, click unlock → reset to derived
- Add a one-line caption when unlocked: "Auto-derived from pricing tiers"

### 5. `src/lib/planSummary.ts`
- No formula changes — `simulateCashflow` already consumes `cashflow.grossMargin`. The summary picks up the new value for free.

### 6. Tests / sanity
- Existing `src/test/example.test.ts` style: add a small unit test for `blendedGrossMargin` covering: no priced tiers → 0, single tier → that tier's margin, mixed tiers → correct revenue-weighted result.

## What this does NOT do
- Does not vary gross margin month-over-month (e.g. as enterprise mix grows). That's a worthwhile next step but adds a second axis of complexity; this plan keeps a single blended number so the existing `simulateCashflow` math is untouched.
- Does not model COGS line items (hosting, payment fees, support). The per-tier margin % is the founder's estimate — the point is to make it pricing-aware, not to build a full COGS model.

## Files touched
- `src/lib/pricingStrategy.ts` (extend type + helpers)
- `src/lib/assumptions.ts` (add lock flag)
- `src/pages/course/Pricing.tsx` (per-tier margin input + blended readout)
- `src/pages/course/Cashflow.tsx` (LockToggle on gross margin row)
- `src/test/` (new unit test for blended margin)

