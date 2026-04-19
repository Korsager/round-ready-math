import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import type { ScenarioResult } from "@/lib/forecast";

interface Props {
  bull: ScenarioResult;
  base: ScenarioResult;
  bear: ScenarioResult;
  forecastRef: React.RefObject<HTMLDivElement>;
  matrixRef: React.RefObject<HTMLDivElement>;
  waterfallRef: React.RefObject<HTMLDivElement>;
}

function downloadCsv(bull: ScenarioResult, base: ScenarioResult, bear: ScenarioResult) {
  const rows = ["month,bull_mrr,base_mrr,bear_mrr,base_retained_mrr,base_new_bookings,base_churn"];
  for (let i = 0; i <= 36; i++) {
    const b = base.months[i];
    rows.push([i, bull.months[i].mrr, base.months[i].mrr, bear.months[i].mrr, b.retainedMRR, b.newBookings, b.churnLoss].map((n) => Math.round(Number(n))).join(","));
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "forecast-36mo.csv"; a.click();
  URL.revokeObjectURL(url);
}

async function downloadPng(node: HTMLElement | null, name: string) {
  if (!node) return;
  const url = await toPng(node, { backgroundColor: "#ffffff", pixelRatio: 2 });
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.png`; a.click();
}

export default function ExportButtons({ bull, base, bear, forecastRef, matrixRef, waterfallRef }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button variant="outline" size="sm" onClick={() => downloadCsv(bull, base, bear)}>Download CSV</Button>
      <Button variant="outline" size="sm" onClick={() => downloadPng(forecastRef.current, "forecast")}>Download forecast PNG</Button>
      <Button variant="outline" size="sm" onClick={() => downloadPng(matrixRef.current, "matrix")}>Download matrix PNG</Button>
      <Button variant="outline" size="sm" onClick={() => downloadPng(waterfallRef.current, "waterfall")}>Download waterfall PNG</Button>
    </div>
  );
}
