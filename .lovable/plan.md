

## Goal
Make the Fundraising step aware of runway. A user sizing a raise should immediately see whether that raise (a) lands before cash runs out, and (b) buys enough months of runway after it lands.

## Approach
The numbers already exist — `computePlanSummary()` returns `runwayMonth`, `monthsUntilRaise`, `bufferBeforeZero`, and `monthsRunwayAfterRaise` from the cashflow simulation. The Fundraising page just doesn't read them. Add a single "Runway check" panel to the page that consumes the plan summary and reports verdicts in plain language.

## Changes

### 1. `src/pages/course/Fundraising.tsx`
Add a `RunwayCheck` panel rendered between the existing narrative box and the IRR sensitivity heatmap. It calls `computePlanSummary(assumptions)` (already a pure, fast function) and renders three states:

**State A — Raise lands too late (`runwayMonth !== null && runwayMonth <= monthsUntilRaise`)**
Red banner. Copy: "You run out of cash in month {runwayMonth} but the raise isn't planned until month {monthsUntilRaise}. Either raise earlier, cut burn, or extend the bridge." Includes a small "Adjust on Cashflow step →" link.

**State B — Raise lands in time but buys too little runway (`monthsRunwayAfterRaise !== null && monthsRunwayAfterRaise < 12`)**
Amber banner. Copy: "{fmtMoney(raise)} buys {monthsRunwayAfterRaise} months after closing. Most investors expect 18–24 months of post-round runway. Consider raising more or trimming opex." Shows a derived "What 18 months would cost" line: `raise × 18 / monthsRunwayAfterRaise` rounded.

**State C — Healthy (raise lands in time, ≥18 months post-round runway)**
Green check. Copy: "{fmtMoney(raise)} funds {monthsRunwayAfterRaise} months of post-round runway. Cash zero pushed to month {runwayMonth ?? horizon+}."

Below the verdict, always show a compact 3-stat strip:
- Current runway: `{runwayMonth ?? horizonMonths+} mo`
- Raise lands: `month {monthsUntilRaise}`
- Post-round runway: `{monthsRunwayAfterRaise ?? "—"} mo`

### 2. Verdict integration
The page currently has two verdict tones — `verdictTone` (MOIC-implied IRR) and `impliedTone` (forecast-implied IRR). Neither reflects funding adequacy. Add a third consideration: if the runway check is red, prepend a one-liner to the existing `narrative` block: "Funding gap: this raise doesn't cover the runway needed to execute the plan." This keeps the existing IRR narrative intact but flags the inconsistency upfront.

### 3. No state changes
- No new fields in `assumptions.ts`
- No changes to `planSummary.ts` (it already returns everything needed)
- No changes to `cashflow.ts`

The Fundraising page becomes a read-only consumer of plan summary for the runway numbers, same way the Cashflow page already is.

## Files touched
- `src/pages/course/Fundraising.tsx` (add `RunwayCheck` component + import `computePlanSummary`, weave funding-gap line into narrative)

## What this does NOT do
- Doesn't auto-suggest a "right" raise size — just flags the inconsistency. Founders pick the trade-off (raise more vs cut burn vs shorter bridge).
- Doesn't move the `monthsUntilRaise` input onto the Fundraising page. It stays on Cashflow where it belongs; the Fundraising panel includes a link back.
- Doesn't change how IRR/MOIC verdicts are computed. The runway check is an additional, orthogonal signal.

