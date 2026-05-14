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
