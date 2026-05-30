import { apiClient } from "@/services/apiClient";
import { mockNews } from "@/features/mock/marketMockData";
import type {
  QuantDecision,
  QuantHomeSummary,
  QuantHotStockItem,
  QuantKpi,
  QuantMarketOverviewItem,
  QuantModelDetail,
  QuantModelCategory,
  QuantModelLabel,
  QuantModelSummary,
  QuantNewsItem,
  QuantReportDetail,
  QuantReportSummary,
  StockBadgeTone,
} from "./types";

const BULL_MODEL_CODE = "BULL_V4";
const BULL_MODEL_NAME = "Bull v4 모델";
const BULL_PAPER_SEED_MONEY = 100_000_000;

const fallbackBullModel: LiveModelSummaryDto = {
  modelCode: BULL_MODEL_CODE,
  modelName: BULL_MODEL_NAME,
  status: "SERVICE_CHECK",
  seedMoney: BULL_PAPER_SEED_MONEY,
  totalReturnPct: 0,
  totalProfit: 0,
  monthlyReturnPct: 0,
  openPositionCount: 0,
  rawCandidateCountToday: 0,
  actualEntryCountToday: 0,
};

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
}

interface LiveModelSummaryDto {
  modelCode: string;
  modelVersion?: string;
  modelName?: string;
  status?: string;
  seedMoney?: number;
  totalReturnPct?: number;
  totalProfit?: number;
  monthlyReturnPct?: number;
  openPositionCount?: number;
  rawCandidateCountToday?: number;
  actualEntryCountToday?: number;
  latestReportTime?: string;
  category?: QuantModelCategory;
  modelCategory?: QuantModelCategory;
}

interface LiveCandidateDto {
  assetCode: string;
  assetName: string;
  candidateType?: string;
  decision?: string;
  reason?: string;
  signalPrice?: number;
  expectedReturnPct?: number;
}

interface LiveReportSummaryDto {
  reportId: number | string;
  reportDate?: string;
  period?: string;
  modelCode: string;
  title?: string;
  totalReturnPct?: number;
  entryCount?: number;
  exitCount?: number;
  warningCount?: number;
  generatedAt?: string;
}

interface LiveReportDetailDto extends LiveReportSummaryDto {
  generatedBy?: string;
  summaryText?: string;
  sections?: unknown[];
  checkpointAnalyses?: unknown[];
  learningFeedback?: unknown[];
}

interface LiveModelDetailDto {
  candidates?: LiveCandidateDto[];
  trades?: LiveTradeDto[];
}

interface LiveTradeDto {
  tradeId: number | string;
  assetCode: string;
  assetName: string;
  side: string;
  fillTime?: string;
  fillPrice?: number;
  realizedReturnPct?: number;
  modelReason?: string;
}

interface NewsDto {
  cntt_usiq_srno?: string;
  data_dt?: string;
  data_tm?: string;
  hts_pbnt_titl_cntt?: string;
  dorg?: string;
}

interface IndexResponseDto {
  output1?: {
    bstp_nmix_prdy_ctrt?: string;
    bstp_nmix_prdy_vrss?: string;
    bstp_nmix_prpr?: string;
  };
}

async function getData<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<ApiResponse<T> | T>(path, { params });
  const body = response.data;

  if (body && typeof body === "object" && "success" in body && "data" in body) {
    const wrapped = body as ApiResponse<T>;
    if (!wrapped.success) {
      throw new Error(wrapped.message ?? "API 요청이 실패했습니다.");
    }
    return wrapped.data;
  }

  return body as T;
}

function formatDateTime(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPct(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function parseNumber(value?: string | number) {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toneFromCode(code: string): StockBadgeTone {
  const tones: StockBadgeTone[] = ["red", "blue", "navy", "purple", "black"];
  const sum = [...code].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[sum % tones.length];
}

function mapModel(dto: LiveModelSummaryDto): QuantModelSummary {
  const code = dto.modelCode || BULL_MODEL_CODE;
  const name = dto.modelName || (code === BULL_MODEL_CODE ? BULL_MODEL_NAME : code);
  const category = dto.category ?? dto.modelCategory ?? "상승장";
  const marketMode: QuantModelLabel = category === "하락장" ? "하락장 모델" : category === "횡보장" ? "횡보장 모델" : "상승장 모델";
  const status = dto.status === "RUNNING" ? "정상 운영" : dto.status === "DATA_DELAYED" ? "관찰 중" : "관리자 점검";
  const signalStrength = (dto.actualEntryCountToday ?? 0) > 0 ? "높음" : (dto.rawCandidateCountToday ?? 0) > 0 ? "보통" : "낮음";
  const seedMoney = dto.seedMoney ?? BULL_PAPER_SEED_MONEY;
  const totalProfit = dto.totalProfit ?? 0;
  const totalReturnPct = dto.totalReturnPct ?? (seedMoney > 0 ? (totalProfit / seedMoney) * 100 : 0);

  return {
    code,
    name,
    plainName: code === BULL_MODEL_CODE ? "상승장 리플레이 기반 종목 신호" : `${name} 후보 신호`,
    description: code === BULL_MODEL_CODE
      ? "승률보다 손익비와 체크포인트를 함께 보는 Bull v4 운영 모델입니다."
      : `${name} 모델이 선별한 후보 종목입니다.`,
    category,
    marketMode,
    status,
    signalStrength,
    focus: ["Bull v4", "리플레이 검증", "위험 체크포인트"],
    todayCount: dto.rawCandidateCountToday ?? dto.actualEntryCountToday ?? dto.openPositionCount ?? 0,
    seedMoney,
    totalReturnPct,
    totalProfit,
    currentCapital: seedMoney + totalProfit,
    monthlyReturnPct: dto.monthlyReturnPct ?? 0,
    monthlyMarketRegime: "BULL",
  };
}

function mapDecision(dto: LiveCandidateDto, model: QuantModelSummary = mapModel(fallbackBullModel)): QuantDecision {
  const warning = (dto.expectedReturnPct ?? 0) < 0 || dto.decision === "WARNING";

  return {
    assetCode: dto.assetCode,
    assetName: dto.assetName,
    badgeText: dto.assetName.slice(0, 1),
    badgeTone: toneFromCode(dto.assetCode),
    modelNames: [model.name],
    modelLabel: model.marketMode,
    decisionLabel: warning ? "조심할 종목" : "살펴볼 종목",
    decisionCode: warning ? "WARNING" : "BUY",
    reasonBullets: [dto.reason || dto.candidateType || "Bull v4 후보로 선별됨"],
    cautionBullets: [
      dto.signalPrice ? `신호가 ${dto.signalPrice.toLocaleString("ko-KR")}원 기준 확인` : "실시간 체결 판단은 별도 확인",
      dto.expectedReturnPct !== undefined ? `기대 수익률 ${formatPct(dto.expectedReturnPct)}` : "리플레이 기반 후보",
    ],
  };
}

function mapReport(dto: LiveReportSummaryDto): QuantReportSummary {
  return {
    id: String(dto.reportId),
    title: dto.title || `${BULL_MODEL_NAME} 리포트`,
    modelCode: BULL_MODEL_CODE,
    modelName: BULL_MODEL_NAME,
    publishedAt: formatDateTime(dto.generatedAt) ?? dto.reportDate ?? "-",
    summary: `수익률 ${formatPct(dto.totalReturnPct)} · 진입 ${dto.entryCount ?? 0}건 · 청산 ${dto.exitCount ?? 0}건`,
    keywords: [`경고 ${dto.warningCount ?? 0}건`, dto.period ?? "리포트", "Bull v4"],
  };
}

function textFromUnknown(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .filter((item) => typeof item === "string" || typeof item === "number")
      .join(" ");
  }
  return String(value);
}

function mapReportDetail(dto: LiveReportDetailDto): QuantReportDetail {
  const summary = mapReport(dto);
  const sections = (dto.sections ?? []).map(textFromUnknown).filter(Boolean);
  const checkpoints = [...(dto.checkpointAnalyses ?? []), ...(dto.learningFeedback ?? [])]
    .map(textFromUnknown)
    .filter(Boolean);

  return {
    ...summary,
    summary: dto.summaryText || summary.summary,
    sections,
    checkpoints,
  };
}

function mapModelDetail(dto: LiveModelDetailDto): QuantModelDetail {
  return {
    candidates: (dto.candidates ?? []).map((item) => ({
      assetCode: item.assetCode,
      assetName: item.assetName,
      date: "",
      label: item.decision || item.candidateType || "후보",
      reason: item.reason || "Bull v4 조건을 통과한 후보입니다.",
      price: item.signalPrice,
      returnPct: item.expectedReturnPct,
    })),
    trades: (dto.trades ?? []).map((item) => ({
      tradeId: String(item.tradeId),
      assetCode: item.assetCode,
      assetName: item.assetName,
      side: item.side,
      fillTime: item.fillTime ?? "",
      fillPrice: item.fillPrice,
      realizedReturnPct: item.realizedReturnPct,
      reason: item.modelReason || "Bull v4 replay trade",
    })),
  };
}

function mapNews(dto: NewsDto): QuantNewsItem {
  return {
    id: dto.cntt_usiq_srno || `${dto.data_dt ?? ""}-${dto.data_tm ?? ""}-${dto.hts_pbnt_titl_cntt ?? ""}`,
    title: dto.hts_pbnt_titl_cntt || "제목 없음",
    source: dto.dorg,
    publishedAt: [dto.data_dt, dto.data_tm].filter(Boolean).join(" "),
  };
}

function buildFallbackNews(): QuantNewsItem[] {
  return mockNews.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    source: item.source,
    publishedAt: item.date,
  }));
}

function regimeFromChangeRate(changeRate?: number): QuantMarketOverviewItem["regime"] {
  if (changeRate === undefined) return "SIDE";
  if (changeRate >= 1) return "BULL";
  if (changeRate <= -1) return "BEAR";
  return "SIDE";
}

function mapIndex(
  id: "kospi" | "kosdaq",
  label: "KOSPI" | "KOSDAQ",
  dto?: IndexResponseDto,
): QuantMarketOverviewItem {
  const current = dto?.output1;
  const changeRate = parseNumber(current?.bstp_nmix_prdy_ctrt);
  const changePoint = parseNumber(current?.bstp_nmix_prdy_vrss);
  const price = parseNumber(current?.bstp_nmix_prpr);
  const direction = changeRate === undefined ? "flat" : changeRate > 0 ? "up" : changeRate < 0 ? "down" : "flat";

  return {
    id,
    label,
    value: price === undefined ? "-" : price.toLocaleString("ko-KR", { maximumFractionDigits: 2 }),
    regime: regimeFromChangeRate(changeRate),
    delta: changeRate === undefined
      ? "전일 대비 -"
      : `전일 대비 ${formatPct(changeRate)}${changePoint !== undefined ? ` / ${changePoint >= 0 ? "+" : ""}${changePoint.toFixed(2)}` : ""}`,
    direction,
  };
}

function buildHotStocks(): QuantHotStockItem[] {
  return [
    { id: "up-1", label: "상승률 1위", assetName: "데이터 준비 중", changeRate: "-", direction: "flat" },
    { id: "up-2", label: "상승률 2위", assetName: "데이터 준비 중", changeRate: "-", direction: "flat" },
    { id: "down-1", label: "하락률 1위", assetName: "데이터 준비 중", changeRate: "-", direction: "flat" },
    { id: "down-2", label: "하락률 2위", assetName: "데이터 준비 중", changeRate: "-", direction: "flat" },
  ];
}

function buildKpis(model: QuantModelSummary | undefined, rawModel: LiveModelSummaryDto | undefined, reports: LiveReportSummaryDto[]): QuantKpi[] {
  const latestReport = reports[0];

  return [
    {
      id: "look",
      label: "오늘 후보",
      value: `${model?.todayCount ?? 0}개`,
      hint: "Bull v4 후보 종목",
      direction: (model?.todayCount ?? 0) > 0 ? "up" : "flat",
    },
    {
      id: "caution",
      label: "경고",
      value: `${latestReport?.warningCount ?? 0}건`,
      hint: "최신 리포트 기준",
      direction: (latestReport?.warningCount ?? 0) > 0 ? "down" : "flat",
    },
    {
      id: "performance",
      label: "누적 수익률",
      value: formatPct(rawModel?.totalReturnPct),
      hint: "Bull v4 리플레이 성과",
      direction: (rawModel?.totalReturnPct ?? 0) >= 0 ? "up" : "down",
    },
    {
      id: "reports",
      label: "리포트",
      value: `${reports.length}개`,
      hint: "백엔드 생성 리포트",
      direction: reports.length > 0 ? "up" : "flat",
    },
  ];
}

export async function getQuantHomeSummary(): Promise<QuantHomeSummary> {
  const [models, reports, news, kospi, kosdaq] = await Promise.all([
    getData<LiveModelSummaryDto[]>("/quant/live/models").catch(() => []),
    getData<LiveReportSummaryDto[]>("/quant/live/reports", { modelCode: BULL_MODEL_CODE }).catch(() => []),
    getData<NewsDto[]>("/news/inquire-daily-news", { limit: 5 }).catch(() => []),
    getData<IndexResponseDto>("/index/inquire-daily-indexchartprice", { indexCode: "0001" }).catch(() => undefined),
    getData<IndexResponseDto>("/index/inquire-daily-indexchartprice", { indexCode: "1001" }).catch(() => undefined),
  ]);

  const visibleModelDtos = models.length > 0 ? models : [fallbackBullModel];
  const mappedModels = visibleModelDtos.map(mapModel);
  const allCandidates = await Promise.all(visibleModelDtos.map(async (modelDto) => {
    const model = mapModel(modelDto);
    const candidates = await getData<LiveCandidateDto[]>(`/quant/live/models/${model.code}/candidates`).catch(() => []);
    return candidates.map((item) => mapDecision(item, model));
  }));
  const decisions = allCandidates.flat();
  const bullModelDto = visibleModelDtos.find((model) => model.modelCode === BULL_MODEL_CODE) ?? fallbackBullModel;
  const bullModel = mapModel(bullModelDto);

  const mappedNews = news.map(mapNews).filter((item) => item.title !== "제목 없음");

  return {
    decisions,
    kpis: buildKpis(bullModel, bullModelDto, reports),
    models: mappedModels,
    reports: reports.map(mapReport),
    news: mappedNews.length > 0 ? mappedNews : buildFallbackNews(),
    marketOverview: [
      mapIndex("kospi", "KOSPI", kospi),
      mapIndex("kosdaq", "KOSDAQ", kosdaq),
    ],
    hotStocks: buildHotStocks(),
    asOf: formatDateTime(bullModelDto?.latestReportTime),
  };
}

export async function getBullQuantModel() {
  const summary = await getQuantHomeSummary();
  return summary.models[0] ?? null;
}

export async function getBullQuantModelDetail() {
  const detail = await getData<LiveModelDetailDto>(`/quant/live/models/${BULL_MODEL_CODE}`);
  return mapModelDetail(detail);
}

export async function getBullQuantDecisions() {
  const candidates = await getData<LiveCandidateDto[]>(`/quant/live/models/${BULL_MODEL_CODE}/candidates`);
  return candidates.map((item) => mapDecision(item, mapModel(fallbackBullModel)));
}

export async function getBullQuantReports() {
  const reports = await getData<LiveReportSummaryDto[]>("/quant/live/reports", { modelCode: BULL_MODEL_CODE });
  return reports.map(mapReport);
}

export async function getBullQuantReportDetail(reportId: string) {
  const report = await getData<LiveReportDetailDto>(`/quant/live/reports/${reportId}`);
  return mapReportDetail(report);
}
