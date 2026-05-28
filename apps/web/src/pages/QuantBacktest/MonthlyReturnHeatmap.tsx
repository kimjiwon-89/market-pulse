import type { EquityPoint, QuantExperimentVariant } from "@/types";

type Props = {
  variant: QuantExperimentVariant | null;
};

type MonthCell = {
  month: string;
  value: number;
};

function monthKey(date: string) {
  return date.length >= 6 ? `${date.slice(0, 4)}-${date.slice(4, 6)}` : date;
}

function toMonthlyReturns(curve: EquityPoint[]): MonthCell[] {
  const buckets = new Map<string, { first: number; last: number }>();
  curve.forEach(point => {
    const key = monthKey(point.date);
    const current = buckets.get(key);
    if (!current) {
      buckets.set(key, { first: point.value, last: point.value });
      return;
    }
    current.last = point.value;
  });
  return [...buckets.entries()].map(([month, values]) => ({
    month,
    value: values.first > 0 ? values.last / values.first - 1 : 0,
  }));
}

function cls(value: number) {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

function pct(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function MonthlyReturnHeatmap({ variant }: Props) {
  const months = variant?.equityCurve ? toMonthlyReturns(variant.equityCurve) : [];

  if (!variant) {
    return <div className="text-center text-[var(--text-3)] py-12">Select a variant to inspect monthly returns.</div>;
  }

  if (months.length === 0) {
    return <div className="text-center text-[var(--text-3)] py-12">No monthly series for this variant.</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {months.map(month => (
        <div key={month.month} className={`rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-alt)] p-3 ${cls(month.value)}`}>
          <div className="mono text-xs text-[var(--text-3)]">{month.month}</div>
          <div className="mono text-sm font-semibold">{pct(month.value)}</div>
        </div>
      ))}
    </div>
  );
}
