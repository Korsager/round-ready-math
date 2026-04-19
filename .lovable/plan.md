
## Plan: Add explicit churn, downgrade, and expansion inputs to the forecast

Currently the waterfall splits a single NRR-derived churn figure into hardcoded buckets (70% gross churn, 30% downgrades) and computes expansion as a residual. The user wants these as real, controllable inputs.

### Changes

**1. `src/lib/forecast.ts` — extend the math engine**
- Add 3 new fields to `ForecastInputs`:
  - `monthlyGrossChurnRate` (% of MRR lost to cancellations, e.g. 1.5)
  - `monthlyDowngradeRate` (% of MRR lost to plan downgrades, e.g. 0.5)
  - `monthlyExpansionRate` (% of MRR gained from upgrades/seat expansion, e.g. 1.5)
- Replace the NRR-derived `monthlyNrrFactor` in `simulate()` with explicit per-month components:
  - `grossChurnLoss = prev * grossChurnRate`
  - `downgradeLoss = prev * downgradeRate`
  - `expansionGain = prev * expansionRate`
  - `retainedMRR = prev - grossChurnLoss - downgradeLoss + expansionGain`
- Extend `MonthlyData` with `downgradeLoss` and split `churnLoss` into `grossChurnLoss`.
- Keep `annualNRR` as a **derived display value** (computed from the 3 rates) instead of an input — shown read-only so users still see the familiar metric.
- Rewrite `buildWaterfall()` to sum the real monthly values (no more 70/30 hardcode, no residual expansion).
- Update scenario adjustments: bull/bear modify the 3 new rates instead of `nrrAdd`.

**2. `src/lib/presets.ts`**
- Add the 3 new rate fields to every preset and `DEFAULT_INPUTS` with sensible per-segment defaults (e.g. B2B SaaS: 1.0 / 0.3 / 1.5).

**3. `src/components/forecast/ControlPanel.tsx`**
- Remove the `annualNRR` slider.
- Add 3 new sliders: Gross churn rate (0–10%, step 0.1), Downgrade rate (0–5%, step 0.1), Expansion rate (0–10%, step 0.1).
- Show derived annual NRR as a small read-only chip above the sliders so users keep the mental model.
- Layout: switch grid to `md:grid-cols-4` × 2 rows (7 sliders total) to stay readable.

**4. `src/components/forecast/MatrixChart.tsx`**
- Matrix currently varies NRR vs growth. Keep the same axes by mapping the NRR row value back into the 3 component rates proportionally (preserve current gross/downgrade/expansion ratios, scale to hit target NRR). This keeps the chart meaningful without adding a 3rd dimension.

**5. `src/components/forecast/WaterfallChart.tsx`**
- No structural change — it already renders the 6 bars. It will now reflect real input-driven values instead of the 70/30 split.

**6. `src/pages/Forecast.tsx`**
- No changes needed beyond passing the new inputs through (already generic).

### Out of scope
- No changes to scenario multiplier philosophy beyond rewiring (`nrrAdd` → `churnRateMult` etc.).
- No new files. No backend.
