
## Plan: Add a Cashflow & Runway page

A new `/cashflow` page that ties together the fundraise (Index) and revenue forecast (Forecast) inputs into a 36-month cash model showing exactly when the company runs out of money.

### Inputs (one control panel)

**Cash position**
- Starting cash (default $1.5M)
- Fundraise amount (pre-filled from Fundraise Math defaults: $2M)
- Months until raise closes (0 = already in bank, default 6)

**Revenue (reuses forecast engine)**
- Starting MRR, monthly new bookings, growth rate, churn/downgrade/expansion rates, hiring ramp
- Pulled from the same `ForecastInputs` defaults; user can pick a preset or tweak

**Costs**
- Starting monthly burn / OpEx (default $180K)
- Headcount cost growth %/month (default 4%)
- Gross margin % (default 75%) — applied to revenue to get contribution

### Math

For each month t = 0..36:
- `revenue_t` = MRR from forecast simulation
- `gross_profit_t` = revenue_t × gross margin
- `opex_t` = startingBurn × (1 + opexGrowth)^t
- `net_burn_t` = opex_t − gross_profit_t  (positive = burning, negative = profitable)
- `cash_t` = cash_{t-1} − net_burn_t  (+ fundraise injected at month = monthsUntilRaise)
- Runway = first month where cash_t ≤ 0 (or "36+ months" if never)

### Page layout

```text
[NavBar]
─────────────────────────────────
Cashflow & Runway
Will you make it to the next round?
─────────────────────────────────
[Sticky control panel: 8 sliders + preset dropdown]
─────────────────────────────────
[3 big stat cards]
  Runway (months) | Cash at month 36 | Default-alive month
  color: green / amber / red based on runway vs 18mo target
─────────────────────────────────
[Verdict banner]
  ✅ "You reach default-alive in month 22 — fundable"
  ⚠️ "You run out in month 14 — raise sooner or cut burn"
  🔴 "Out of cash before raise closes"
─────────────────────────────────
[Cashflow chart — Recharts ComposedChart]
  - Area: cash balance (blue, with red fill below 0)
  - Bars: monthly net burn (red) / net profit (green)
  - Line: revenue (gray)
  - Vertical marker line at fundraise month
  - Horizontal zero line
─────────────────────────────────
[Monthly table — collapsible]
  Month | Revenue | Gross profit | OpEx | Net burn | Cash balance
  Row turns red when cash < 0
─────────────────────────────────
[Insights box]
  - "Burn multiple: 1.8x (healthy <2x)"
  - "Months of runway after raise: 22"
  - "Break-even month: 28 (or 'Not within 36 months')"
─────────────────────────────────
[Export PNG button]
```

### Files

**New:**
- `src/lib/cashflow.ts` — types (`CashflowInputs`, `MonthlyCash`), `simulateCashflow()`, `findRunwayMonth()`, `computeBurnMultiple()`. Reuses `simulate()` from `src/lib/forecast.ts` for revenue.
- `src/components/cashflow/CashflowControls.tsx` — sliders + preset dropdown
- `src/components/cashflow/CashflowChart.tsx` — Recharts ComposedChart with cash area + burn bars
- `src/components/cashflow/RunwayCards.tsx` — 3 stat cards + verdict banner
- `src/components/cashflow/CashflowTable.tsx` — collapsible monthly breakdown
- `src/pages/Cashflow.tsx` — page composition

**Edited:**
- `src/App.tsx` — register `/cashflow` route
- `src/components/NavBar.tsx` — add "Cashflow & runway" link

### Out of scope
- No backend, no save/load (state is in-memory like Forecast page)
- No multi-scenario (bull/base/bear) — single deterministic model. Stress test can be added later.
- No PDF export — just PNG via html-to-image (already in deps)
