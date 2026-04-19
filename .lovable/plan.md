
## Plan: Simplify Fundraise Math page & remove duplicate header

### Issues to fix
1. **Duplicate header bars**: `Index.tsx` has both `<NavBar />` (top nav with links) AND a sticky sub-header showing "Fundraise Math" + tagline + Reset button. The user wants only the NavBar.
2. **Information is dense**: Numbers like "Required MOIC", "Required Exit", "IRR", "Investor Own." appear without plain-language meaning. The "At a Glance" panel duplicates info already shown in big cards. The IRR Verdict and Quick Tip partially overlap.

### Changes to `src/pages/Index.tsx`

**1. Remove the duplicate sub-header**
- Delete the entire `<header className="sticky top-14 ...">` block.
- Move the **Reset button** into the greeting row (top-right next to the H1).
- Keep `<NavBar />` as the only top bar.

**2. Add plain-language explanations to each metric**
Every key number gets a short one-line "what this means" caption directly under it (12px muted text), so users don't have to hover for the tooltip:
- **Post-Money card**: add "What your company is worth right after the round closes."
- **Required MOIC**: "How many times investors must multiply their money."
- **Required Exit**: "The sale/IPO price needed to deliver the target return."
- **Your IRR**: "The yearly return rate your MOIC produces."
- **Investor Ownership**: "The slice of the company investors will hold."

**3. Simplify the right column**
- **Remove "At a Glance"** panel entirely — it duplicates the big cards on the left/center.
- Keep **IRR Verdict** but rename to **"Is this a good deal?"** with a clearer ✅/⚠️/🔴 status line and a one-sentence plain-English explanation.
- Keep the **Quick Tip** but rewrite it as a "Plain English Summary" paragraph that ties everything together: *"You're raising X for Y% of your company. To make investors happy, you need to sell for Z in N years."*

**4. Add a small "Glossary" callout** (collapsible, optional) at the bottom of the right column defining the 4 jargon terms once: Pre-Money, Post-Money, MOIC, IRR, Dilution. Each in one line.

**5. Heatmap**: Add a one-line intro above it: *"Each cell shows the IRR if you exit at that MOIC after that many years. Green = beats your target, red = falls short."*

### Files affected
- `src/pages/Index.tsx` (only file edited)

### Out of scope
- No changes to math, NavBar, HeatmapGrid, or Forecast page.
- No new dependencies.

### Visual layout after changes
```text
[NavBar — only top bar]
─────────────────────────────────
Fundraise Math Dashboard 🚀         [Reset]
Adjust your round → see results instantly
─────────────────────────────────
[Inputs]   [Post-Money + pie]      [Is this a good deal?]
[Rocket]   [4 metric cards w/        [Plain-English summary]
            captions under each]     [Glossary (collapsible)]
─────────────────────────────────
[Heatmap with intro line]
```
