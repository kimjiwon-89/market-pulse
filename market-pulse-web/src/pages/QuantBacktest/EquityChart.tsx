import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { BacktestResult, PerformanceResponse } from "@/types";
import { useIsMobile } from "@/hooks";

const COLORS: Record<string, string> = {
  "이동평균 돌파": "#1e5edb",
  "모멘텀": "#d62828",
  "섹터 로테이션": "#0f766e",
  "자산배분": "#a16207",
  "변동성 조절": "#7c3aed",
};

type Props = {
  performance: PerformanceResponse | null;
  backtest: BacktestResult | null;
  loading: boolean;
};

function ym(date: string) {
  return date.length === 8 ? `${date.slice(2, 4)}.${date.slice(4, 6)}` : date;
}

export function EquityChart({ performance, backtest, loading }: Props) {
  const isMobile = useIsMobile();
  if (loading) {
    return <div className="sk tall" style={{ height: isMobile ? 200 : 300 }} />;
  }

  const data = backtest
    ? backtest.equityCurve.map(p => ({ date: p.date, [backtest.strategyName]: p.value }))
    : mergePerformance(performance);
  const keys = data.length > 0 ? Object.keys(data[0]).filter(key => key !== "date") : [];

  if (data.length === 0) {
    return <p style={{ color: "var(--text-3)", textAlign: "center", padding: "64px 0" }}>백테스팅 데이터 없음</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: isMobile ? 0 : 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--divider)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={ym} tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={56} />
        <Tooltip contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 12 }} labelFormatter={label => ym(String(label ?? ""))} />
        <Legend />
        {keys.map(key => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            dot={false}
            strokeWidth={key.includes("벤치마크") ? 1.4 : 1.8}
            strokeDasharray={key.includes("벤치마크") ? "4 4" : undefined}
            stroke={key.includes("KOSPI") ? "#a8a29e" : key.includes("KOSDAQ") ? "#57534e" : COLORS[key] ?? "var(--accent)"}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function mergePerformance(performance: PerformanceResponse | null) {
  if (!performance) return [];
  const map = new Map<string, Record<string, string | number>>();
  const add = (date: string, key: string, value: number) => {
    const row = map.get(date) ?? { date };
    row[key] = value;
    map.set(date, row);
  };
  performance.benchmark?.forEach(p => add(p.date, "KOSPI 벤치마크", p.value));
  performance.kosdaqBenchmark?.forEach(p => add(p.date, "KOSDAQ 벤치마크", p.value));
  performance.strategies?.forEach(strategy => {
    strategy.equityCurve.forEach(p => add(p.date, strategy.strategyName, p.value));
  });
  return [...map.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}
