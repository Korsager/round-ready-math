
## Plan: Convert the toolkit into a guided course flow

Transform the app from a free-navigation dashboard into a linear, step-by-step course. Users start by choosing to upload an existing plan or start fresh, then walk through Pricing → Revenue Forecast → Fundraising → Cashflow, and finish at an export step (JSON, PDF, PPTX).

### 1. New onboarding step (`src/pages/Start.tsx`)
- Two big choice cards:
  - **Upload existing plan** — file input accepting `.json`, parsed and validated against `Assumptions` shape, then merged into the store via `useAssumptions`.
  - **Start from scratch** — loads `DEFAULT_ASSUMPTIONS`.
- On either choice → navigate to `/course/pricing`.
- Invalid JSON shows inline error.

### 2. Course shell (`src/components/course/CourseLayout.tsx`)
Wraps each step with:
- Top progress bar (5 steps: Pricing, Revenue, Fundraising, Cashflow, Export) with current step highlighted and completed steps checkmarked.
- Step title + short "what you'll do here" intro paragraph.
- Sticky footer with **Back** and **Next** buttons (Next disabled only on the very last "finish" action).
- Replaces the freeform `NavBar` on course routes (NavBar still exists for `/assumptions` and legacy access via a small "Exit course" link).

### 3. Step pages (reuse existing logic, restructured)
- **`/course/pricing`** — embeds existing `PricingPlaybook` content + the pricing assumption inputs (currently on Assumptions page) inline. Inputs write to the shared store.
- **`/course/revenue`** — embeds the Forecast page outputs + the revenue/forecast inputs inline.
- **`/course/fundraising`** — embeds the Fundraise (Index) dashboard + fundraise inputs inline.
- **`/course/cashflow`** — embeds the Cashflow page + cashflow-specific inputs inline.

Each step shows: intro → inputs (editable inline, same `AssumptionRow` component) → live output/visualization → Back/Next.

### 4. Export step (`/course/export`)
Three download buttons:
- **Download JSON** — serializes current `Assumptions` (already implemented as "Copy JSON" on Assumptions page; just swap to file download).
- **Download PDF report** — multi-page PDF covering all 4 sections with key numbers, charts (rendered to images via `html-to-image`, already in deps), and verdicts. Generated client-side with `jspdf` (needs add).
- **Download Presentation (PPTX)** — investor-style deck with cover, one slide per section (Pricing, Revenue, Fundraising, Cashflow), and a summary slide. Generated client-side with `pptxgenjs` (needs add).

Also shows a "Save & exit to dashboard" link that drops the user on the existing free-navigation Assumptions page.

### 5. Routing changes (`src/App.tsx`)
- `/` → redirect to `/start` (new entry point).
- New routes: `/start`, `/course/pricing`, `/course/revenue`, `/course/fundraising`, `/course/cashflow`, `/course/export`.
- Keep existing routes (`/assumptions`, `/forecast`, `/cashflow`, `/pricing-playbook`, and old fundraise dashboard at `/dashboard`) for power users who exit the course.

### 6. State & persistence
- Continue using `useAssumptions` (localStorage). Already handles cross-step persistence — no changes needed.
- Add a small `courseProgress` field to track furthest step reached (so Next buttons unlock properly on revisit).

### Files

**New:**
- `src/pages/Start.tsx`
- `src/pages/course/Pricing.tsx`, `Revenue.tsx`, `Fundraising.tsx`, `Cashflow.tsx`, `Export.tsx`
- `src/components/course/CourseLayout.tsx`
- `src/components/course/StepProgress.tsx`
- `src/components/course/UploadJson.tsx`
- `src/lib/exportPdf.ts` (jsPDF report builder)
- `src/lib/exportPptx.ts` (pptxgenjs deck builder)

**Edited:**
- `src/App.tsx` — new routes + `/` redirect
- `src/lib/assumptions.ts` — add `courseProgress` field
- `src/components/NavBar.tsx` — add "Exit course" link variant

**Dependencies to add:** `jspdf`, `pptxgenjs`

### Out of scope
- No backend storage of plans (JSON upload/download only).
- No multi-user accounts.
- No editing of generated PDF/PPTX after download.
- Pricing inputs schema: assumes existing pricing fields on `PricingPlaybook` are already captured somewhere editable; if not, we'll add a minimal `PricingAssumptions` block to the store as part of the Pricing step.
