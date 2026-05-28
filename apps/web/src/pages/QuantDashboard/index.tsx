import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/services/apiClient";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface LiveQuantModelSummary {
  modelCode: string;
  modelVersion?: string | null;
  configKey?: string | null;
  modelName: string;
  status: string;
  seedMoney: number;
  totalReturnPct: number;
  totalProfit: number;
  monthlyReturnPct: number;
  openPositionCount: number;
  rawCandidateCountToday: number;
  actualEntryCountToday: number;
  latestReportTime: string | null;
}

interface LiveQuantPosition {
  assetCode: string;
  assetName: string;
  entryTime: string;
  fillPrice: number | null;
  currentPrice: number | null;
  unrealizedReturnPct: number | null;
  expectedReturnPct: number | null;
  exitRule: string;
}

interface LiveQuantCandidate {
  assetCode: string;
  assetName: string;
  candidateType: string;
  decision: string;
  reason: string;
  signalPrice: number | null;
  expectedReturnPct: number | null;
}

interface LiveQuantTrade {
  tradeId: number;
  assetCode: string;
  assetName: string;
  side: string;
  fillTime: string;
  signalPrice: number | null;
  observedPrice: number | null;
  fillPrice: number | null;
  fillSource: string;
  slippageAssumptionPct: number;
  realizedReturnPct?: number | null;
  modelReason: string;
}

interface LiveQuantExitPlan {
  assetCode: string;
  assetName: string;
  checkpointTime: string;
  exitCondition: string;
  stopLossPct: number;
  trailingStopPct: number;
  expectedReturnPct: number;
}

interface OutcomeCheckpoint {
  horizon: string;
  checkpointDate: string;
  decisionPrice: number | null;
  horizonClosePrice: number | null;
  forwardReturnPct: number | null;
  missedUpsidePct: number | null;
  avoidedDownsidePct: number | null;
  quality: string;
  analysisText: string;
}

interface WatchedAsset {
  watchId: number;
  modelCode: string;
  assetCode: string;
  assetName: string;
  trackingSource: string;
  originalDecisionType: string;
  originalModelReason: string;
  decisionPrice: number | null;
  checkpoints: OutcomeCheckpoint[];
}

interface LearningFeedback {
  modelCode: string;
  feedbackType: string;
  evidence: string;
  recommendation: string;
  status: string;
}

interface LiveQuantModelDetail {
  summary: LiveQuantModelSummary;
  positions: LiveQuantPosition[];
  candidates: LiveQuantCandidate[];
  trades: LiveQuantTrade[];
  exitPlans: LiveQuantExitPlan[];
  watchedAssets: WatchedAsset[];
  learningFeedback: LearningFeedback[];
}

interface CheckpointAnalysis {
  modelCode: string;
  assetCode: string;
  assetName: string;
  trackingSource: string;
  horizon: string;
  analysisText: string;
}

interface ReportSummary {
  reportId: number;
  reportDate: string;
  period: string;
  modelCode: string;
  title: string;
  totalReturnPct: number;
  entryCount: number;
  exitCount: number;
  warningCount: number;
  generatedAt: string;
}

interface ReportSection {
  title: string;
  body: string;
}

interface ReportDetail {
  reportId: number;
  reportDate: string;
  period: string;
  modelCode: string;
  title: string;
  generatedBy: string;
  summaryText: string;
  sections: ReportSection[];
  checkpointAnalyses: CheckpointAnalysis[];
  learningFeedback: LearningFeedback[];
}

type DetailTab = "summary" | "positions" | "candidates" | "trades" | "exitPlans" | "learning";
type ReportPeriodFilter = "ALL" | "WEEKLY" | "DAILY";

const DETAIL_TABS: Array<{ value: DetailTab; label: string }> = [
  { value: "summary", label: "요약" },
  { value: "positions", label: "보유" },
  { value: "candidates", label: "후보" },
  { value: "trades", label: "매매" },
  { value: "exitPlans", label: "청산" },
  { value: "learning", label: "학습" },
];

const REPORT_PERIOD_FILTERS: Array<{ value: ReportPeriodFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "WEEKLY", label: "주간" },
  { value: "DAILY", label: "일간" },
];

const STATUS_LABEL: Record<string, string> = {
  RUNNING: "실행중",
  SERVICE_PREPARING: "서비스 준비중",
  WATCHING: "관찰",
  BLOCKED: "차단",
  MARKET_CLOSED: "장 종료",
  DATA_DELAYED: "데이터 지연",
  ERROR: "오류",
};

function dataOf<T>(response: { data: ApiResponse<T> }) {
  return response.data.data;
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function pct(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function latestDate(values: string[]) {
  const dates = values.map((value) => new Date(value)).filter((date) => !Number.isNaN(date.getTime()));
  if (dates.length === 0) return null;
  return dates.sort((a, b) => b.getTime() - a.getTime())[0];
}

function sameMonth(value: string, date: Date) {
  const target = new Date(value);
  return !Number.isNaN(target.getTime())
    && target.getFullYear() === date.getFullYear()
    && target.getMonth() === date.getMonth();
}

function yesterdayBasicDate() {
  const target = new Date();
  target.setDate(target.getDate() - 1);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function formatReportDate(value: string) {
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
  }
  const weekly = value.match(/^(\d{4})W(\d{2})$/);
  if (weekly) {
    const monday = isoWeekStart(Number(weekly[1]), Number(weekly[2]));
    return formatDateDot(monday);
  }
  return value;
}

function compareDateTimeDesc(a: string, b: string) {
  return new Date(b).getTime() - new Date(a).getTime();
}

function isoWeekStart(year: number, week: number) {
  const fourthJan = new Date(Date.UTC(year, 0, 4));
  const fourthJanDay = fourthJan.getUTCDay() || 7;
  const weekOneMonday = new Date(fourthJan);
  weekOneMonday.setUTCDate(fourthJan.getUTCDate() - fourthJanDay + 1);
  const target = new Date(weekOneMonday);
  target.setUTCDate(weekOneMonday.getUTCDate() + (week - 1) * 7);
  return target;
}

function formatDateDot(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function paginationPages(page: number, totalPages: number) {
  const maxVisible = 5;
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const half = Math.floor(maxVisible / 2);
  const start = Math.max(1, Math.min(page - half, totalPages - maxVisible + 1));
  return Array.from({ length: maxVisible }, (_, index) => start + index);
}

function sortReports(reports: ReportSummary[]) {
  return [...reports].sort((a, b) => {
    const generatedDiff = new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
    if (Number.isFinite(generatedDiff) && generatedDiff !== 0) return generatedDiff;
    return b.reportDate.localeCompare(a.reportDate);
  });
}

function statusTone(status: string) {
  if (status === "RUNNING") return "text-[var(--up)] border-[var(--up)] bg-[var(--up-soft)]";
  if (status === "BLOCKED" || status === "ERROR") return "text-[var(--down)] border-[var(--down)] bg-[var(--down-soft)]";
  return "text-[var(--text-2)] border-[var(--border)] bg-[var(--bg-alt)]";
}

function sourceLabel(source: string) {
  if (source === "TRADE_EXIT") return "청산 종목";
  if (source === "ENTRY_REJECTED") return "미진입 후보";
  if (source === "WATCHLIST_ONLY") return "관심종목";
  if (source === "REENTRY_WATCH") return "재진입 관찰";
  return source;
}

export function QuantDashboard() {
  const { modelCode } = useParams();
  return modelCode ? <QuantModelDetailPage modelCode={modelCode} /> : <QuantModelListPage />;
}

export function QuantReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [period, setPeriod] = useState<ReportPeriodFilter>("ALL");
  const [modelCode, setModelCode] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [assetQuery, setAssetQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const periods = period === "ALL" ? ["WEEKLY", "DAILY"] : [period];
        const responses = await Promise.all(
          periods.map((reportPeriod) => apiClient.get<ApiResponse<ReportSummary[]>>("/quant/live/reports", {
            params: { period: reportPeriod, modelCode: modelCode || undefined },
          }))
        );
        const nextReports = responses.flatMap((response) => dataOf(response) ?? []);
        setReports(sortReports(nextReports));
        setPage(1);
      } catch {
        setError("리포트 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period, modelCode]);

  const visibleReports = reports.filter((report) => {
    if (reportDate && report.reportDate !== reportDate.replaceAll("-", "")) return false;
    if (assetQuery.trim()) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(visibleReports.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedReports = visibleReports.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="stack pb-20 lg:pb-0">
      <section className="space-y-2">
        <h1 className="m-0 text-xl font-bold">리포트</h1>
        <p className="m-0 text-sm text-[var(--text-3)]">
          장 종료 후 생성된 모델 리포트를 구분, 모델, 작성일 기준으로 필터링합니다.
        </p>
      </section>

      {error && <div className="card border-[var(--up)] text-[var(--up)]">{error}</div>}

      <section className="card">
        <div className="card-head">
          <div className="card-title">리포트 필터</div>
          <span className="tag">주간 / 일간</span>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <div className="flex shrink-0 flex-col gap-1.5">
              <span style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                리포트 구분
              </span>
              <div className="chips">
                {REPORT_PERIOD_FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="chip"
                    aria-pressed={period === option.value}
                    onClick={() => {
                      setPeriod(option.value);
                      setPage(1);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(180px,240px)_minmax(160px,220px)_minmax(180px,1fr)_minmax(120px,160px)]">
          <label className="text-sm">
            <span className="stat-label">모델</span>
            <select className="mt-1 w-full" value={modelCode} onChange={(event) => setModelCode(event.target.value)}>
              <option value="">전체</option>
              <option value="INDEX_REGIME">지수 감지 모델</option>
              <option value="BULL_V4">Bull v4 모델</option>
              <option value="SIDEWAYS_MODEL">횡보장 모델</option>
              <option value="BEAR_MODEL">하락장 모델</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="stat-label">작성일</span>
            <input className="mt-1 w-full" type="date" value={reportDate} onChange={(event) => { setReportDate(event.target.value); setPage(1); }} />
          </label>
          <label className="text-sm">
            <span className="stat-label">종목</span>
            <input
              className="mt-1 w-full"
              value={assetQuery}
              onChange={(event) => { setAssetQuery(event.target.value); setPage(1); }}
              placeholder="체크포인트 추적 후 지원"
            />
          </label>
          <label className="text-sm">
            <span className="stat-label">표시 개수</span>
            <select
              className="mt-1 w-full"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={20}>20개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
            </select>
          </label>
          </div>
        </div>
        {assetQuery.trim() && (
          <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] p-3 text-sm text-[var(--text-3)]">
            종목별 검색은 리포트 체크포인트에 종목 코드와 종목명이 누적되면 정확하게 활성화합니다.
          </div>
        )}
      </section>

      {loading ? (
        <div className="card">리포트를 불러오는 중입니다.</div>
      ) : (
        <ReportPanel
          reports={pagedReports}
          totalCount={visibleReports.length}
          page={safePage}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onOpenReport={(reportId) => navigate("/reports/" + reportId)}
        />
      )}
    </div>
  );
}

export function QuantReportDetailPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!reportId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<ApiResponse<ReportDetail>>("/quant/live/reports/" + reportId);
        setReport(dataOf(response));
      } catch {
        setError("??? ?? ???? ???? ?????.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reportId]);

  return (
    <div className="pb-20 lg:pb-0">
      {loading && <div className="card">리포트를 불러오는 중입니다.</div>}
      {error && <div className="card border-[var(--up)] text-[var(--up)]">{error}</div>}
      {report && (
        <article className="mx-auto max-w-[1180px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)]">
          <header className="border-b border-[var(--border)] px-8 py-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">Market Pulse Quant Report</div>
                <h1 className="mt-3 m-0 text-2xl font-bold leading-tight text-[var(--text)]">{report.title}</h1>
                <p className="mt-2 m-0 text-sm text-[var(--text-3)]">
                  {reportPeriodLabel(report.period)} · {formatReportDate(report.reportDate)} · {report.modelCode}
                </p>
              </div>
              <div className="grid min-w-[260px] grid-cols-2 gap-x-5 gap-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] p-4 text-sm">
                <ReportMeta label="작성 모델" value={report.modelCode} />
                <ReportMeta label="리포트 구분" value={reportPeriodLabel(report.period)} />
                <ReportMeta label="작성 기준" value={formatReportDate(report.reportDate)} />
                <ReportMeta label="생성 방식" value={report.generatedBy} />
              </div>
            </div>
          </header>

          <section className="border-b border-[var(--border)] px-8 py-6">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-3)]">Executive Summary</div>
            <p className="mt-3 max-w-[920px] text-base leading-7 text-[var(--text-2)]">{report.summaryText}</p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ReportKpi label="Raw 후보" value={sectionValue(report, "Raw 후보")} />
              <ReportKpi label="Entry 후보" value={sectionValue(report, "실제 Entry 후보")} />
              <ReportKpi label="예상 수익률" value={sectionValue(report, "예상 수익률")} />
              <ReportKpi label="위험 플래그" value={sectionValue(report, "위험 플래그")} />
            </div>
          </section>

          <section className="px-8 py-7">
            <div className="mb-5 flex flex-col gap-2 border-b border-[var(--border)] pb-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="m-0 text-lg font-semibold">Model Decision Review</h2>
                <p className="mt-1 m-0 text-sm text-[var(--text-3)]">모델이 남긴 후보, 진입, 청산, 위험 판단을 리포트 문장으로 정리합니다.</p>
              </div>
              <span className="text-xs text-[var(--text-3)]">RULE BASED · NO AI WRITER</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {(report.sections ?? []).map((section, index) => (
                <section key={section.title} className="grid grid-cols-1 gap-4 py-5 lg:grid-cols-[220px_1fr]">
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-3)]">SECTION {String(index + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 m-0 text-base font-semibold">{section.title}</h3>
                    <p className="mt-2 m-0 text-xs leading-5 text-[var(--text-3)]">{reportSectionNote(section.title)}</p>
                  </div>
                  <div className="text-sm leading-7 text-[var(--text-2)]">{section.body}</div>
                </section>
              ))}
            </div>
          </section>

          <section className="border-t border-[var(--border)] bg-[var(--bg-alt)] px-8 py-7">
            <div className="mb-4">
              <h2 className="m-0 text-base font-semibold">Checkpoint Evidence Log</h2>
              <p className="mt-1 m-0 text-sm text-[var(--text-3)]">본문 판단을 재검증하기 위한 종목별 원천 체크포인트입니다.</p>
            </div>
            {report.checkpointAnalyses.length === 0 ? (
              <EmptyState text="표시할 체크포인트 분석이 없습니다." />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg)]">
                <table className="w-full min-w-[820px] border-collapse text-sm">
                  <thead className="border-b border-[var(--border)] text-left text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">종목</th>
                      <th className="px-4 py-3 font-semibold">코드</th>
                      <th className="px-4 py-3 font-semibold">출처</th>
                      <th className="px-4 py-3 font-semibold">체크포인트</th>
                      <th className="px-4 py-3 font-semibold">분석 메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.checkpointAnalyses.map((analysis) => (
                      <tr key={analysis.assetCode + "-" + analysis.horizon + "-" + analysis.trackingSource} className="border-b border-[var(--border)] last:border-b-0">
                        <td className="px-4 py-4 font-semibold">{analysis.assetName}</td>
                        <td className="px-4 py-4 text-[var(--text-2)]">{analysis.assetCode}</td>
                        <td className="px-4 py-4 text-[var(--text-2)]">{sourceLabel(analysis.trackingSource)}</td>
                        <td className="px-4 py-4 text-[var(--text-2)]">{analysis.horizon}</td>
                        <td className="px-4 py-4 text-[var(--text-2)]">{analysis.analysisText}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </article>
      )}
    </div>
  );
}

function ReportMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-3)]">{label}</div>
      <div className="mt-1 font-semibold text-[var(--text)]">{value}</div>
    </div>
  );
}

function ReportKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] p-4">
      <div className="text-xs font-semibold text-[var(--text-3)]">{label}</div>
      <div className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[var(--text)]">{value}</div>
    </div>
  );
}

function reportPeriodLabel(period: string) {
  if (period === "WEEKLY") return "주간 리포트";
  if (period === "DAILY") return "일간 리포트";
  return period;
}

function sectionValue(report: ReportDetail, title: string) {
  return report.sections?.find((section) => section.title === title)?.body ?? "-";
}

function reportSectionNote(title: string) {
  if (title === "Raw 후보") return "모델이 관찰 대상으로 남긴 전체 후보군입니다.";
  if (title === "실제 Entry 후보") return "실제 진입 또는 체결 판단으로 이어진 후보입니다.";
  if (title === "진입/미진입 사유") return "조건 통과와 제외 판단을 추적합니다.";
  if (title === "보유 종목 변화") return "기간 내 포지션 변화와 청산 상태입니다.";
  if (title === "청산 조건 변화") return "EXIT 체크포인트와 손실 반복 신호를 확인합니다.";
  if (title === "예상 수익률") return "기간 내 기대 또는 실현 수익률 요약입니다.";
  if (title === "위험 플래그") return "손실, 변동성, 조건 반복 실패 신호입니다.";
  if (title === "내일 관찰 포인트") return "다음 장에서 모델이 계속 확인할 항목입니다.";
  return "모델 판단 로그에서 생성된 리포트 섹션입니다.";
}

function QuantModelListPage() {
  const navigate = useNavigate();
  const [models, setModels] = useState<LiveQuantModelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<ApiResponse<LiveQuantModelSummary[]>>("/quant/live/models");
        setModels(dataOf(response) ?? []);
      } catch {
        setError("실시간 모의매매 모델 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const indexModel = models.find((model) => model.modelCode === "INDEX_REGIME");
  const tradingModels = models.filter((model) => model.modelCode !== "INDEX_REGIME");

  return (
    <div className="stack pb-20 lg:pb-0">
      <section className="flex justify-end">
        <div className="tag w-fit">감시 주기 MVP 1분</div>
      </section>

      {error && <div className="card border-[var(--up)] text-[var(--up)]">{error}</div>}
      {loading && <div className="card">모델 데이터를 불러오는 중입니다.</div>}

      <section className="space-y-3">
        <SectionHeader title="지수 감지 모델" subtitle="시장 국면을 먼저 감지하고 매매 모델의 실행 조건을 통제합니다." />
        {indexModel ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(360px,520px)]">
            <ModelCard model={indexModel} onOpen={() => navigate(`/quant/models/${indexModel.modelCode}`)} />
          </div>
        ) : (
          !loading && <EmptyState text="지수 감지 모델을 불러오지 못했습니다." />
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader title="매매 모델" subtitle="불장, 횡보장, 하락장 모델을 선택해 상세 성과와 매매 흐름을 조회합니다." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tradingModels.map((model) => (
            <ModelCard key={model.modelCode} model={model} onOpen={() => navigate(`/quant/models/${model.modelCode}`)} />
          ))}
        </div>
        {!loading && tradingModels.length === 0 && <EmptyState text="조회 가능한 매매 모델이 없습니다." />}
      </section>
    </div>
  );
}

function QuantModelDetailPage({ modelCode }: { modelCode: string }) {
  const [detail, setDetail] = useState<LiveQuantModelDetail | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [detailTab, setDetailTab] = useState<DetailTab>("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiClient.get<ApiResponse<LiveQuantModelDetail>>("/quant/live/models/" + modelCode),
      apiClient.get<ApiResponse<ReportSummary[]>>("/quant/live/reports", { params: { modelCode } }),
      apiClient.get<ApiResponse<ReportSummary[]>>("/quant/live/reports", { params: { modelCode, period: "DAILY" } }),
    ])
      .then(([detailResponse, reportsResponse, dailyReportsResponse]) => {
        setDetail(dataOf(detailResponse));
        setReports([...(dataOf(reportsResponse) ?? []), ...(dataOf(dailyReportsResponse) ?? [])]);
      })
      .catch(() => setError("모델 상세 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [modelCode]);

  const summary = detail?.summary;
  const isPreparing = summary?.status === "SERVICE_PREPARING";

  return (
    <div className="stack pb-20 lg:pb-0">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-start gap-2">
            <div>
              <h1 className="m-0 text-xl font-bold">{summary?.modelName ?? modelCode}</h1>
              <p className="mt-2 text-sm text-[var(--text-3)]">
                {summary?.modelCode ?? modelCode}{summary?.modelVersion ? ` @ ${summary.modelVersion}` : ""} · 시드 {money(summary?.seedMoney)} · 현재 평가 시드 {money((summary?.seedMoney ?? 0) + (summary?.totalProfit ?? 0))} · 최신 리포트 {summary?.latestReportTime ?? "생성 전"}
              </p>
            </div>
            {summary && (
              <span className={["rounded-full border px-2 py-1 text-xs", statusTone(summary.status)].join(" ")}>
                {STATUS_LABEL[summary.status] ?? summary.status}
              </span>
            )}
          </div>
        </div>
      </section>

      {error && <div className="card border-[var(--up)] text-[var(--up)]">{error}</div>}
      {loading && <div className="card">상세 데이터를 불러오는 중입니다.</div>}

      {detail && (
        <>
          {isPreparing && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] p-4 text-sm text-[var(--text-3)]">
              이 모델은 서비스 준비중입니다. 실제 모델 코드와 실시간 의사결정 저장소가 연결되기 전까지 샘플 매매 데이터는 표시하지 않습니다.
            </div>
          )}

          <div className="sticky top-[var(--header-h)] z-10 -mx-4 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-2 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
            <div className="tabs overflow-x-auto">
              {DETAIL_TABS.map((tab) => (
                <button key={tab.value} type="button" className="tab min-w-[56px]" aria-selected={detailTab === tab.value} onClick={() => setDetailTab(tab.value)}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <ModelDetailContent detail={detail} tab={detailTab} reports={reports} onOpenReport={(reportId) => navigate("/reports/" + reportId)} />
        </>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="m-0 text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-[var(--text-3)]">{subtitle}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-[var(--border)] p-4 text-sm text-[var(--text-3)]">{text}</div>;
}

function ModelCard({ model, onOpen }: { model: LiveQuantModelSummary; onOpen: () => void }) {
  return (
    <button type="button" className="card text-left transition hover:border-[var(--accent)]" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="card-title truncate">{model.modelName}</div>
          <div className="mt-1 text-xs text-[var(--text-3)]">
            {model.modelCode}{model.modelVersion ? ` @ ${model.modelVersion}` : ""}
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-xs ${statusTone(model.status)}`}>
          {STATUS_LABEL[model.status] ?? model.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <MetricInline label="누적 수익률" value={pct(model.totalReturnPct)} />
        <MetricInline label="이번달" value={pct(model.monthlyReturnPct)} />
        <MetricInline label="보유" value={`${model.openPositionCount}종목`} />
        <MetricInline label="Entry" value={`${model.actualEntryCountToday}/${model.rawCandidateCountToday}`} />
      </div>

      {model.status === "SERVICE_PREPARING" && (
        <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2 text-xs text-[var(--text-3)]">
          아직 실운용 모델이 올라오지 않았습니다.
        </div>
      )}
      <div className="mt-4 text-xs font-semibold text-[var(--accent)]">상세 보기</div>
    </button>
  );
}

function ModelDetailContent({
  detail,
  tab,
  reports,
  onOpenReport,
}: {
  detail: LiveQuantModelDetail;
  tab: DetailTab;
  reports: ReportSummary[];
  onOpenReport: (reportId: number) => void;
}) {
  if (tab === "summary") {
    return <ModelSummaryDashboard detail={detail} reports={reports} onOpenReport={onOpenReport} />;
  }


  if (tab === "positions") {
    return (
      <SimpleTable
        columns={["종목", "진입", "체결가", "현재가", "평가손익", "예상", "청산 조건"]}
        rows={detail.positions.map((item) => [
          `${item.assetName} (${item.assetCode})`,
          item.entryTime,
          money(item.fillPrice),
          money(item.currentPrice),
          pct(item.unrealizedReturnPct),
          pct(item.expectedReturnPct),
          item.exitRule,
        ])}
        empty="현재 보유 종목이 없습니다."
      />
    );
  }

  if (tab === "candidates") {
    return (
      <SimpleTable
        columns={["종목", "유형", "판단", "신호가", "예상 수익률", "사유"]}
        rows={detail.candidates.map((item) => [
          `${item.assetName} (${item.assetCode})`,
          item.candidateType,
          item.decision,
          money(item.signalPrice),
          pct(item.expectedReturnPct),
          item.reason,
        ])}
        empty="오늘 후보가 없습니다."
      />
    );
  }

  if (tab === "trades") {
    return (
      <SimpleTable
        columns={["종목", "구분", "시각", "신호가", "관측가", "체결가", "체결소스", "슬리피지", "사유"]}
        rows={[...detail.trades].sort((a, b) => compareDateTimeDesc(a.fillTime, b.fillTime)).map((item) => [
          `${item.assetName} (${item.assetCode})`,
          item.side,
          item.fillTime,
          money(item.signalPrice),
          money(item.observedPrice),
          money(item.fillPrice),
          item.fillSource,
          pct(item.slippageAssumptionPct),
          item.modelReason,
        ])}
        empty="매매 내역이 없습니다."
      />
    );
  }

  if (tab === "exitPlans") {
    return (
      <SimpleTable
        columns={["종목", "체크포인트", "청산 조건", "손절", "트레일링", "예상 수익률"]}
        rows={detail.exitPlans.map((item) => [
          `${item.assetName} (${item.assetCode})`,
          item.checkpointTime,
          item.exitCondition,
          pct(item.stopLossPct),
          pct(item.trailingStopPct),
          pct(item.expectedReturnPct),
        ])}
        empty="청산 계획이 없습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      <SimpleTable
        columns={["종목", "추적 출처", "판단", "결정가", "체크포인트 분석"]}
        rows={detail.watchedAssets.map((item) => [
          `${item.assetName} (${item.assetCode})`,
          sourceLabel(item.trackingSource),
          item.originalDecisionType,
          money(item.decisionPrice),
          item.checkpoints.map((checkpoint) => `${checkpoint.horizon}: ${checkpoint.analysisText}`).join(" / "),
        ])}
        empty="추적 중인 관심 종목이 없습니다."
      />
      <SimpleTable
        columns={["피드백", "근거", "추천", "상태"]}
        rows={detail.learningFeedback.map((item) => [
          item.feedbackType,
          item.evidence,
          item.recommendation,
          item.status,
        ])}
        empty="학습 피드백 후보가 없습니다."
      />
    </div>
  );
}

function ModelSummaryDashboard({
  detail,
  reports,
  onOpenReport,
}: {
  detail: LiveQuantModelDetail;
  reports: ReportSummary[];
  onOpenReport: (reportId: number) => void;
}) {
  const currentSeed = detail.summary.seedMoney + detail.summary.totalProfit;
  const latestTradeDate = latestDate(detail.trades.map((trade) => trade.fillTime));
  const monthTrades = latestTradeDate
    ? detail.trades.filter((trade) => sameMonth(trade.fillTime, latestTradeDate))
    : detail.trades;
  const monthClosedTrades = monthTrades.filter((trade) => trade.side === "SELL");
  const monthBuyCount = monthTrades.filter((trade) => trade.side === "BUY").length;
  const monthSellCount = monthClosedTrades.length;
  const monthWinCount = monthClosedTrades.filter((trade) => (trade.realizedReturnPct ?? 0) > 0).length;
  const monthRealizedAvg = average(monthClosedTrades.map((trade) => trade.realizedReturnPct ?? null));
  const expectedAvg = average(detail.candidates.map((candidate) => candidate.expectedReturnPct));
  const yesterday = yesterdayBasicDate();
  const dailyReports = reports
    .filter((report) => report.period === "DAILY")
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  const yesterdayDailyReport = dailyReports.find((report) => report.reportDate === yesterday) ?? dailyReports[0];
  const recentCandidates = detail.candidates.slice(0, 5);
  const recentTrades = [...monthClosedTrades].sort((a, b) => compareDateTimeDesc(a.fillTime, b.fillTime)).slice(0, 5);
  const reportSummaryText = yesterdayDailyReport
    ? `${formatReportDate(yesterdayDailyReport.reportDate)} 기준 ${yesterdayDailyReport.modelCode}는 수익률 ${pct(yesterdayDailyReport.totalReturnPct)}, Entry ${yesterdayDailyReport.entryCount}건, Exit ${yesterdayDailyReport.exitCount}건으로 마감했습니다.`
    : "어제 일간 리포트가 아직 생성되지 않았습니다.";

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="시드머니" value={money(detail.summary.seedMoney)} />
        <Metric label="현재 평가 시드" value={money(currentSeed)} />
        <Metric label="누적 수익금" value={money(detail.summary.totalProfit)} />
        <Metric label="이번달 수익률" value={pct(detail.summary.monthlyReturnPct)} />
        <Metric label="이번달 매매" value={`${monthBuyCount}/${monthSellCount}`} />
        <Metric label="후보 예상 수익률" value={pct(expectedAvg)} />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <div className="card-title">리포트 요약</div>
            <div className="card-sub">어제 일간 리포트를 기준으로 핵심 결과를 정리합니다.</div>
          </div>
        </div>
        {yesterdayDailyReport ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] p-4">
              <div className="text-xs font-semibold text-[var(--text-3)]">어제 리포트 요약</div>
              <div className="mt-2 text-base font-semibold text-[var(--text)]">{reportSummaryText}</div>
              <div className="mt-2 text-sm text-[var(--text-2)]">
                경고 {yesterdayDailyReport.warningCount}건 · 생성 {yesterdayDailyReport.generatedAt.replace("T", " ")}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricInline label="작성일" value={formatReportDate(yesterdayDailyReport.reportDate)} />
              <MetricInline label="작성 모델" value={yesterdayDailyReport.modelCode} />
              <MetricInline label="수익률" value={pct(yesterdayDailyReport.totalReturnPct)} />
              <MetricInline label="Entry / Exit" value={`${yesterdayDailyReport.entryCount} / ${yesterdayDailyReport.exitCount}`} />
            </div>
            <div className="lg:col-span-2">
              <button type="button" className="btn sm" onClick={() => onOpenReport(yesterdayDailyReport.reportId)}>
                어제 리포트 열기
              </button>
            </div>
          </div>
        ) : (
          <EmptyState text="어제 일간 리포트가 없습니다." />
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">이번달 매매 요약</div>
              <div className="card-sub">최근 리플레이/실매매 로그 기준 체결과 청산 흐름입니다.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricInline label="매수" value={`${monthBuyCount}건`} />
            <MetricInline label="청산" value={`${monthSellCount}건`} />
            <MetricInline label="수익 청산" value={`${monthWinCount}건`} />
            <MetricInline label="평균 청산 수익률" value={pct(monthRealizedAvg)} />
          </div>
          <div className="mt-4">
            <SimpleTable
              columns={["종목", "청산 시각", "체결가", "실현 수익률"]}
              rows={recentTrades.map((trade) => [
                `${trade.assetName} (${trade.assetCode})`,
                trade.fillTime,
                money(trade.fillPrice),
                pct(trade.realizedReturnPct),
              ])}
              empty="이번달 청산 매매가 없습니다."
            />
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">이번주 후보</div>
              <div className="card-sub">최근 모델 후보와 예상 수익률입니다.</div>
            </div>
          </div>
          <SimpleTable
            columns={["종목", "판단", "신호가", "예상 수익률"]}
            rows={recentCandidates.map((candidate) => [
              `${candidate.assetName} (${candidate.assetCode})`,
              candidate.decision,
              money(candidate.signalPrice),
              pct(candidate.expectedReturnPct),
            ])}
            empty="이번주 후보가 없습니다."
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">운용 메모</div>
              <div className="card-sub">청산 계획과 학습 피드백을 요약합니다.</div>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-[var(--border)] p-3">
              <div className="font-semibold">다음 청산 관찰</div>
              <div className="mt-1 text-[var(--text-2)]">
                {detail.exitPlans[0]
                  ? `${detail.exitPlans[0].assetName} · ${detail.exitPlans[0].checkpointTime} · ${detail.exitPlans[0].exitCondition}`
                  : "등록된 청산 계획이 없습니다."}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3">
              <div className="font-semibold">학습 피드백</div>
              <div className="mt-1 text-[var(--text-2)]">
                {detail.learningFeedback[0]?.evidence ?? "아직 누적된 학습 피드백이 없습니다."}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReportPanel({
  reports,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onOpenReport,
}: {
  reports: ReportSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenReport: (reportId: number) => void;
}) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const pageNumbers = paginationPages(page, totalPages);

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="card-title">리포트</div>
          <div className="card-sub">장 종료 후 생성된 규칙 기반 주간/일간 리포트입니다.</div>
        </div>
        <div className="text-sm text-[var(--text-3)]">
          {from}-{to} / {totalCount}
        </div>
      </div>

      {reports.length === 0 ? (
        <EmptyState text="아직 생성된 리포트가 없습니다." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="t w-full min-w-[760px]">
            <thead>
              <tr>
                <th>제목</th>
                <th>작성일</th>
                <th>작성 모델</th>
                <th>구분</th>
                <th>수익률</th>
                <th>Entry/Exit</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.reportId} className="clickable" onClick={() => onOpenReport(report.reportId)}>
                  <td className="font-semibold">{report.title}</td>
                  <td className="num text-[var(--text-2)]">{formatReportDate(report.reportDate)}</td>
                  <td className="text-[var(--text-2)]">{report.modelCode}</td>
                  <td className="text-[var(--text-2)]">{reportPeriodLabel(report.period)}</td>
                  <td className="num font-semibold">{pct(report.totalReturnPct)}</td>
                  <td className="num text-[var(--text-2)]">{report.entryCount}/{report.exitCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-col items-center justify-center gap-3">
        <div className="text-sm text-[var(--text-3)]">페이지 {page} / {totalPages}</div>
        <div className="flex flex-wrap items-center justify-center gap-1 text-sm">
          <button type="button" className="btn sm ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>이전</button>
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={["btn sm min-w-8", pageNumber === page ? "primary" : "ghost"].join(" ")}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button type="button" className="btn sm ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>다음</button>
        </div>
      </div>
    </section>
  );
}

function MetricInline({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] p-4">
      <div className="stat-label">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

function SimpleTable({ columns, rows, empty }: { columns: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) {
    return <div className="rounded-lg border border-[var(--border)] p-4 text-sm text-[var(--text-3)]">{empty}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2 text-left font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} className="border-b border-[var(--border)] px-3 py-2 align-top text-[var(--text-2)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
