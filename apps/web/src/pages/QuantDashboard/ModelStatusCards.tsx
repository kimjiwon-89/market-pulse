import type { QuantCandidateSignal, QuantCoreSummary, QuantPortfolioTarget } from "@/types";
import { formatDate, formatMoney, formatPctRatio } from "./quantTypes";

type Props = {
  summary: QuantCoreSummary | null;
  candidates: QuantCandidateSignal[];
  portfolio: QuantPortfolioTarget | null;
  loading: boolean;
};

export function ModelStatusCards({ summary, candidates, portfolio, loading }: Props) {
  if (loading && !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="card"><div className="sk tall" /></div>)}
      </div>
    );
  }

  const buyCount = candidates.filter((item) => item.candidateStatus === "BUY_CANDIDATE").length;
  const trimCount = candidates.filter((item) => item.candidateStatus === "SELL_TRIM").length;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="card stat-cell">
        <div className="stat-label">모델 버전</div>
        <div className="stat-value text-base lg:text-xl">{summary?.activeVersion ?? "-"}</div>
        <div className="stat-delta">{summary?.algorithm ?? "MP_CORE"}</div>
      </div>
      <div className="card stat-cell">
        <div className="stat-label">학습 기간</div>
        <div className="stat-value text-base lg:text-xl">{formatDate(summary?.trainFrom)}</div>
        <div className="stat-delta">~ {formatDate(summary?.trainTo)}</div>
      </div>
      <div className="card stat-cell">
        <div className="stat-label">신호/데이터 기준</div>
        <div className="stat-value text-base lg:text-xl">{formatDate(summary?.latestSignalDate)}</div>
        <div className="stat-delta">데이터 {formatDate(summary?.dataFreshnessDate)}</div>
      </div>
      <div className="card stat-cell">
        <div className="stat-label">후보/현금 비중</div>
        <div className="stat-value text-base lg:text-xl">
          {buyCount}/{trimCount}
        </div>
        <div className="stat-delta">현금 {formatPctRatio(portfolio?.cashWeight)} · 백테스트 기준</div>
      </div>
      <div className="card stat-cell lg:col-span-2">
        <div className="stat-label">목표 월간 전환율</div>
        <div className="stat-value text-base lg:text-xl">{formatPctRatio(summary?.targetMonthlyReturn)}</div>
        <div className="stat-delta">수익률은 보장되지 않음 · 과거 검증 기준</div>
      </div>
      <div className="card stat-cell lg:col-span-2">
        <div className="stat-label">최근 백테스트 요약</div>
        <div className="stat-value text-base lg:text-xl">
          {formatPctRatio(summary?.latestBacktestSummary?.monthlyReturn)}
        </div>
        <div className="stat-delta">
          MDD {formatPctRatio(summary?.latestBacktestSummary?.mdd)} · 비용 {formatMoney(summary?.latestBacktestSummary?.totalCost)}
        </div>
      </div>
    </div>
  );
}
