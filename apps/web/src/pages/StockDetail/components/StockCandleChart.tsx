import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StockChartItem, StockDetail, StockMinuteCandle } from "@/types";
import { fmtNum } from "@/utils/format";

export type ChartPeriod = "1D" | "1M" | "3M" | "1Y";

interface StockCandleChartProps {
  detail: StockDetail;
  period: ChartPeriod;
  chart: StockChartItem[];
  minuteChart: StockMinuteCandle[];
  loading: boolean;
  isMobile: boolean;
  onPeriodChange: (period: ChartPeriod) => void;
}

function chartColor(detail: StockDetail): string {
  return detail.changeRate > 0 ? "var(--up)" : detail.changeRate < 0 ? "var(--down)" : "var(--flat)";
}

function fmtDate8(s: string): string {
  if (s.length !== 8) return s;
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6)}`;
}

function fmtMinuteTime(s: string): string {
  if (s.length !== 14) return s;
  return `${s.slice(8, 10)}:${s.slice(10, 12)}`;
}

export function StockCandleChart({
  detail,
  period,
  chart,
  minuteChart,
  loading,
  isMobile,
  onPeriodChange,
}: StockCandleChartProps) {
  const color = chartColor(detail);
  const data = period === "1D" ? minuteChart : chart;
  const isMinute = period === "1D";

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">주가 차트</div>
          {isMinute && (
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
              KIS 당일 1분봉 기준
            </div>
          )}
        </div>
        <div className="chips">
          {(["1D", "1M", "3M", "1Y"] as ChartPeriod[]).map(p => (
            <button
              key={p}
              className="chip"
              aria-pressed={period === p}
              onClick={() => onPeriodChange(p)}
            >
              {p === "1D" ? "1분" : p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="sk tall" style={{ height: isMobile ? 170 : 240 }} />
      ) : data.length === 0 ? (
        <p style={{ color: "var(--text-3)", textAlign: "center", padding: "44px 0" }}>
          {isMinute ? "KIS 당일 1분봉 데이터 없음" : "차트 데이터 없음"}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={isMobile ? 170 : 240}>
          <AreaChart data={data} margin={{ top: 8, right: 0, left: isMobile ? 0 : 8, bottom: 0 }}>
            <defs>
              <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey={isMinute ? "time" : "date"}
              tickFormatter={v => isMinute ? fmtMinuteTime(v) : `${v.slice(4, 6)}/${v.slice(6)}`}
              tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            {!isMobile && (
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
                width={60}
                tickFormatter={v => fmtNum(v, { compact: true })}
              />
            )}
            <Tooltip
              contentStyle={{
                background: "var(--bg-panel)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: 12,
              }}
              formatter={(val: number | undefined) => [fmtNum(val ?? 0), "종가"]}
              labelFormatter={label => isMinute ? fmtMinuteTime(String(label)) : fmtDate8(String(label))}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={1.5}
              fill="url(#stockGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
