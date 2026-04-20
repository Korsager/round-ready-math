

## Goal
Make "month 0" explicit. Today, `startingMRR`, `startingCash`, and all `month N` references float without an anchor date — fine while modelling, misleading once the PDF or PPTX leaves the app. Add a single shared **plan start date** (defaults to today, editable, persisted) and surface it everywhere month 0 is implied.

## Approach
One new field on the assumptions store: `planStartDate: string` (ISO `YYYY-MM`). It's the only new state. Every "Month N" label in the app and exports gets a derived calendar date alongside it via a small helper.

## Changes

### 1. `src/lib/assumptions.ts`
- Add `planStartDate: string` at the top level of `Assumptions` (sibling to `forecast`, `cashflow`, etc.). Default: current month as `YYYY-MM`.
- Extend `mergeAssumptionsPayload` to accept legacy payloads without the field — fallback to current month.
- Bump nothing else; the existing localStorage migration already round-trips unknown shapes.

### 2. `src/lib/format.ts` (or new `src/lib/dateAnchor.ts`)
Add two pure helpers:
- `monthLabel(startISO: string, monthIndex: number): string` → `"Month 6 (Oct 2026)"`
- `monthShort(startISO: string, monthIndex: number): string` → `"Oct '26"` for chart axes

### 3. `src/pages/course/Cashflow.tsx`
- Add an `AssumptionRow` for **"Plan start month"** at the top of the inputs sidebar, above `startingCash`. Month picker (native `<input type="month">` is fine, matches the existing inline-edit pattern).
- Caption under the input: "Anchors month 0 for runway, raise timing, and exports."

### 4. Chart axis labels
- `src/components/cashflow/CashflowChart.tsx` and `src/components/forecast/ForecastChart.tsx`: when the user hovers a point, the tooltip shows `Month N (Mon 'YY)` instead of just `Month N`. X-axis ticks stay numeric to keep the charts compact.

### 5. `src/components/cashflow/PlanSummary.tsx` and `RunwayCards.tsx`
- "Raise lands: month 6" → "Raise lands: month 6 (Oct 2026)".
- "Cash zero: month 14" → "Cash zero: month 14 (Jun 2027)".

### 6. `src/pages/course/Fundraising.tsx` — RunwayCheck panel
- Same treatment: red banner "You run out of cash in month 3 (Jul 2026) but the raise isn't planned until month 6 (Oct 2026)".

### 7. Exports
- **`src/lib/exportPdf.ts`**: 
  - On the cover page, replace `Generated {date}` with two lines: `Plan start: {Mon YYYY}` and `Generated {date}`.
  - In the "Cashflow & runway" section, every `Month N` row gets the calendar suffix.
  - Add one paragraph under the cover: "All 'month N' references in this report are measured from the plan start month above."
- **`src/lib/exportPptx.ts`**: same treatment on the cover slide and the runway/forecast slides.
- **`src/components/course/UploadJson.tsx`**: no change needed (mergeAssumptionsPayload handles defaults).

### 8. Test
- Extend `src/test/cashflowShape.test.ts` (or new `dateAnchor.test.ts`):
  - `monthLabel("2026-04", 0)` → starts with `"Month 0"` and contains `"Apr 2026"`.
  - `monthLabel("2026-04", 12)` → contains `"Apr 2027"`.
  - Default `planStartDate` is a valid `YYYY-MM` string.

## What this does NOT do
- Doesn't shift any math. Month indices stay integer offsets from plan start; runway, IRR, and forecast logic are untouched.
- Doesn't add a full calendar with day-level precision. Month granularity matches the rest of the model.
- Doesn't auto-advance the start date over time. If the user opens the tool 3 months later, they update the field manually — same way they'd update starting MRR.
- Doesn't introduce timezones. ISO `YYYY-MM` is locale-agnostic; rendering uses `toLocaleString('en-US', { month: 'short', year: 'numeric' })`.

## Files touched
- `src/lib/assumptions.ts` (new field + default + merge fallback)
- `src/lib/format.ts` (or new `src/lib/dateAnchor.ts`) — month label helpers
- `src/pages/course/Cashflow.tsx` (input row)
- `src/pages/course/Fundraising.tsx` (RunwayCheck copy)
- `src/components/cashflow/PlanSummary.tsx`, `RunwayCards.tsx` (label suffixes)
- `src/components/cashflow/CashflowChart.tsx`, `src/components/forecast/ForecastChart.tsx` (tooltip dates)
- `src/lib/exportPdf.ts`, `src/lib/exportPptx.ts` (cover + runway sections)
- `src/test/dateAnchor.test.ts` (new)

