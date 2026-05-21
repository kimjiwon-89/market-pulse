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
import { apiMessage, formatDate, formatPctRatio } from "./quantTypes";

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
    if (activeTab !== "diagnostics" || diagnostics) return;
    setDiagnosticsLoading(true);
    apiClient.get<ApiResponse<QuantDiagnostics>>("/quant/core/diagnostics", { params: { date: selectedDate } })
      .then((response) => setDiagnostics(dataOf(response)))
      .catch((err) => setError(apiMessage(err, "진단 데이터를 불러올 수 없습니다.")))
      .finally(() => setDiagnosticsLoading(false));
  }, [activeTab, diagnostics, selectedDate]);

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
                  <div className="card-title">MP_CORE 실행 요약</div>
                  <div className="card-sub">신호일 {formatDate(selectedDate)} · look-ahead 방지를 위해 신호일과 체결일을 분리해 봅니다.</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="stat-cell"><div className="stat-label">보유</div><div className="stat-value text-base">{holdingCount}</div></div>
                <div className="stat-cell"><div className="stat-label">매수 후보</div><div className="stat-value text-base up">{buyCount}</div></div>
                <div className="stat-cell"><div className="stat-label">차단</div><div className="stat-value text-base down">{blockedCount}</div></div>
                <div className="stat-cell"><div className="stat-label">목표 현금</div><div className="stat-value text-base">{formatPctRatio(portfolio?.cashWeight)}</div></div>
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
