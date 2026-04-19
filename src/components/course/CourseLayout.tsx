import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import StepProgress, { COURSE_STEPS, type CourseStepId } from "./StepProgress";

interface Props {
  step: CourseStepId;
  title: string;
  intro: string;
  children: ReactNode;
  nextLabel?: string;
  onNext?: () => void;
  hideNext?: boolean;
}

export default function CourseLayout({ step, title, intro, children, nextLabel, onNext, hideNext }: Props) {
  const navigate = useNavigate();
  const idx = COURSE_STEPS.findIndex((s) => s.id === step);
  const prev = idx > 0 ? COURSE_STEPS[idx - 1] : null;
  const next = idx < COURSE_STEPS.length - 1 ? COURSE_STEPS[idx + 1] : null;

  const handleNext = () => {
    if (onNext) onNext();
    if (next) navigate(next.path);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#E5E7EB]">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket size={16} className="text-primary" />
            <span className="text-[13px] font-medium text-[#111827]">Founders Toolkit · Course</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Saved automatically</span>
        </div>
      </header>

      <StepProgress current={step} />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-3 sm:px-4 py-5 sm:py-7 pb-28">
        <div className="mb-5">
          <h1 className="text-[22px] sm:text-[28px] font-semibold text-[#111827] leading-tight">{title}</h1>
          <p className="text-[13px] sm:text-[14px] text-[#6B7280] mt-1 max-w-2xl">{intro}</p>
        </div>
        {children}
      </main>

      {/* Sticky footer */}
      <footer className="sticky bottom-0 z-50 bg-white/95 backdrop-blur border-t border-[#E5E7EB]">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!prev}
            onClick={() => prev && navigate(prev.path)}
            className="h-9"
          >
            <ChevronLeft size={14} className="mr-1" /> Back
          </Button>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Step {idx + 1} of {COURSE_STEPS.length} · saved automatically
          </span>
          {!hideNext && (
            <Button size="sm" onClick={handleNext} disabled={!next && !onNext} className="h-9">
              {nextLabel ?? "Next"} <ChevronRight size={14} className="ml-1" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
