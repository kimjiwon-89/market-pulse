import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient, getRole } from "@/services/apiClient";
import type {
  QuantBacktestEvidence,
  QuantCandidateDetail,
  QuantCandidateSignal,
  QuantCandidateStatusFilter,
  QuantCoreSignal,
  QuantCoreSummary,
  QuantDiagnostics,
  QuantPortfolioTarget,
} from "@/types";
import { ModelStatusCards } from "./ModelStatusCards";
import { QuantDateSelector } from "./QuantDateSelector";
import { CandidateStatusTabs } from "./CandidateStatusTabs";
import { CandidateTable } from "./CandidateTable";
import { CandidateMobileList } from "./CandidateMobileList";
import { CandidateDrilldown } from "./CandidateDrilldown";
import { SignalTable } from "./SignalTable";
import { SignalMobileList } from "./SignalMobileList";
import { PortfolioTargetPanel } from "./PortfolioTargetPanel";
import { BacktestEvidencePanel } from "./BacktestEvidencePanel";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { RunControlPanel } from "./RunControlPanel";
import type { QuantTab } from "./quantTypes";
import {
  BEGINNER_RISK_LABEL,
  BEGINNER_STATE_LABEL,
  apiMessage,
  beginnerStateTone,
  formatDate,
  formatMoney,
  formatPctRatio,
  formatScore,
  mapBeginnerDecision,
} from "./quantTypes";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const TABS: Array<{ value: QuantTab; label: string }> = [
  { value: "overview", label: "요약" },
  { value: "candidates", label: "후보" },
  { value: "signals", label: "신호" },
  { value: "backtest", label: "백테스트" },
  { value: "diagnostics", label: "진단" },
  { value: "run-control", label: "실행" },
];

function today() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

function dataOf<T>(response: { data: ApiResponse<T> }) {
  return response.data.data;
}

function backtestCapital(backtest: QuantBacktestEvidence | null) {
  const equity = backtest?.equityCurve ?? [];
  const seed = equity[0]?.netEquity ?? null;
  const current = equity[equity.length - 1]?.netEquity ?? null;
  const profit = seed !== null && current !== null ? current - seed : null;
  return { seed, current, profit };
}

export function QuantDashboard() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState<QuantTab>("overview");
  const [candidateStatus, setCandidateStatus] = useState<QuantCandidateStatusFilter>("ALL");
  const [summary, setSummary] = useState<QuantCoreSummary | null>(null);
  const [candidates, setCandidates] = useState<QuantCandidateSignal[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<QuantCandidateDetail | null>(null);
  const [signals, setSignals] = useState<QuantCoreSignal[]>([]);
  const [portfolio, setPortfolio] = useState<QuantPortfolioTarget | null>(null);
  const [backtest, setBacktest] = useState<QuantBacktestEvidence | null>(null);
  const [diagnostics, setDiagnostics] = useState<QuantDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isAdmin = getRole() === "ADMIN";

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResponse, backtestResponse] = await Promise.all([
        apiClient.get<ApiResponse<QuantCoreSummary>>("/quant/core/summary"),
        apiClient.get<ApiResponse<QuantBacktestEvidence>>("/quant/core/backtests/latest"),
      ]);
      const nextSummary = dataOf(summaryResponse);
      setSummary(nextSummary);
      setBacktest(dataOf(backtestResponse));
      if (nextSummary?.latestSignalDate) setSelectedDate(nextSummary.latestSignalDate);
    } catch (err) {
      setError(apiMessage(err, "MP_CORE 요약 데이터를 불러올 수 없습니다."));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDateData = useCallback(async (date: string, status: QuantCandidateStatusFilter) => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const params = status === "ALL" ? { date, limit: 50 } : { date, status, limit: 50 };
      const [candidateResponse, signalResponse, portfolioResponse] = await Promise.all([
        apiClient.get<ApiResponse<QuantCandidateSignal[]>>("/quant/core/candidates", { params }),
        apiClient.get<ApiResponse<QuantCoreSignal[]>>("/quant/core/signals", { params: { date, limit: 20 } }),
        apiClient.get<ApiResponse<QuantPortfolioTarget>>("/quant/core/portfolio-target", { params: { date } }),
      ]);
      setCandidates(dataOf(candidateResponse) ?? []);
      setSignals(dataOf(signalResponse) ?? []);
      setPortfolio(dataOf(portfolioResponse));
    } catch (err) {
      setError(apiMessage(err, "MP_CORE 신호 데이터를 불러올 수 없습니다."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadDateData(selectedDate, candidateStatus);
  }, [candidateStatus, loadDateData, selectedDate]);

  useEffect(() => {
    if ((activeTab !== "diagnostics" && !showAdvanced) || diagnostics) return;
    setDiagnosticsLoading(true);
    apiClient.get<ApiResponse<QuantDiagnostics>>("/quant/core/diagnostics", { params: { date: selectedDate } })
      .then((response) => setDiagnostics(dataOf(response)))
      .catch((err) => setError(apiMessage(err, "진단 데이터를 불러올 수 없습니다.")))
      .finally(() => setDiagnosticsLoading(false));
  }, [activeTab, diagnostics, selectedDate, showAdvanced]);

  const visibleTabs = useMemo(() => TABS.filter((tab) => tab.value !== "run-control" || isAdmin), [isAdmin]);

  const openDetail = async (candidate: QuantCandidateSignal) => {
    setDetailLoading(true);
    setSelectedCandidate(null);
    try {
      const response = await apiClient.get<ApiResponse<QuantCandidateDetail>>(
        `/quant/core/candidates/${candidate.assetCode}`,
        { params: { date: selectedDate } },
      );
      setSelectedCandidate(dataOf(response));
    } catch (err) {
      setError(apiMessage(err, "후보 상세 데이터를 불러올 수 없습니다."));
    } finally {
      setDetailLoading(false);
    }
  };

  const holdingCount = candidates.filter((item) => item.candidateStatus === "HOLDING").length;
  const buyCount = candidates.filter((item) => item.candidateStatus === "BUY_CANDIDATE").length;
  const blockedCount = candidates.filter((item) => item.candidateStatus === "BLOCKED").length;
  const beginnerRows = useMemo(
    () => candidates.map((candidate) => ({ candidate, decision: mapBeginnerDecision(candidate) })),
    [candidates],
  );
  const primaryDecision = useMemo(() => {
    const risk = beginnerRows.find((item) => item.decision.state === "RISK");
    const reduce = beginnerRows.find((item) => item.decision.state === "REDUCE_SELL");
    const buy = beginnerRows.find((item) => item.decision.state === "BUYABLE");
    return risk ?? reduce ?? buy ?? beginnerRows[0] ?? null;
  }, [beginnerRows]);
  const overallRiskLevel = useMemo(() => {
    if (beginnerRows.some((item) => item.decision.riskLevel === "HIGH")) return "HIGH";
    if (beginnerRows.some((item) => item.decision.riskLevel === "MEDIUM")) return "MEDIUM";
    return "LOW";
  }, [beginnerRows]);
  const holdingGuide = beginnerRows.find((item) => item.candidate.candidateStatus === "HOLDING");
  const buyGuide = beginnerRows.find((item) => item.candidate.candidateStatus === "BUY_CANDIDATE");
  const noBuyGuide = beginnerRows.find((item) => item.decision.noBuyConditions.length > 0);
  const capital = backtestCapital(backtest);

  return (
    <div className="stack">
      <QuantDateSelector selectedDate={selectedDate} latestSignalDate={summary?.latestSignalDate} onChange={setSelectedDate} />

      {error && (
        <div className="card border-[var(--up)] text-[var(--up)]">
          {error}
        </div>
      )}

      <ModelStatusCards summary={summary} candidates={candidates} portfolio={portfolio} loading={loading} />

      <div className="tabs overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.value}
            className="tab"
            type="button"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">지금 모델 판단</div>
                  <div className="card-sub">신호일 {formatDate(selectedDate)} · 과거 결과는 참고 자료이며 앞으로의 수익을 보장하지 않습니다.</div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`tag ${primaryDecision ? beginnerStateTone(primaryDecision.decision.state) : "flat"}`}>
                      {primaryDecision ? BEGINNER_STATE_LABEL[primaryDecision.decision.state] : "관찰"}
                    </span>
                    <span className="text-xs text-[var(--text-3)]">오늘 첫 판단</span>
                  </div>
                  <div className="mt-3 text-lg font-semibold">
                    {primaryDecision?.decision.shortAction ?? "오늘은 관찰"}
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-2)]">
                    {primaryDecision?.candidate.assetName
                      ? `${primaryDecision.candidate.assetName} 기준으로 ${primaryDecision.decision.title} 판단입니다.`
                      : "후보 데이터가 들어오면 오늘 행동을 계산합니다."}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-4">
                  <div className="stat-label">위험 미터</div>
                  <div className="mt-2 flex items-center gap-2">
                    {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded-full ${
                          level === "HIGH" && overallRiskLevel === "HIGH"
                            ? "bg-[var(--up)]"
                            : level === "MEDIUM" && overallRiskLevel !== "LOW"
                              ? "bg-[var(--flat)]"
                              : level === "LOW"
                                ? "bg-[var(--accent)]"
                                : "bg-[var(--border)]"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-3 font-semibold">{BEGINNER_RISK_LABEL[overallRiskLevel]}</div>
                  <div className="mt-1 text-sm text-[var(--text-3)]">최대 하락 경험과 차단 조건을 함께 봅니다.</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="stat-cell"><div className="stat-label">보유</div><div className="stat-value text-base">{holdingCount}</div></div>
                <div className="stat-cell"><div className="stat-label">매수 후보</div><div className="stat-value text-base up">{buyCount}</div></div>
                <div className="stat-cell"><div className="stat-label">위험 후보</div><div className="stat-value text-base down">{blockedCount}</div></div>
                <div className="stat-cell"><div className="stat-label">목표 현금</div><div className="stat-value text-base">{formatPctRatio(portfolio?.cashWeight)}</div></div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="stat-cell">
                  <div className="stat-label">시드머니</div>
                  <div className="stat-value text-base">{formatMoney(capital.seed)}</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-label">현재 평가액</div>
                  <div className="stat-value text-base">{formatMoney(capital.current)}</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-label">평가 손익</div>
                  <div className={`stat-value text-base ${(capital.profit ?? 0) >= 0 ? "up" : "down"}`}>
                    {formatMoney(capital.profit)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="card">
                <div className="card-title">오늘 할 일</div>
                <div className="mt-3 space-y-2 text-sm">
                  <div><span className="font-semibold">보유 종목</span> · {holdingGuide?.decision.shortAction ?? "유지할 종목 없음"}</div>
                  <div><span className="font-semibold">관심 후보</span> · {buyGuide?.decision.shortAction ?? "오늘은 관찰"}</div>
                  <div><span className="font-semibold">위험 후보</span> · {noBuyGuide?.decision.noBuyConditions[0] ?? "특별한 차단 조건 없음"}</div>
                </div>
              </div>
              <div className="card">
                <div className="card-title">왜 그렇게 보나</div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(primaryDecision?.decision.reasons.length ? primaryDecision.decision.reasons : ["조건을 확인한 뒤 판단합니다."]).slice(0, 3).map((reason) => (
                    <span key={reason} className="tag">{reason}</span>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-title">언제 사고, 언제 안 사나</div>
                <div className="mt-3 text-sm text-[var(--text-2)]">
                  <div>언제 사는가: {buyGuide ? `${formatDate(buyGuide.candidate.rebalanceDate)}에 조건 확인` : "매수 후보 발생 시"}</div>
                  <div className="mt-2">어떤 조건이면 안 사는가: {noBuyGuide?.decision.noBuyConditions[0] ?? "차단 조건이 생기면 보류"}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-title">후보 랭킹</div>
                <CandidateStatusTabs value={candidateStatus} candidates={candidates} onChange={setCandidateStatus} />
              </div>
              <CandidateTable candidates={candidates} loading={loading} onSelect={openDetail} />
              <CandidateMobileList candidates={candidates} loading={loading} onSelect={openDetail} />
            </div>

            <div className="card">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setShowAdvanced((value) => !value)}
              >
                <div>
                  <div className="card-title">{showAdvanced ? "쉬운 보기로 돌아가기" : "고급 지표 보기"}</div>
                  <div className="card-sub">점수, 원 신호, 팩터, 백테스트, 진단 지표</div>
                </div>
                <span className="tag">{showAdvanced ? "닫기" : "열기"}</span>
              </button>
              {showAdvanced && (
                <div className="mt-5 space-y-5">
                  <div className="overflow-x-auto">
                    <table className="t">
                      <thead>
                        <tr>
                          <th>종목</th>
                          <th>signal state</th>
                          <th className="num">score</th>
                          <th className="num">winner probability</th>
                          <th>factor scores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.slice(0, 12).map((item) => (
                          <tr key={item.assetCode} className="clickable" onClick={() => openDetail(item)}>
                            <td className="ticker">{item.assetName}<div className="mono text-xs text-[var(--text-4)]">{item.assetCode}</div></td>
                            <td>{item.signalState ?? "-"}</td>
                            <td className="num">{formatScore(item.score)}</td>
                            <td className="num">{formatPctRatio(item.winnerProb)}</td>
                            <td>
                              <div className="flex max-w-[320px] flex-wrap gap-1">
                                {Object.entries(item.factorScores ?? {}).slice(0, 4).map(([key, value]) => (
                                  <span key={key} className="tag">{key}: {formatScore(value, 2)}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <BacktestEvidencePanel backtest={backtest} />
                  <DiagnosticsPanel diagnostics={diagnostics} loading={diagnosticsLoading} />
                </div>
              )}
            </div>
          </div>
          <PortfolioTargetPanel portfolio={portfolio} />
        </div>
      )}

      {activeTab === "candidates" && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">후보 상태별 랭킹</div>
            <CandidateStatusTabs value={candidateStatus} candidates={candidates} onChange={setCandidateStatus} />
          </div>
          <CandidateTable candidates={candidates} loading={loading} onSelect={openDetail} />
          <CandidateMobileList candidates={candidates} loading={loading} onSelect={openDetail} />
        </div>
      )}

      {activeTab === "signals" && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">최신 신호</div>
              <div className="card-sub">assetName, assetCode, market, sector, score, reason, riskFlags</div>
            </div>
          </div>
          <SignalTable signals={signals} loading={loading} />
          <SignalMobileList signals={signals} loading={loading} />
        </div>
      )}

      {activeTab === "backtest" && <BacktestEvidencePanel backtest={backtest} />}
      {activeTab === "diagnostics" && <DiagnosticsPanel diagnostics={diagnostics} loading={diagnosticsLoading} />}
      {activeTab === "run-control" && isAdmin && (
        <RunControlPanel selectedDate={selectedDate} onDone={() => loadDateData(selectedDate, candidateStatus)} />
      )}

      <CandidateDrilldown detail={selectedCandidate} loading={detailLoading} onClose={() => setSelectedCandidate(null)} />
    </div>
  );
}
