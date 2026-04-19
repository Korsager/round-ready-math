import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import type { RefObject } from "react";
import type { ScenarioResult } from "@/lib/forecast";

interface Props {
  bull: ScenarioResult;
  base: ScenarioResult;
  bear: ScenarioResult;
  forecastRef: RefObject<HTMLDivElement>;
  matrixRef: RefObject<HTMLDivElement>;
  waterfallRef: RefObject<HTMLDivElement>;
}

function downloadCSV(bull: ScenarioResult, base: ScenarioResult, bear: ScenarioResult) {
  const headers = ["Month", "Bull MRR", "Base MRR", "Bear MRR", "Base retained MRR", "Base new bookings", "Base churn"];
  const rows = bull.months.map((_, i) => [
    i,
    Math.round(bull.months[i].mrr),
    Math.round(base.months[i].mrr),
    Math.round(bear.months[i].mrr),
    Math.round(base.months[i].retainedMRR),
    Math.round(base.months[i].newBookings),
    Math.round(base.months[i].churnLoss),
  ].join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "forecast.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPng(ref: RefObject<HTMLDivElement>, name: string) {
  if (!ref.current) return;
  const url = await toPng(ref.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.png`;
  a.click();
}

export default function ExportButtons({ bull, base, bear, forecastRef, matrixRef, waterfallRef }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      <Button variant="outline" size="sm" onClick={() => downloadCSV(bull, base, bear)}>Download CSV</Button>
      <Button variant="outline" size="sm" onClick={() => downloadPng(forecastRef, "forecast")}>Download forecast PNG</Button>
      <Button variant="outline" size="sm" onClick={() => downloadPng(matrixRef, "matrix")}>Download matrix PNG</Button>
      <Button variant="outline" size="sm" onClick={() => downloadPng(waterfallRef, "waterfall")}>Download waterfall PNG</Button>
    </div>
  );
}
