import { useRef, useState } from "react";
import { parseShorthand } from "@/lib/assumptions";

interface Props {
  label: string;
  description?: string;
  value: number;
  format: (v: number) => string;
  onChange?: (v: number) => void;
  derived?: boolean;
}

export default function AssumptionRow({ label, description, value, format, onChange, derived }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (derived || !onChange) return;
    setDraft(format(value).replace(/[$,]/g, "").replace(/[a-zA-Z%]+$/g, "").trim() || String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };
  const commit = () => {
    const parsed = parseShorthand(draft);
    if (parsed !== null && onChange) onChange(parsed);
    setEditing(false);
  };

  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[#F3F4F6] last:border-0" title={description}>
      <div className="min-w-0">
        <div className="text-[13px] text-[#111827]">{label}</div>
        {description && <div className="text-[11px] text-[#9CA3AF] mt-0.5 leading-snug">{description}</div>}
      </div>
      <div className="shrink-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            className="h-7 w-28 text-right text-[13px] tabular-nums border border-primary rounded-md px-2 outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className={`text-[13px] tabular-nums font-medium px-2 py-1 rounded-md ${
              derived ? "text-[#6B7280] cursor-default" : "text-[#111827] hover:bg-secondary"
            }`}
          >
            {format(value)}
            {derived && <span className="ml-1 text-[10px] uppercase tracking-wide text-[#9CA3AF]">derived</span>}
          </button>
        )}
      </div>
    </div>
  );
}
