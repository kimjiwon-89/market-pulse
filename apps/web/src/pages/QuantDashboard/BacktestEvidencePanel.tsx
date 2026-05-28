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
    ["월평균 수익률", formatPctRatio(backtest?.monthlyReturn ?? backtest?.metrics?.monthlyReturn)],
    ["최대 하락 경험", formatPctRatio(backtest?.mdd ?? backtest?.metrics?.mdd)],
    ["변동 대비 성과", (backtest?.sharpe ?? backtest?.metrics?.sharpe)?.toFixed(2) ?? "-"],
    ["오른 달 비율", formatPctRatio(backtest?.winRate ?? backtest?.metrics?.winRate)],
    ["거래 비용", formatMoney(backtest?.totalCost ?? backtest?.metrics?.totalCost)],
  ];
}

function toDrawdownData(points: QuantBacktestPoint[]) {
  return points.map((point) => ({ date: point.date, drawdown: point.drawdown ?? 0 }));
}

function capitalRows(backtest: QuantBacktestEvidence | null) {
  const equity = backtest?.equityCurve ?? [];
  const seed = equity[0]?.netEquity ?? null;
  const current = equity[equity.length - 1]?.netEquity ?? null;
  const profit = seed !== null && current !== null ? current - seed : null;
  return { seed, current, profit };
}

export function BacktestEvidencePanel({ backtest }: Props) {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 190 : 260;
  const equity = backtest?.equityCurve ?? [];
  const drawdown = toDrawdownData(backtest?.drawdownCurve ?? []);
  const capital = capitalRows(backtest);

  return (
    <div className="space-y-5">
      <div className="card border-[var(--border-strong)] bg-[var(--bg-alt)]">
        <div className="font-medium">과거 결과는 참고 자료이며 앞으로의 수익을 보장하지 않습니다.</div>
        <div className="mt-1 text-sm text-[var(--text-3)]">
          최대 하락 경험은 과거 테스트 기간 중 고점 대비 가장 크게 내려갔던 구간입니다.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {metricRows(backtest).map(([label, value]) => (
          <div key={label} className="card stat-cell">
            <div className="stat-label">{label}</div>
            <div className="stat-value text-base lg:text-xl">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="card stat-cell">
          <div className="stat-label">시드머니</div>
          <div className="stat-value text-base lg:text-xl">{formatMoney(capital.seed)}</div>
          <div className="stat-delta flat">테스트 첫날 평가액</div>
        </div>
        <div className="card stat-cell">
          <div className="stat-label">현재 평가액</div>
          <div className="stat-value text-base lg:text-xl">{formatMoney(capital.current)}</div>
          <div className="stat-delta flat">테스트 마지막 날 평가액</div>
        </div>
        <div className="card stat-cell">
          <div className="stat-label">평가 손익</div>
          <div className={`stat-value text-base lg:text-xl ${(capital.profit ?? 0) >= 0 ? "up" : "down"}`}>
            {formatMoney(capital.profit)}
          </div>
          <div className="stat-delta flat">현재 평가액 - 시드머니</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">자산 흐름</div>
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
            <div className="card-title">최대 하락 경험</div>
            <div className="card-sub">고점 대비 내려간 구간</div>
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
