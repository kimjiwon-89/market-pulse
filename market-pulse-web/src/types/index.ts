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
