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

export interface InvestorMemo {
  id: number;
  memoDate: string;
  market: "KOSPI" | "KOSDAQ";
  content: string;
  createdAt: string;
  updatedAt: string;
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
