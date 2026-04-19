import { useState } from "react";
import { FileJson, FileText, Presentation, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseLayout from "@/components/course/CourseLayout";
import { useAssumptions } from "@/lib/assumptions";
import { exportPdf } from "@/lib/exportPdf";
import { exportPptx } from "@/lib/exportPptx";
import { loadPricingStrategy } from "@/lib/pricingStrategy";

export default function CourseExport() {
  const { assumptions } = useAssumptions();
  const [done, setDone] = useState<Set<string>>(new Set());
  const mark = (k: string) => setDone((s) => new Set(s).add(k));

  const downloadJson = () => {
    const payload = { ...assumptions, pricing: loadPricingStrategy() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fundraise-plan.json";
    a.click();
    URL.revokeObjectURL(url);
    mark("json");
  };

  const downloadPdf = () => { exportPdf(assumptions, loadPricingStrategy()); mark("pdf"); };
  const downloadPptx = () => { exportPptx(assumptions, loadPricingStrategy()); mark("pptx"); };

  return (
    <CourseLayout
      step="export"
      title="5. Export your plan"
      intro="Download a backup of your assumptions and share-ready artifacts. You can return any time and re-import the JSON file."
      hideNext
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ExportCard
          icon={FileJson}
          title="Plan backup"
          desc="JSON file with all your assumptions. Import it next time to pick up exactly where you left off."
          cta="Download JSON"
          onClick={downloadJson}
          done={done.has("json")}
        />
        <ExportCard
          icon={FileText}
          title="PDF report"
          desc="Multi-page summary covering pricing, revenue forecast, fundraising math, and cashflow runway."
          cta="Download PDF"
          onClick={downloadPdf}
          done={done.has("pdf")}
        />
        <ExportCard
          icon={Presentation}
          title="Investor presentation"
          desc="PPTX deck — cover, one slide per section, and a summary. Open in Keynote, PowerPoint, or Google Slides."
          cta="Download PPTX"
          onClick={downloadPptx}
          done={done.has("pptx")}
        />
      </div>

      <div className="mt-8 bg-white rounded-xl border border-[#E5E7EB] p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-[#111827]">Start a new plan</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">Go back to the beginning to upload a different plan or start fresh.</p>
        </div>
        <a href="/start">
          <Button variant="outline" size="sm" className="h-9">
            <RotateCcw size={13} className="mr-1.5" /> New plan
          </Button>
        </a>
      </div>
    </CourseLayout>
  );
}

function ExportCard({
  icon: Icon, title, desc, cta, onClick, done,
}: { icon: any; title: string; desc: string; cta: string; onClick: () => void; done: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Icon size={20} />
        </div>
        {done && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <Check size={12} /> Downloaded
          </span>
        )}
      </div>
      <h3 className="text-[15px] font-semibold text-[#111827]">{title}</h3>
      <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed flex-1">{desc}</p>
      <Button onClick={onClick} size="sm" className="mt-4 h-9">{cta}</Button>
    </div>
  );
}
