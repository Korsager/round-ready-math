export const fmt = (v: number): string => {
  const n = Math.round(v);
  if (Math.abs(n) >= 1000) {
    const k = Math.round(n / 1000);
    return n < 0 ? `-$${Math.abs(k)}K` : `$${k}K`;
  }
  return n < 0 ? `-$${Math.abs(n)}` : `$${n}`;
};

export const fmtDollars = (v: number): string => {
  const n = Math.round(v);
  const abs = Math.abs(n).toLocaleString("en-US");
  return n < 0 ? `-$${abs}` : `$${abs}`;
};

export const fmtPercent = (v: number, digits = 0): string => `${v.toFixed(digits)}%`;
