import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PricingModel } from "@/lib/pricingStrategy";
import { MOTION_PROFILES } from "@/lib/motionProfiles";

interface Props {
  model: PricingModel;
  onApply: () => void;
}

export default function MotionDefaultsCard({ model, onApply }: Props) {
  const p = MOTION_PROFILES[model];
  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
      <div className="flex-1 text-[13px] text-foreground">
        <div>
          Your pricing is <strong>{model}</strong>. Typical {model} companies see{" "}
          <strong>{p.monthlyGrowthRate}%/mo</strong> growth,{" "}
          <strong>{p.monthlyGrossChurnRate}%</strong> gross churn,{" "}
          <strong>{p.monthlyExpansionRate}%</strong> expansion.
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">{p.description}</p>
        <div className="mt-2">
          <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={onApply}>
            Apply these as my base case
          </Button>
        </div>
      </div>
    </div>
  );
}
