import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint, QuantExperimentVariant } from "@/types";
import { useIsMobile } from "@/hooks";

type Props = {
  variant: QuantExperimentVariant | null;
};

type DrawdownPoint = {
  date: string;
  drawdown: number;
};

function toDrawdown(curve: EquityPoint[]): DrawdownPoint[] {
  let peak = 0;
  return curve.map(point => {
    peak = Math.max(peak, point.value);
    const drawdown = peak > 0 ? point.value / peak - 1 : 0;
    return { date: point.date, drawdown };
  });
}

function label(date: string) {
  return date.length === 8 ? `${date.slice(2, 4)}.${date.slice(4, 6)}` : date;
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function DrawdownChart({ variant }: Props) {
  const isMobile = useIsMobile();
  const data = variant?.equityCurve ? toDrawdown(variant.equityCurve) : [];

  if (!variant) {
    return <div className="text-center text-[var(--text-3)] py-12">Select a variant to inspect drawdown.</div>;
  }

  if (data.length === 0) {
    return <div className="text-center text-[var(--text-3)] py-12">No drawdown series for this variant.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 180 : 240}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: isMobile ? 0 : 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--divider)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={label} tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={pct} tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={48} />
        <Tooltip
          formatter={(value) => [pct(Number(value)), "Drawdown"]}
          labelFormatter={value => label(String(value ?? ""))}
          contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 12 }}
        />
        <Area type="monotone" dataKey="drawdown" stroke="var(--down)" fill="var(--down-soft)" strokeWidth={1.6} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
