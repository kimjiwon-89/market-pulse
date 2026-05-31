export interface RankingItem {
  rank: number;
  name: string;
  todayAmount: string;
  todayVolume: string;
  yesterdayAmount: string;
  yesterdayVolume: string;
  weekAmount: string;
  weekVolume?: string;
}

export interface TradeTopItem {
  rank: number;
  stockCode: string;
  stockName: string;
  currentPrice: number;
  changeRate: number;
  netBuyAmount: number;
  netBuyVolume: number;
}

export type MemoSourceType = "INVESTOR_TREND" | "NET_BUY" | "STOCK_DETAIL" | "MANUAL";

export interface MemoRecord {
  id: number;
  username: string;
  memoDate: string | null;
  sourceType: MemoSourceType;
  market: "KOSPI" | "KOSDAQ" | "ALL" | null;
  stockCode: string | null;
  stockName: string | null;
  title: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ── 종목 상세 ──

export interface StockDetail {
  code: string;
  name: string;
  currentPrice: number;
  prdyVrss: number;
  prdyVrssSign: string;
  changeRate: number;
  volume: number;
  tradingValue: number;
  marketCap: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  per: number;
  pbr: number;
  weekHigh: number;
  weekLow: number;
}

export interface StockChartItem {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  changeRate: number;
}

export interface StockMinuteCandle {
  code: string;
  time: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  tradeAmount: number;
  source: "KIS_REST" | string;
}

export interface StockOrderbookLevel {
  price: number;
  volume: number;
  level: number;
}

export interface StockOrderbook {
  code: string;
  timestamp: string;
  asks: StockOrderbookLevel[];
  bids: StockOrderbookLevel[];
  expectedPrice: number;
  expectedVolume: number;
}

export interface StockDisclosure {
  code: string;
  title: string;
  filedAt: string;
  source: string;
  url: string;
}

export type StockReportLicenseStatus = "PUBLIC_LINK_ONLY" | "LICENSED" | "UNKNOWN";

export interface StockReport {
  source: string;
  title: string;
  publishedAt: string;
  url: string;
  summary: string;
  licenseStatus: StockReportLicenseStatus;
}

export interface StockInvestor {
  foreignBuy: number;
  foreignSell: number;
  foreignNet: number;
  institutionBuy: number;
  institutionSell: number;
  institutionNet: number;
  individualBuy: number;
  individualSell: number;
  individualNet: number;
}

export interface StockMasterItem {
  code: string;
  name: string;
  market: "KOSPI" | "KOSDAQ";
  sector?: string;
}

// ── 로또 분석 연구소 ──

export type LottoStrategy =
  | "MOMENTUM"
  | "SUBMARINE"
  | "NETWORK"
  | "PATTERN"
  | "AI_PICK";

export interface LottoComboResult {
  combo: number[];
  hitCount: number | null;
}

export interface LottoStrategyDto {
  strategy: LottoStrategy;
  strategyName: string;
  pool: number[];
  combos: LottoComboResult[];
  poolHitCount: number | null;
}

export interface LottoUserCombo {
  id: number;
  drawNo: number;
  numbers: number[];
  hitCount: number | null;
  createdAt: string;
}

export interface LottoAnalysisDto {
  drawNo: number;
  drawDate: string | null;
  winningNumbers: number[] | null;
  bonusNo: number | null;
  strategies: LottoStrategyDto[];
  myCombs: LottoUserCombo[];
}

export interface LottoResultDto {
  drawNo: number;
  drawDate: string;
  numbers: number[];
  bonusNo: number;
}

export interface LottoDrawHit {
  drawNo: number;
  poolHitCount: number;
  avgComboHit: number;
}

export interface LottoStatsDto {
  strategy: LottoStrategy;
  strategyName: string;
  avgPoolHit: number;
  avgComboHit: number;
  totalDraws: number;
  history: LottoDrawHit[];
}

export interface LottoComment {
  id: number;
  drawNo: number;
  username: string;
  content: string;
  imageUrl: string | null;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}
