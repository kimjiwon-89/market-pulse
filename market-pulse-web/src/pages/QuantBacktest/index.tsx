import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/services/apiClient";
import type { BacktestResult, PerformanceResponse, QuantStrategy } from "@/types";
import { DateRangePicker } from "./DateRangePicker";
import { StrategyTabs } from "./StrategyTabs";
import { EquityChart } from "./EquityChart";
import { PerformanceCards } from "./PerformanceCards";
import { AllocationChart } from "./AllocationChart";
import { TradeTimeline } from "./TradeTimeline";
import { ExperimentPanel } from "./ExperimentPanel";

const DEFAULT_INITIAL_CASH = 100_000_000;

function today() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

function yearsAgo(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10).replaceAll("-", "");
}

export function QuantBacktest() {
  const [strategies, setStrategies] = useState<QuantStrategy[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<number | null>(null);
  const [from, setFrom] = useState(yearsAgo(5));
  const [to, setTo] = useState(today());
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [performanceResult, setPerformanceResult] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get("/quant/strategies")
      .then(res => setStrategies(res.data.data ?? []))
      .catch(() => setError("전략 목록을 불러올 수 없습니다."));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    if (activeStrategyId === null) {
      setBacktestResult(null);
      apiClient.get("/quant/performance", { params: { from, to } })
        .then(res => setPerformanceResult(res.data.data))
        .catch(() => setError("전략 비교 데이터를 불러올 수 없습니다."))
        .finally(() => setLoading(false));
      return;
    }
    setPerformanceResult(null);
    apiClient.get("/quant/backtest", { params: { strategyId: activeStrategyId, from, to, initialCash: DEFAULT_INITIAL_CASH } })
      .then(res => setBacktestResult(res.data.data))
      .catch(() => setError("백테스팅 결과를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [activeStrategyId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const activePerformance = useMemo(() => backtestResult?.performance ?? null, [backtestResult]);

  return (
    <div className="stack" style={{ padding: "var(--pad-pg)" }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>퀀트 백테스팅</h1>
        <p style={{ margin: "4px 0 0", color: "var(--text-3)", fontSize: 13 }}>
          KRX 히스토리컬 데이터 기반 전략 성과 비교
        </p>
      </div>

      <DateRangePicker from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }} />
      <StrategyTabs strategies={strategies} activeId={activeStrategyId} onSelect={setActiveStrategyId} />

      {error && (
        <div className="card" style={{ color: "var(--up)" }}>{error}</div>
      )}

      <div className="card">
        <div className="card-head">
          <div className="card-title">{activeStrategyId === null ? "전략 비교" : backtestResult?.strategyName ?? "개별 전략"}</div>
        </div>
        <EquityChart performance={performanceResult} backtest={backtestResult} loading={loading} />
      </div>

      {activeStrategyId !== null && (
        <PerformanceCards
          performance={activePerformance}
          initialCash={backtestResult?.initialCash ?? DEFAULT_INITIAL_CASH}
          loading={loading}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">
        <TradeTimeline strategyId={activeStrategyId} from={from} to={to} />
        <AllocationChart allocation={backtestResult?.currentAllocation ?? []} />
      </div>

      <ExperimentPanel strategies={strategies} activeStrategyId={activeStrategyId} from={from} to={to} />
    </div>
  );
}
