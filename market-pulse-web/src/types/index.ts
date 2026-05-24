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

// ── 퀀트 백테스팅 ──

export interface QuantStrategy {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  assetType: "INDEX" | "STOCK" | "MULTI";
  rebalanceCycle: "SIGNAL" | "MONTHLY" | "QUARTERLY" | "DAILY";
  params: Record<string, unknown>;
}

export interface EquityPoint {
  date: string;
  value: number;
  returnPct: number;
}

export interface PerformanceSummary {
  totalReturn: number;
  annualizedReturn: number;
  monthlyReturn: number;
  targetMonthlyReturn: number;
  finalValue: number;
  profitAmount: number;
  initialToNowReturn: number;
  mdd: number;
  sharpeRatio: number;
  totalTrades: number;
  winRate: number;
}

export interface AllocationItem {
  assetName: string;
  weight: number;
}

export interface BacktestResult {
  strategyId: number;
  strategyName: string;
  from: string;
  to: string;
  initialCash: number;
  performance: PerformanceSummary;
  equityCurve: EquityPoint[];
  currentAllocation: AllocationItem[];
}

export interface StrategyComparison {
  strategyId: number;
  strategyName: string;
  totalReturn: number;
  mdd: number;
  sharpeRatio: number;
  equityCurve: EquityPoint[];
}

export interface PerformanceResponse {
  from: string;
  to: string;
  benchmark: EquityPoint[];
  kosdaqBenchmark: EquityPoint[];
  strategies: StrategyComparison[];
}

export interface TradeLog {
  id: number;
  tradeDate: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  tradeType: "BUY" | "SELL";
  price: number;
  quantity: number;
  amount: number;
  weight: number;
  reason: string;
  commission: number;
  tax: number;
}

export interface TradeLogPage {
  total: number;
  page: number;
  size: number;
  items: TradeLog[];
}

export type QuantExperimentStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";

export type QuantBiasCheckStatus = "PASS" | "FAIL";

export interface QuantExperimentWindow {
  id?: number;
  variantId?: number;
  windowNo: number;
  trainFrom: string;
  trainTo: string;
  validationFrom: string;
  validationTo: string;
  testFrom: string;
  testTo: string;
  validationMonthlyReturn: number;
  testMonthlyReturn: number;
  validationMdd: number;
  testMdd: number;
}

export interface QuantExperimentVariant {
  id: number;
  runId: number;
  variantCode: string;
  params: Record<string, unknown>;
  totalReturn: number;
  annualizedReturn: number;
  monthlyReturn: number;
  mdd: number;
  sharpeRatio: number;
  turnover: number;
  totalCost: number;
  targetAchieved: boolean;
  biasCheckStatus: QuantBiasCheckStatus;
  overfitScore: number;
  promoted: boolean;
  equityCurve?: EquityPoint[];
}

export interface QuantExperimentRun {
  id: number;
  strategyNameEn: string;
  from: string;
  to: string;
  status: QuantExperimentStatus;
  targetMonthlyReturn: number;
  targetIsGuarantee: boolean;
  variants: QuantExperimentVariant[];
  windows: QuantExperimentWindow[];
  message?: string;
}

export interface QuantExperimentRunList {
  runs: QuantExperimentRun[];
}

// ── MP_CORE 퀀트 대시보드 ──

export type QuantCandidateStatus =
  | "HOLDING"
  | "BUY_CANDIDATE"
  | "WATCHLIST"
  | "BLOCKED"
  | "SELL_TRIM";

export type QuantCandidateStatusFilter = "ALL" | QuantCandidateStatus;

export type QuantNextAction =
  | "BUY"
  | "BUY_ON_REBALANCE"
  | "HOLD"
  | "WATCH"
  | "BLOCK"
  | "SELL"
  | "TRIM";

export type QuantRebalanceStatus =
  | "PENDING"
  | "SCHEDULED"
  | "EXECUTED"
  | "SKIPPED"
  | "BLOCKED";

export interface QuantBacktestMetric {
  monthlyReturn: number;
  mdd: number;
  sharpe: number;
  winRate: number;
  totalCost: number;
}

export interface QuantCoreSummary {
  modelCode: string;
  modelName: string;
  activeVersion: string;
  algorithm: string;
  trainFrom: string;
  trainTo: string;
  latestSignalDate: string;
  dataFreshnessDate: string;
  targetMonthlyReturn: number;
  targetIsGuarantee: boolean;
  latestBacktestSummary: QuantBacktestMetric | null;
}

export interface QuantCoreSignal {
  rank: number;
  assetCode: string;
  assetName: string;
  market: string;
  sector: string;
  winnerProb: number;
  neutralProb: number;
  loserProb: number;
  score: number;
  targetWeight: number;
  reason: Record<string, unknown>;
  riskFlags: string[];
}

export interface QuantCandidateSignal {
  candidateStatus: QuantCandidateStatus;
  rank: number;
  assetCode: string;
  assetName: string;
  market: string;
  sector: string;
  winnerProb: number;
  score: number;
  currentWeight: number;
  targetWeight: number;
  signalState?: string;
  rebalanceStatus: QuantRebalanceStatus;
  nextAction: QuantNextAction | string;
  rebalanceDate: string;
  thresholdDistance: number;
  triggerConditions: string[];
  blockers: string[];
  riskFlags: string[];
  factorScores: Record<string, number>;
  reasonChips: string[];
}

export interface QuantFactorScoreItem {
  factor: string;
  label: string;
  score: number;
  contribution: number;
  direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | string;
}

export interface QuantTriggerCondition {
  type: string;
  label: string;
  threshold: string;
  currentValue: string;
  passed: boolean;
}

export interface QuantSignalHistoryItem {
  signalDate: string;
  candidateStatus: QuantCandidateStatus;
  score: number;
  targetWeight: number;
  nextAction: string;
}

export interface QuantCandidateDetail {
  candidate: QuantCandidateSignal;
  factorBreakdown: QuantFactorScoreItem[];
  reasonChips: string[];
  triggerConditions: QuantTriggerCondition[];
  signalHistory: QuantSignalHistoryItem[];
}

export interface QuantPortfolioHolding {
  assetCode: string;
  assetName: string;
  market: string;
  sector: string;
  targetWeight: number;
  targetAmount?: number;
  targetShares?: number;
  modelScore?: number;
  riskAdjustment?: number;
}

export interface QuantPortfolioTarget {
  date?: string;
  rebalanceDate?: string;
  signalDate?: string;
  executionDate?: string;
  cashWeight: number;
  positions: QuantPortfolioHolding[];
  marketWeights: Record<string, number>;
  sectorWeights: Record<string, number>;
  constraintViolations: string[];
}

export interface QuantBacktestPoint {
  date: string;
  grossEquity?: number;
  netEquity: number;
  drawdown?: number;
  monthlyReturn?: number;
}

export interface QuantMonthlyReturn {
  year: number;
  month: number;
  returnPct: number;
}

export interface QuantCostSummary {
  grossReturn: number;
  netReturn: number;
  totalFee: number;
  totalTax: number;
  totalTurnover: number;
  avgTurnover: number;
  totalCost: number;
  tradeCount: number;
}

export interface QuantBacktestEvidence {
  runId: number;
  modelCode?: string;
  from?: string;
  to?: string;
  monthlyReturn: number;
  mdd: number;
  sharpe: number;
  winRate: number;
  totalCost: number;
  metrics?: QuantBacktestMetric;
  equityCurve: QuantBacktestPoint[];
  drawdownCurve: QuantBacktestPoint[];
  monthlyReturns: QuantMonthlyReturn[];
  costSummary: QuantCostSummary;
}

export interface QuantDiagnostics {
  featureImportance: Record<string, number>;
  factorCorrelation: Record<string, number>;
  sectorExposure: Record<string, number>;
  classDistribution: Record<string, number>;
}
