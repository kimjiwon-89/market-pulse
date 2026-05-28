import type { PerformanceSummary } from "@/types";

type Props = {
  performance: PerformanceSummary | null;
  initialCash: number;
  loading: boolean;
};

function pct(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
}

function krw(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(2)}억`;
  }
  if (abs >= 10_000) {
    return `${sign}${Math.round(abs / 10_000).toLocaleString()}만`;
  }
  return `${sign}${abs.toLocaleString()}원`;
}

function cls(value: number) {
  return value > 0 ? "up" : value < 0 ? "down" : "flat";
}

export function PerformanceCards({ performance, initialCash, loading }: Props) {
  const actualMonthly = performance?.monthlyReturn ?? 0;
  const targetMonthly = performance?.targetMonthlyReturn ?? 0.10;
  const items = [
    { label: "시드머니", value: krw(initialCash), className: "flat" },
    { label: "현재 평가액", value: performance ? krw(performance.finalValue) : "-", className: cls(performance?.profitAmount ?? 0) },
    { label: "실제 수익금", value: performance ? krw(performance.profitAmount) : "-", className: cls(performance?.profitAmount ?? 0) },
    { label: "처음 대비", value: performance ? pct(performance.initialToNowReturn) : "-", className: cls(performance?.initialToNowReturn ?? 0) },
    { label: "월 수익률", value: performance ? `${pct(actualMonthly)} / 목표 ${pct(targetMonthly)}` : "-", className: cls(actualMonthly - targetMonthly) },
    { label: "총 수익률", value: performance ? pct(performance.totalReturn) : "-", className: cls(performance?.totalReturn ?? 0) },
    { label: "최대낙폭", value: performance ? pct(performance.mdd) : "-", className: cls(performance?.mdd ?? 0) },
    { label: "총 거래횟수", value: performance ? performance.totalTrades.toLocaleString() : "-", className: "flat" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(item => (
        <div key={item.label} className="stat-cell">
          <div className="stat-label">{item.label}</div>
          {loading ? <div className="sk" style={{ height: 28 }} /> : <div className={`stat-value ${item.className}`}>{item.value}</div>}
        </div>
      ))}
    </div>
  );
}
