import { useMemo } from "react";

interface Props {
  targetIrr: number;     // e.g. 30
  userMoic: number;      // user's current targetMoic
  userYears: number;     // user's current yearsToExit
}

const COLS = [1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8] as const;
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function irrFor(moic: number, years: number): number {
  if (years <= 0 || moic <= 0) return 0;
  return (Math.pow(moic, 1 / years) - 1) * 100;
}

// Same stop palette as MatrixChart for visual consistency.
function colorFor(irr: number, target: number): string {
  if (irr >= target * 1.3) return "rgb(10, 158, 94)";   // strong green
  if (irr >= target)        return "rgb(52, 211, 153)";   // green
  if (irr >= target * 0.7)  return "rgb(245, 158, 11)";   // amber
  return "rgb(239, 68, 68)";                              // red
}

function nearestIndex<T extends readonly number[]>(arr: T, v: number): number {
  let bestI = 0;
  let bestD = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i] - v);
    if (d < bestD) { bestD = d; bestI = i; }
  }
  return bestI;
}

export default function IrrGrid({ targetIrr, userMoic, userYears }: Props) {
  const userColIdx = useMemo(() => nearestIndex(COLS, userMoic), [userMoic]);
  const userRowIdx = useMemo(() => nearestIndex(ROWS, userYears), [userYears]);

  // Derived quick-answer numbers (mirrors useCalc.ts formulas; computed
  // locally to avoid threading useCalc through the page).
  const irrDec = targetIrr / 100;
  const moicNeededForTargetIrr = userYears > 0 && irrDec > 0
    ? Math.pow(1 + irrDec, userYears)
    : 0;
  const yearsNeededAtMoic = userMoic > 1 && irrDec > 0
    ? Math.log(userMoic) / Math.log(1 + irrDec)
    : Infinity;
  const maxHoldYears = yearsNeededAtMoic; // same formula per useCalc.ts

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 sm:p-6">
      <h3 className="text-[16px] font-semibold text-[#111827]">IRR by years held × exit multiple</h3>
      <p className="text-[12px] text-[#6B7280] mt-1 mb-4 leading-relaxed">
        Find your exit multiple along the top. Find your years to exit on the left. That cell is the IRR you deliver.
        Anything below your target is a conversation investors will push back on.
      </p>

      <div className="flex gap-4">
        <div className="flex items-center">
          <div className="text-[11px] text-[#6B7280] whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            Years Held
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <div className="inline-block min-w-full">
            <div className="grid" style={{ gridTemplateColumns: `40px repeat(${COLS.length}, minmax(56px, 1fr))`, gap: 4 }}>
              <div />
              {COLS.map((m) => (
                <div key={m} className="text-[11px] text-[#6B7280] text-center">{m}×</div>
              ))}
              {ROWS.map((yr, ri) => (
                <div key={`row-${yr}`} className="contents">
                  <div className="text-[11px] text-[#6B7280] text-right pr-2 self-center tabular-nums">{yr}</div>
                  {COLS.map((moic, ci) => {
                    const irr = irrFor(moic, yr);
                    const isUser = ri === userRowIdx && ci === userColIdx;
                    return (
                      <div
                        key={`${yr}-${moic}`}
                        className="relative rounded-md text-[12px] font-medium text-[#111827] flex items-center justify-center tabular-nums"
                        style={{
                          background: colorFor(irr, targetIrr),
                          padding: 6,
                          minHeight: 40,
                          boxShadow: isUser ? "inset 0 0 0 2px #3B82F6" : undefined,
                        }}
                        title={`${moic}× in ${yr}yr → ${irr.toFixed(1)}% IRR`}
                      >
                        {irr.toFixed(1)}%
                        {isUser && (
                          <span
                            className="absolute -top-1.5 -right-1.5 text-[9px] font-semibold text-white bg-[#3B82F6] rounded-full px-1.5 py-0.5 leading-none shadow"
                            aria-label="Your current scenario"
                          >
                            You
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="text-center text-[11px] text-[#6B7280] mt-3">Exit Multiple (MOIC)</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-[10px] text-[#6B7280]">Strong</div>
          <div
            className="relative"
            style={{
              width: 14, height: 220, borderRadius: 4,
              background: "linear-gradient(to bottom, rgb(10,158,94), rgb(52,211,153), rgb(245,158,11), rgb(239,68,68))",
            }}
          >
            <div className="absolute -right-1 w-3 h-0.5 bg-[#3B82F6]" style={{ top: "33%" }} />
            <div className="absolute -right-12 text-[9px] text-[#3B82F6] font-medium whitespace-nowrap" style={{ top: "calc(33% - 6px)" }}>
              {targetIrr}% target
            </div>
          </div>
          <div className="text-[10px] text-[#6B7280]">Weak</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
        <QuickCard
          label={`Required MOIC at ${userYears}yr`}
          value={moicNeededForTargetIrr > 0 ? `${moicNeededForTargetIrr.toFixed(1)}×` : "—"}
          sub={`to hit ${targetIrr}% IRR`}
        />
        <QuickCard
          label={`Years needed at ${userMoic.toFixed(1)}× MOIC`}
          value={isFinite(yearsNeededAtMoic) ? `${yearsNeededAtMoic.toFixed(1)} yr` : "—"}
          sub={`to hit ${targetIrr}% IRR`}
        />
        <QuickCard
          label="Max hold before IRR drops"
          value={isFinite(maxHoldYears) ? `${maxHoldYears.toFixed(1)} yr` : "—"}
          sub={`at ${userMoic.toFixed(1)}× MOIC`}
        />
      </div>

      <p className="text-[11px] text-[#9CA3AF] mt-4 italic">
        Illustrative IRR model. Assumes a single exit event — partial distributions and J-curve effects not modelled here.
      </p>
    </div>
  );
}

function QuickCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFB] p-3">
      <div className="text-[10px] uppercase tracking-wide text-[#6B7280]">{label}</div>
      <div className="text-[20px] font-semibold text-[#111827] tabular-nums leading-tight mt-0.5">{value}</div>
      <div className="text-[11px] text-[#9CA3AF] mt-0.5">{sub}</div>
    </div>
  );
}
