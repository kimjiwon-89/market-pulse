export type QuantDecisionLabel = "살펴볼 종목" | "기다릴 종목" | "조심할 종목";
export type QuantDecisionCode = "BUY" | "SELL" | "WARNING" | "SIDE";
export type QuantModelLabel = "상승장 모델" | "횡보장 모델" | "하락장 모델" | "여러 모델";
export type QuantModelCategory = "상승장" | "횡보장" | "하락장" | "기타";
export type StockBadgeTone = "red" | "blue" | "navy" | "purple" | "black";

export interface QuantKpi {
  id: string;
  label: string;
  value: string;
  hint: string;
  delta?: string;
  direction?: "up" | "down" | "flat";
}

export interface QuantDecision {
  assetCode: string;
  assetName: string;
  signalDate?: string;
  sourceType?: string;
  market?: "KOSPI" | "KOSDAQ" | "ETF";
  badgeText: string;
  badgeTone: StockBadgeTone;
  modelNames: string[];
  modelLabel: QuantModelLabel;
  decisionLabel: QuantDecisionLabel;
  decisionCode: QuantDecisionCode;
  reasonBullets: string[];
  cautionBullets: string[];
}

export interface QuantModelSummary {
  code: string;
  modelVersion?: string;
  configKey?: string;
  name: string;
  plainName: string;
  description: string;
  category: QuantModelCategory;
  marketMode: QuantModelLabel;
  status: "정상 운영" | "관찰 중" | "관리자 점검";
  signalStrength: "낮음" | "보통" | "높음";
  focus: string[];
  todayCount: number;
  seedMoney?: number;
  totalReturnPct?: number;
  totalProfit?: number;
  currentCapital?: number;
  monthlyReturnPct?: number;
  monthlyMarketRegime?: "BULL" | "SIDEWAY" | "BEAR";
}

export interface QuantReportSummary {
  id: string;
  title: string;
  modelCode: string;
  modelName: string;
  publishedAt: string;
  summary: string;
  keywords: string[];
}

export interface QuantReportDetail extends QuantReportSummary {
  sections: string[];
  checkpoints: string[];
}

export interface QuantCandidateHistoryItem {
  assetCode: string;
  assetName: string;
  date: string;
  label: string;
  reason: string;
  price?: number;
  returnPct?: number;
}

export interface QuantTradeHistoryItem {
  tradeId: string;
  assetCode: string;
  assetName: string;
  side: "BUY" | "SELL" | string;
  fillTime: string;
  entryPrice?: number;
  exitPrice?: number;
  fillPrice?: number;
  realizedReturnPct?: number;
  reason: string;
}

export interface QuantModelDetail {
  candidates: QuantCandidateHistoryItem[];
  trades: QuantTradeHistoryItem[];
}

export interface QuantNewsItem {
  id: string;
  title: string;
  source?: string;
  publishedAt?: string;
}

export type QuantMarketRegime = "BULL" | "SIDEWAYS" | "SIDE" | "BEAR" | "CRASH";

export interface QuantMarketOverviewItem {
  id: string;
  label: string;
  value: string;
  regime: QuantMarketRegime;
  delta: string;
  direction: "up" | "down" | "flat";
}

export interface QuantMarketRegimeSnapshot {
  tradeDate?: string;
  cacheDate?: string;
  liveKospi?: number;
  liveKosdaq?: number;
  kospiRegime?: QuantMarketRegime;
  kosdaqRegime?: QuantMarketRegime;
  kospiAllowedStrategy?: string;
  kosdaqAllowedStrategy?: string;
  kospiRiskBudget?: number;
  kosdaqRiskBudget?: number;
  combinedRegime?: QuantMarketRegime;
  allowedStrategy?: string;
  confidence?: number;
  riskBudget?: number;
  bullScore?: number;
  bearScore?: number;
  stressScore?: number;
  breadthMa20?: number;
  breadthMa60?: number;
  volatility20?: number;
  liquidityTrend?: number;
  updatedAt?: string;
}

export interface QuantHotStockItem {
  id: string;
  label: string;
  assetName: string;
  assetCode?: string;
  changeRate: string;
  direction: "up" | "down" | "flat";
}

export interface QuantHomeSummary {
  decisions: QuantDecision[];
  kpis: QuantKpi[];
  models: QuantModelSummary[];
  reports: QuantReportSummary[];
  news: QuantNewsItem[];
  marketOverview?: QuantMarketOverviewItem[];
  marketRegime?: QuantMarketRegimeSnapshot;
  hotStocks?: QuantHotStockItem[];
  asOf?: string;
}
