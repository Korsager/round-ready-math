import { Rocket } from "lucide-react";
import UploadJson from "@/components/course/UploadJson";

export default function Start() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-4 h-14 flex items-center gap-2">
          <Rocket size={18} className="text-primary" />
          <span className="text-[14px] font-medium text-[#111827]">Founders Toolkit</span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-3 sm:px-4 py-10 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-4">
            GUIDED COURSE · 5 STEPS
          </div>
          <h1 className="text-[28px] sm:text-[36px] font-semibold text-[#111827] leading-tight">
            Build a fundraise-ready plan in one sitting
          </h1>
          <p className="text-[14px] sm:text-[16px] text-[#6B7280] mt-3">
            We'll walk you through pricing, revenue forecast, fundraising math, and cashflow. At the end you'll download a JSON
            backup, a PDF report, and an investor presentation.
          </p>
        </div>

        <UploadJson />

        <p className="text-center text-[12px] text-muted-foreground mt-8">
          Already exploring? <a href="/assumptions" className="underline hover:text-foreground">Skip to the dashboard</a>.
        </p>
      </main>
    </div>
  );
}
