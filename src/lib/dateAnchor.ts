// Pure helpers to render "month N" alongside its calendar date,
// anchored to a plan start month (ISO YYYY-MM).

const MONTH_RE = /^(\d{4})-(\d{2})$/;

function parseAnchor(startISO: string): { year: number; month: number } {
  const m = MONTH_RE.exec(startISO ?? "");
  if (!m) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1; // 0-indexed
  return { year, month };
}

function offsetDate(startISO: string, monthIndex: number): Date {
  const { year, month } = parseAnchor(startISO);
  return new Date(year, month + monthIndex, 1);
}

/** Default plan start: current month as YYYY-MM. */
export function currentMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "Month 6 (Oct 2026)" */
export function monthLabel(startISO: string, monthIndex: number): string {
  const d = offsetDate(startISO, monthIndex);
  const cal = d.toLocaleString("en-US", { month: "short", year: "numeric" });
  return `Month ${monthIndex} (${cal})`;
}

/** "Oct '26" — compact form for chart axes. */
export function monthShort(startISO: string, monthIndex: number): string {
  const d = offsetDate(startISO, monthIndex);
  const mon = d.toLocaleString("en-US", { month: "short" });
  const yr = String(d.getFullYear()).slice(-2);
  return `${mon} '${yr}`;
}

/** Just the calendar suffix: "(Oct 2026)" — handy for inlining after existing "month N" copy. */
export function monthCalendar(startISO: string, monthIndex: number): string {
  const d = offsetDate(startISO, monthIndex);
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

/** "Apr 2026" — for the cover/headers showing the anchor itself. */
export function planStartLabel(startISO: string): string {
  return monthCalendar(startISO, 0);
}
