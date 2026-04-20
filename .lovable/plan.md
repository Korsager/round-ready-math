

## Goal
Add a **Plan Narrative** synthesis to both PDF and PPTX exports that walks the full chain — pricing → ARPU → MRR growth → burn coverage → raise size → IRR — and explicitly cross-checks each link against the next. Today each section reads as an island; the reader has to do the math themselves to spot inconsistencies.

## Approach
One new pure module — `src/lib/planNarrative.ts` — computes the 5 link-level checks from existing inputs (`assumptions` + `PlanSummary` + `pricing`). PDF and PPTX each render it once: PDF as a new page after the Plan summary, PPTX as a new slide after the Plan summary slide. No new state, no new inputs, no math changes downstream.

## The five chain links

Each link is one sentence stating the connection plus a one-line check (✓ aligned / ⚠ gap / ✗ break). Computed from existing fields only.

1. **Pricing → ARPU**  
   Blended ARPU = Σ(tier.monthlyPriceNum × tier.targetMix%) across pricing tiers.  
   Check: do priced tiers exist? If not → ⚠ "Forecast runs without a pricing anchor."

2. **ARPU → MRR growth**  
   Implied customer base today = `forecast.startingMRR / blendedARPU`.  
   New customers/mo to hit `forecast.monthlyNewBookings` = `monthlyNewBookings / blendedARPU`.  
   Check: if blendedARPU > 0 and the resulting count is < 1 customer/mo → ⚠ "New bookings imply <1 customer/mo at your blended price." If > 100/mo with a small starting base → ⚠ "Sales velocity step-change required."

3. **MRR growth → burn coverage**  
   At ending MRR × grossMargin%, monthly gross profit = `endingMRR * grossMargin/100`.  
   Burn at exit horizon = `cfBase.months[last].opex` (or last month's opex from the simulation).  
   Check: gross profit ≥ burn → ✓ "Self-funding by mo N." Else gap = `burn - gross profit`, "Still burning $X/mo at horizon."

4. **Burn coverage → raise size**  
   Months of runway bought = `summary.monthsRunwayAfterRaise`.  
   Check vs. typical 18–24 mo bridge: `<12` → ✗ "Raise covers only N months — under the 18-mo bridge most investors expect." `12–17` → ⚠ "Tight bridge." `≥18` → ✓ "Comfortable bridge."

5. **Raise size → IRR**  
   Already in summary: `impliedIrr` vs `targetIrr`.  
   Check: align/gap sentence reusing existing verdict copy.

Each link returns `{ title, sentence, status: "ok" | "warn" | "fail", detail?: string }`.

## Changes

### 1. New `src/lib/planNarrative.ts`
- `computePlanNarrative(a: Assumptions, summary: PlanSummary): { links: NarrativeLink[]; openingSentence: string; closingSentence: string }`.
- `openingSentence`: "Here's how your plan chains together — each step's output is the next step's input."
- `closingSentence`: synthesis — counts how many links are ✓/⚠/✗ and names the weakest link.
- Pure function, no React. Helpers `blendedARPU(pricing)`, `lastMonthOpex(cfBase)` co-located.

### 2. `src/lib/exportPdf.ts`
- After the existing **Plan summary** section, add `title("How the plan connects")`.
- Render `openingSentence` as a paragraph.
- For each link: subhead with `[1/5] Pricing → ARPU` + status glyph (✓/⚠/✗) in a colored box, then sentence as a paragraph, then `detail` muted line if present.
- `closingSentence` as a final italic paragraph.
- Status glyph colors reuse existing verdict palette (green `16,185,129` / amber `217,119,6` / red `220,38,38`).

### 3. `src/lib/exportPptx.ts`
- Add a new slide right after the Plan Summary slide titled **"How it all connects"**.
- Layout: 5 horizontal rows (each row = one link), 13.33" wide. Each row has:
  - Left badge (0.6" circle): step number `1`–`5` in white on status color.
  - Middle (4.5" wide): bold title `Pricing → ARPU`.
  - Right (7" wide): sentence + smaller detail line.
- Bottom strip: `closingSentence` in italic accent color.

### 4. Wiring
- `Export.tsx` already passes `summary` to both exporters — no change needed.
- `exportPdf` / `exportPptx` import `computePlanNarrative` and call it with the existing `summary`.

### 5. Test
- New `src/test/planNarrative.test.ts`:
  - Default assumptions → narrative has 5 links, each with a non-empty sentence and a valid status.
  - Setting `pricing.tiers = []` → link 1 status is `warn`.
  - Setting `forecast.monthlyNewBookings = 0.5` against a $10k blended ARPU → link 2 warns "<1 customer/mo".
  - `monthsRunwayAfterRaise = 6` → link 4 status is `fail`.
  - `monthsRunwayAfterRaise = 24` → link 4 status is `ok`.
  - `closingSentence` mentions the weakest link's title.

## What this does NOT do
- Doesn't change any underlying math — pure read layer over `Assumptions` + `PlanSummary`.
- Doesn't add a new in-app page. Narrative ships with exports only (where the synthesis gap is most visible). Adding it to the on-screen Export step is a one-line follow-up if wanted later.
- Doesn't introduce industry benchmarks beyond the well-known 18-mo bridge norm.

## Files touched
- `src/lib/planNarrative.ts` (new)
- `src/lib/exportPdf.ts` (insert narrative section after Plan summary)
- `src/lib/exportPptx.ts` (insert narrative slide after Plan summary slide)
- `src/test/planNarrative.test.ts` (new)

