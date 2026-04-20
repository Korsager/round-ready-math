

## Goal
Catch inconsistent or malformed JSON imports at the door. Today `UploadJson` accepts any JSON that parses, runs a shallow merge, and silently loads contradictory state. Add a validation pass that surfaces problems to the user with a clear message and a choice: cancel, or load anyway with auto-repairs applied.

## Approach
One new pure module — `src/lib/validateImport.ts` — that takes a parsed payload and returns `{ warnings, errors, repaired }`. `UploadJson` calls it after `JSON.parse` and before applying state. Errors block the import; warnings show in a confirm dialog with "Load anyway" / "Cancel".

This is purely a guardrail layer. No changes to the assumptions store, no changes to the merge semantics in `mergeAssumptionsPayload` (which already handles legacy fields like the stripped `cashflow.fundraiseAmount`).

## Changes

### 1. New `src/lib/validateImport.ts`
Pure function `validateImport(parsed: unknown): ValidationResult` returning:
```ts
type Severity = "error" | "warning";
interface Issue { severity: Severity; field: string; message: string; }
interface ValidationResult {
  errors: Issue[];     // block import
  warnings: Issue[];   // show, allow override
  repaired: unknown;   // payload with auto-fixes applied (e.g. fundraiseAmount stripped, capped values clamped)
}
```

Checks performed (errors unless noted):
- **Shape**: payload is an object, not array/null/primitive. → error
- **Top-level slices**: `fundraise`, `forecast`, `cashflow`, `pricing` are objects when present. Unknown top-level keys → warning, listed.
- **Cross-slice fundraise consistency**: if `cashflow.fundraiseAmount` exists and differs from `fundraise.raise`, → warning ("Legacy field will be discarded; using fundraise.raise = $X"). The repaired payload drops `fundraiseAmount`.
- **Pricing ↔ forecast coherence**: if `pricing.tiers` has any tier with `monthlyPriceNum > 0` but `forecast.startingMRR === 0` and `forecast.monthlyNewBookings === 0`, → warning ("Pricing tiers are defined but forecast shows zero revenue. Re-seed from pricing on the Pricing step.").
- **Numeric ranges**: 
  - `fundraise.dilutionPct` outside (0, 100] → warning, clamped to [1, 100] in repaired.
  - `fundraise.targetIrr`, `fundraise.targetMoic`, `fundraise.yearsToExit`, `fundraise.revenueMultiple` < 0 → warning, clamped to 0.
  - `cashflow.startingCash`, `startingBurn` < 0 → warning, clamped to 0.
  - `cashflow.grossMargin` outside [0, 100] → warning, clamped.
  - `cashflow.monthsUntilRaise` < 0 or > 60 → warning, clamped.
- **Date anchor**: `planStartDate` present but doesn't match `^\d{4}-\d{2}$` → warning, replaced with current month in repaired.
- **Tier mix**: pricing tier `targetMix` outside [0, 100] → warning, clamped.

All checks are best-effort; missing fields are not errors (defaults will fill them in via `mergeAssumptionsPayload`).

### 2. `src/components/course/UploadJson.tsx`
Replace the silent flow with:
1. Parse JSON. If `JSON.parse` throws → show existing error message.
2. Call `validateImport(parsed)`.
3. If `errors.length > 0` → show a destructive AlertDialog listing them; only option is "Cancel".
4. Else if `warnings.length > 0` → show an AlertDialog: "{N} issue(s) found in this plan" with bullet list of warning messages, plus a one-line repair summary ("Auto-repairs will be applied on load."). Buttons: "Cancel" and "Load anyway".
5. Else → load directly (current behavior).
6. On "Load anyway" or no-warnings path, pass the **repaired** payload (not the original) to `mergeAssumptionsPayload`.

Keep the existing `setError` for catastrophic JSON parse failures. Validation issues use the dialog — clearer and supports lists.

### 3. New `src/test/validateImport.test.ts`
- Empty object → 0 errors, 0 warnings, repaired equals empty object.
- `null` / array / string → 1 error.
- `cashflow.fundraiseAmount = 999, fundraise.raise = 2_000_000` → 1 warning, repaired strips `fundraiseAmount`.
- `fundraise.dilutionPct = 150` → 1 warning, repaired clamps to 100.
- `cashflow.grossMargin = -10` → 1 warning, repaired clamps to 0.
- `planStartDate = "garbage"` → 1 warning, repaired replaces with `currentMonthISO()` shape.
- Pricing tier with `monthlyPriceNum = 50` but `forecast.startingMRR = 0` and `monthlyNewBookings = 0` → 1 warning.
- Unknown top-level key `{foo: 1}` → 1 warning ("Unknown field 'foo' will be ignored").
- Valid plan exported from the app round-trips with 0 errors and 0 warnings.

### 4. Round-trip guarantee
Add one assertion in the test suite: serialize `DEFAULT_ASSUMPTIONS`, run `validateImport` on it, expect zero errors and zero warnings. Catches future regressions where a default value drifts outside its own validator's accepted range.

## What this does NOT do
- Doesn't validate the *semantics* of the plan (e.g. "is your raise sensible?"). That's the runway-check / verdict layer's job.
- Doesn't gate on warnings — user can always proceed. Errors block only when the payload is structurally unusable (not an object, etc.).
- Doesn't change `mergeAssumptionsPayload` — the merger keeps doing the legacy-field stripping it already does. Validation just *tells the user* about it before merging.
- Doesn't add a JSON schema dependency. Hand-rolled checks keep the bundle slim and the messages plain-English.

## Files touched
- `src/lib/validateImport.ts` (new)
- `src/components/course/UploadJson.tsx` (validation flow + AlertDialog)
- `src/test/validateImport.test.ts` (new)

