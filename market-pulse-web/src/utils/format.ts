export function dirCls(n: number): "up" | "down" | "flat" {
  return n > 0 ? "up" : n < 0 ? "down" : "flat";
}

export function triangle(n: number): string {
  return n > 0 ? "▲" : n < 0 ? "▼" : "▬";
}

export function fmtPct(p: number): string {
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(2)}%`;
}

export function fmtAmount(n: number): string {
  const eok = Math.round(Math.abs(n) / 1e8);
  const sign = n < 0 ? "-" : "";
  return `${sign}${eok.toLocaleString()}억`;
}

export function fmtVolume(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 10000) return `${sign}${Math.round(abs / 10000).toLocaleString()}만주`;
  return `${sign}${abs.toLocaleString()}주`;
}

export function fmtNum(n: number, opts?: { sign?: boolean; compact?: boolean }): string {
  const abs = Math.abs(n);
  const sign = opts?.sign ? (n >= 0 ? "+" : "−") : n < 0 ? "−" : "";
  if (opts?.compact) {
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)}조`;
    if (abs >= 1e8)  return `${sign}${(abs / 1e8).toFixed(0)}억`;
    if (abs >= 1e4)  return `${sign}${(abs / 1e4).toFixed(0)}만`;
  }
  return `${sign}${abs.toLocaleString()}`;
}
