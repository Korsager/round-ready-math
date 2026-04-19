import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CashflowResult } from "@/lib/cashflow";
import { fmtDollars } from "@/lib/format";

interface Props {
  result: CashflowResult;
}

export default function CashflowTable({ result }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F9FAFB] rounded-xl"
      >
        <div>
          <h3 className="text-[15px] font-semibold text-[#111827]">Monthly breakdown</h3>
          <p className="text-[12px] text-[#6B7280]">Full 37-month cash detail</p>
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-[#E5E7EB]">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="bg-[#F9FAFB] text-[#6B7280]">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Month</th>
                <th className="px-3 py-2 text-right font-medium">Revenue (MRR)</th>
                <th className="px-3 py-2 text-right font-medium">Gross profit</th>
                <th className="px-3 py-2 text-right font-medium">OpEx</th>
                <th className="px-3 py-2 text-right font-medium">Net burn</th>
                <th className="px-3 py-2 text-right font-medium">Raise inflow</th>
                <th className="px-3 py-2 text-right font-medium">Cash balance</th>
              </tr>
            </thead>
            <tbody>
              {result.months.map((m) => (
                <tr key={m.month} className={`border-t border-[#F3F4F6] ${m.cashBalance < 0 ? "bg-[#FEE2E2]" : ""}`}>
                  <td className="px-3 py-1.5">{m.month}</td>
                  <td className="px-3 py-1.5 text-right">{fmtDollars(m.revenue)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtDollars(m.grossProfit)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtDollars(m.opex)}</td>
                  <td className={`px-3 py-1.5 text-right ${m.netBurn > 0 ? "text-[#991B1B]" : "text-[#065F46]"}`}>
                    {m.netBurn > 0 ? `-${fmtDollars(m.netBurn)}` : `+${fmtDollars(-m.netBurn)}`}
                  </td>
                  <td className="px-3 py-1.5 text-right text-[#10B981]">{m.fundraiseInflow > 0 ? `+${fmtDollars(m.fundraiseInflow)}` : "—"}</td>
                  <td className={`px-3 py-1.5 text-right font-medium ${m.cashBalance < 0 ? "text-[#991B1B]" : "text-[#111827]"}`}>{fmtDollars(m.cashBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
