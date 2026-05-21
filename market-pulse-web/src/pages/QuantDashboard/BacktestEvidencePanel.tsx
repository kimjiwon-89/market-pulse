import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { QuantBacktestEvidence, QuantBacktestPoint } from "@/types";
import { useIsMobile } from "@/hooks";
import { formatMoney, formatPctRatio } from "./quantTypes";

type Props = {
  backtest: QuantBacktestEvidence | null;
};

function chartDate(value: string) {
  return value.length === 8 ? `${value.slice(2, 4)}.${value.slice(4, 6)}` : value;
}

function metricRows(backtest: QuantBacktestEvidence | null) {
  return [
    ["월간 성과", formatPctRatio(backtest?.monthlyReturn ?? backtest?.metrics?.monthlyReturn)],
    ["MDD", formatPctRatio(backtest?.mdd ?? backtest?.metrics?.mdd)],
    ["Sharpe", (backtest?.sharpe ?? backtest?.metrics?.sharpe)?.toFixed(2) ?? "-"],
    ["승률", formatPctRatio(backtest?.winRate ?? backtest?.metrics?.winRate)],
    ["총 비용", formatMoney(backtest?.totalCost ?? backtest?.metrics?.totalCost)],
  ];
}

function toDrawdownData(points: QuantBacktestPoint[]) {
  return points.map((point) => ({ date: point.date, drawdown: point.drawdown ?? 0 }));
}

export function BacktestEvidencePanel({ backtest }: Props) {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 190 : 260;
  const equity = backtest?.equityCurve ?? [];
  const drawdown = toDrawdownData(backtest?.drawdownCurve ?? []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {metricRows(backtest).map(([label, value]) => (
          <div key={label} className="card stat-cell">
            <div className="stat-label">{label}</div>
            <div className="stat-value text-base lg:text-xl">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Equity Curve</div>
            <div className="card-sub">비용 차감 기준</div>
          </div>
          {equity.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={equity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={chartDate} tick={{ fontSize: 11, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-3)" }} tickLine={false} axisLine={false} width={54} />
                <Tooltip contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 12 }} />
                <Line type="monotone" dataKey="netEquity" dot={false} stroke="var(--accent)" strokeWidth={1.8} />
                <Line type="monotone" dataKey="grossEquity" dot={false} stroke="var(--text-4)" strokeDasharray="4 4" strokeWidth={1.2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="py-16 text-center text-sm text-[var(--text-3)]">차트 데이터가 없습니다.</p>}
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Drawdown</div>
            <div className="card-sub">낙폭 구간</div>
          </div>
          {drawdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={drawdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={chartDate} tick={{ fontSize: 11, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`} tick={{ fontSize: 11, fill: "var(--text-3)" }} tickLine={false} axisLine={false} width={44} />
                <Tooltip contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 12 }} formatter={(value) => formatPctRatio(Number(value))} />
                <Line type="monotone" dataKey="drawdown" dot={false} stroke="var(--down)" strokeWidth={1.8} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="py-16 text-center text-sm text-[var(--text-3)]">낙폭 데이터가 없습니다.</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">월별 성과 히트맵</div>
          <div className="card-sub">비용 반영 후 월별 결과</div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
          {(backtest?.monthlyReturns ?? []).map((item) => (
            <div
              key={`${item.year}-${item.month}`}
              className={`rounded-md border border-[var(--border)] p-2 text-center ${item.returnPct >= 0 ? "bg-up" : "bg-down"}`}
            >
              <div className="mono text-[11px] text-[var(--text-3)]">{String(item.year).slice(2)}.{String(item.month).padStart(2, "0")}</div>
              <div className={`mono text-xs font-semibold ${item.returnPct >= 0 ? "up" : "down"}`}>{formatPctRatio(item.returnPct)}</div>
            </div>
          ))}
        </div>
        {(backtest?.monthlyReturns ?? []).length === 0 && <p className="py-8 text-center text-sm text-[var(--text-3)]">월별 데이터가 없습니다.</p>}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">비용 요약</div>
          <div className="card-sub">수수료, 세금, 회전율 반영</div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="stat-cell"><div className="stat-label">비용 전</div><div className="stat-value text-base">{formatPctRatio(backtest?.costSummary?.grossReturn)}</div></div>
          <div className="stat-cell"><div className="stat-label">비용 후</div><div className="stat-value text-base">{formatPctRatio(backtest?.costSummary?.netReturn)}</div></div>
          <div className="stat-cell"><div className="stat-label">총 회전율</div><div className="stat-value text-base">{formatPctRatio(backtest?.costSummary?.totalTurnover)}</div></div>
          <div className="stat-cell"><div className="stat-label">평균 회전율</div><div className="stat-value text-base">{formatPctRatio(backtest?.costSummary?.avgTurnover)}</div></div>
          <div className="stat-cell"><div className="stat-label">수수료</div><div className="stat-value text-base">{formatMoney(backtest?.costSummary?.totalFee)}</div></div>
          <div className="stat-cell"><div className="stat-label">세금</div><div className="stat-value text-base">{formatMoney(backtest?.costSummary?.totalTax)}</div></div>
          <div className="stat-cell"><div className="stat-label">총 비용</div><div className="stat-value text-base">{formatMoney(backtest?.costSummary?.totalCost ?? backtest?.totalCost)}</div></div>
          <div className="stat-cell"><div className="stat-label">거래 수</div><div className="stat-value text-base">{backtest?.costSummary?.tradeCount?.toLocaleString() ?? "-"}</div></div>
        </div>
      </div>
    </div>
  );
}
