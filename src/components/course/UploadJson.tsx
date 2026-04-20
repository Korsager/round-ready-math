import { useRef, useState } from "react";
import { Upload, FilePlus2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAssumptions, mergeAssumptionsPayload } from "@/lib/assumptions";
import { blankPricingStrategy } from "@/lib/pricingStrategy";

export default function UploadJson() {
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setForecast, setCashflow, setFundraise, setPricing, reset } = useAssumptions();
  const [error, setError] = useState<string | null>(null);

  const startFresh = () => {
    reset();
    setPricing(blankPricingStrategy());
    navigate("/course/pricing");
  };

  const onFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const merged = mergeAssumptions(parsed);
      setFundraise(merged.fundraise);
      setForecast(merged.forecast);
      setCashflow(merged.cashflow);
      setPricing(merged.pricing);
      navigate("/course/pricing");
    } catch (e) {
      setError("Could not read that file. Make sure it's a valid plan JSON exported from this tool.");
    }
  };

  return (
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
  );
}
