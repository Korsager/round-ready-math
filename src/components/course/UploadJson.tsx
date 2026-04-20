import { useRef, useState } from "react";
import { Upload, FilePlus2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAssumptions, mergeAssumptionsPayload } from "@/lib/assumptions";
import { blankPricingStrategy } from "@/lib/pricingStrategy";
import { validateImport, type Issue } from "@/lib/validateImport";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UploadJson() {
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setForecast, setCashflow, setFundraise, setPricing, reset } = useAssumptions();
  const [error, setError] = useState<string | null>(null);

  // Dialog state for validation results.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"errors" | "warnings">("warnings");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pendingPayload, setPendingPayload] = useState<unknown>(null);

  const startFresh = () => {
    reset();
    setPricing(blankPricingStrategy());
    navigate("/course/pricing");
  };

  const applyPayload = (payload: unknown) => {
    const merged = mergeAssumptionsPayload(payload);
    setFundraise(merged.fundraise);
    setForecast(merged.forecast);
    setCashflow(merged.cashflow);
    setPricing(merged.pricing);
    navigate("/course/pricing");
  };

  const onFile = async (file: File) => {
    setError(null);
    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      setError("Could not read that file. Make sure it's a valid plan JSON exported from this tool.");
      return;
    }

    const { errors, warnings, repaired } = validateImport(parsed);

    if (errors.length > 0) {
      setIssues(errors);
      setDialogMode("errors");
      setPendingPayload(null);
      setDialogOpen(true);
      return;
    }
    if (warnings.length > 0) {
      setIssues(warnings);
      setDialogMode("warnings");
      setPendingPayload(repaired);
      setDialogOpen(true);
      return;
    }
    applyPayload(repaired);
  };

  const onConfirmLoad = () => {
    setDialogOpen(false);
    if (pendingPayload !== null) applyPayload(pendingPayload);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => fileRef.current?.click()}
          className="text-left bg-white rounded-2xl border border-[#E5E7EB] p-6 hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary inline-flex mb-4">
            <Upload size={22} />
          </div>
          <h3 className="text-[16px] font-semibold text-[#111827] mb-1">Upload existing plan</h3>
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            Continue with a JSON file you exported earlier. Your assumptions and pricing fields load instantly.
          </p>
          <p className="text-[12px] font-medium text-primary mt-3 group-hover:underline">Choose a .json file →</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              // Reset so re-selecting the same file fires onChange.
              e.target.value = "";
            }}
          />
        </button>

        <button
          onClick={startFresh}
          className="text-left bg-white rounded-2xl border border-[#E5E7EB] p-6 hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 inline-flex mb-4">
            <FilePlus2 size={22} />
          </div>
          <h3 className="text-[16px] font-semibold text-[#111827] mb-1">Start from scratch</h3>
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            Begin with sensible defaults. We'll walk you through pricing, revenue, fundraising, and cashflow one step at a time.
          </p>
          <p className="text-[12px] font-medium text-primary mt-3 group-hover:underline">Begin the course →</p>
        </button>

        {error && (
          <div className="md:col-span-2 text-[13px] text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle
                size={18}
                className={dialogMode === "errors" ? "text-destructive" : "text-amber-500"}
              />
              {dialogMode === "errors"
                ? "This plan can't be loaded"
                : `${issues.length} issue${issues.length === 1 ? "" : "s"} found in this plan`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-[13px] text-[#6B7280]">
                  {dialogMode === "errors"
                    ? "The file is structurally invalid. Fix the problems below and try again."
                    : "Auto-repairs will be applied on load. You can cancel and edit the file instead."}
                </p>
                <ul className="text-[13px] text-[#374151] space-y-1.5 list-disc pl-5 max-h-64 overflow-y-auto">
                  {issues.map((iss, i) => (
                    <li key={i}>
                      <span className="font-mono text-[12px] text-[#6B7280]">{iss.field}</span> — {iss.message}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {dialogMode === "warnings" && (
              <AlertDialogAction onClick={onConfirmLoad}>Load anyway</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
