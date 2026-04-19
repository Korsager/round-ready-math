import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export const COURSE_STEPS = [
  { id: "pricing", label: "Pricing", path: "/course/pricing" },
  { id: "revenue", label: "Revenue", path: "/course/revenue" },
  { id: "fundraising", label: "Fundraising", path: "/course/fundraising" },
  { id: "cashflow", label: "Cashflow", path: "/course/cashflow" },
  { id: "export", label: "Export", path: "/course/export" },
] as const;

export type CourseStepId = typeof COURSE_STEPS[number]["id"];

interface Props {
  current: CourseStepId;
}

export default function StepProgress({ current }: Props) {
  const currentIdx = COURSE_STEPS.findIndex((s) => s.id === current);
  return (
    <div className="bg-white border-b border-[#E5E7EB]">
      <div className="max-w-[1100px] mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {COURSE_STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            const reachable = i <= currentIdx;
            const inner = (
              <div
                className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md whitespace-nowrap ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
                } ${reachable ? "cursor-pointer hover:opacity-90" : "cursor-default opacity-60"}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    active ? "bg-primary-foreground/20" : done ? "bg-primary/15 text-primary" : "bg-muted"
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="text-[12px] sm:text-[13px] font-medium">{step.label}</span>
              </div>
            );
            return (
              <li key={step.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
                {reachable ? <Link to={step.path}>{inner}</Link> : inner}
                {i < COURSE_STEPS.length - 1 && (
                  <span className={`w-3 sm:w-6 h-px ${i < currentIdx ? "bg-primary/40" : "bg-[#E5E7EB]"}`} />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
