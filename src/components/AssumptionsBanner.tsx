import { Link } from "react-router-dom";
import { SlidersHorizontal, ArrowRight } from "lucide-react";

interface Props {
  /** Optional summary chips to show right of the label */
  children?: React.ReactNode;
}

export default function AssumptionsBanner({ children }: Props) {
  return (
    <div className="max-w-[1100px] mx-auto px-3 sm:px-4 mb-4">
      <Link
        to="/assumptions"
        className="flex items-center justify-between gap-3 bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 hover:border-primary/40 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <SlidersHorizontal size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[#111827]">Inputs live on the Assumptions page</div>
            <div className="text-[11px] text-[#6B7280] truncate">{children ?? "Edit any number once — every page updates."}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-primary shrink-0">
          Edit <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
