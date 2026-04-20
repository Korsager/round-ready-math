

## Status: mostly already fixed

The earlier refactor already removed `fundraiseAmount` from `CashflowAssumptions`, made it a runtime-only field on `CashflowInputs`, and strips legacy values on both load paths (`assumptions.ts` localStorage loader + `UploadJson.tsx` JSON import). All consumers — `Cashflow.tsx`, `Export.tsx`, `exportPdf.ts`, `exportPptx.ts`, `planSummary.ts` — now derive the inflow from `assumptions.fundraise.raise`.

So the duplicated-state bug is gone. But two small loose ends remain.

## Remaining gaps to close

### 1. Stale localStorage isn't rewritten until the user edits something
The loader strips `cashflow.fundraiseAmount` in memory, but doesn't immediately re-`save()` the cleaned object. Users who exported their JSON before touching anything will still get the legacy field. Fix: in `assumptions.ts`, after `load()`, if the parsed payload contained `fundraiseAmount`, write the cleaned version back to localStorage on initialization.

### 2. JSON export shape isn't documented or tested
Add a tiny unit test asserting that `JSON.stringify(current.cashflow)` does not contain `fundraiseAmount`, so any future regression that re-introduces the field is caught.

## Changes

### `src/lib/assumptions.ts`
- In the module-init block (after `let current: Assumptions = load();`), check whether the raw localStorage payload had `cashflow.fundraiseAmount`. If yes, call `save(current)` once to rewrite the cleaned shape. Implement by having `load()` return a `{ value, hadLegacyFundraiseAmount }` tuple internally, or simpler: re-read localStorage once at module init, detect the legacy key, and call `save(current)` if found.

### `src/test/cashflowShape.test.ts` (new)
- Test 1: `DEFAULT_CASHFLOW` has no `fundraiseAmount` property.
- Test 2: Round-trip — parse a fixture object that has `cashflow.fundraiseAmount: 999`, run it through the same merge logic used by `UploadJson.mergeAssumptions`, and assert the result's `cashflow` has no `fundraiseAmount`.

## What this does NOT do
- No changes to `CashflowInputs` — it correctly keeps `fundraiseAmount` as a runtime-only field passed by callers.
- No changes to the UI — the "derived" label on the Fundraise amount row is already correct.
- No migration of in-flight exported JSON files in users' downloads folder — those are out of our reach; the import path already strips the field.

## Files touched
- `src/lib/assumptions.ts` (one-shot rewrite of stale localStorage)
- `src/test/cashflowShape.test.ts` (new guardrail test)

