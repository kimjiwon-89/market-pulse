import { apiClient } from "@/services/apiClient";

export type MarketStockRankingSort = "VOLUME" | "TRADE_AMOUNT" | "CHANGE_RATE_DESC" | "CHANGE_RATE_ASC";
export type InvestorType = "FOREIGN" | "INSTITUTION" | "ALL";
export type InvestorTradeType = "BUY" | "SELL";

export interface MarketIndexItem {
  code: string;
  name: string;
  value: number;
  change: number;
  changeRate: number;
  trend: number[];
}

export interface MarketStockRanking {
  rank: number;
  code: string;
  name: string;
  market?: string | null;
  sector?: string | null;
  closePrice?: number | null;
  volume: number;
  tradeAmount: number;
  changeRate: number;
  tradeDate: string;
}

export interface InvestorTradeTopItem {
  rank: number;
  code: string;
  name: string;
  amount: number;
  volume: number;
  currentPrice: number;
  changeRate: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
}

interface MarketStockRankingDto {
  rank: number;
  code?: string;
  stockCode?: string;
  name?: string;
  stockName?: string;
  market?: string | null;
  sector?: string | null;
  closePrice?: number | string | null;
  volume?: number | string | null;
  tradeAmount?: number | string | null;
  changeRate?: number | string | null;
  tradeDate?: string;
}

interface InvestorTradeTopDto {
  rank: number;
  stockCode?: string;
  stockName?: string;
  netBuyAmount?: number | string | null;
  netBuyVolume?: number | string | null;
  currentPrice?: number | string | null;
  changeRate?: number | string | null;
}

interface IndexCurrentDto {
  bstp_nmix_prdy_vrss?: number | string | null;
  bstp_nmix_prdy_ctrt?: number | string | null;
  hts_kor_isnm?: string | null;
  bstp_nmix_prpr?: number | string | null;
  bstp_cls_code?: string | null;
}

interface IndexDailyDto {
  bstp_nmix_prpr?: number | string | null;
}

interface IndexResponseDto {
  output1?: IndexCurrentDto | null;
  output2?: IndexDailyDto[] | null;
}

export function getLastFridayBasicDate(baseDate = new Date()) {
  const date = new Date(baseDate);
  const day = date.getDay();
  const friday = 5;
  const diff = (day - friday + 7) % 7;
  date.setDate(date.getDate() - diff);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${dayOfMonth}`;
}

export async function getMarketStockRankings({
  date,
  sort,
  limit = 20,
}: {
  date: string;
  sort: MarketStockRankingSort;
  limit?: number;
}) {
  const response = await apiClient.get<ApiResponse<MarketStockRankingDto[]> | MarketStockRankingDto[]>("/market/stocks/rankings", {
    params: { date, sort, limit },
  });
  const body = response.data;
  const rows = body && typeof body === "object" && "success" in body && "data" in body
    ? body.data
    : body;

  return (rows as MarketStockRankingDto[]).map(mapRanking);
}

export async function getMarketIndices(codes = ["0001", "1001", "2001"]) {
  const responses = await Promise.all(
    codes.map(async (code) => {
      const response = await apiClient.get<ApiResponse<IndexResponseDto> | IndexResponseDto>("/index/inquire-daily-indexchartprice", {
        params: { indexCode: code },
      });
      return mapMarketIndex(code, unwrapResponse(response.data));
    }),
  );

  return responses.filter((item): item is MarketIndexItem => item !== null);
}

export async function getInvestorTradeTop({
  date,
  investorType,
  tradeType,
  market = "ALL",
  limit = 20,
}: {
  date: string;
  investorType: InvestorType;
  tradeType: InvestorTradeType;
  market?: "KOSPI" | "KOSDAQ" | "ALL";
  limit?: number;
}) {
  const response = await apiClient.get<ApiResponse<InvestorTradeTopDto[]> | InvestorTradeTopDto[]>("/investor/trade-top", {
    params: { date, investorType, tradeType, market },
  });
  const body = response.data;
  const rows = body && typeof body === "object" && "success" in body && "data" in body
    ? body.data
    : body;

  return (rows as InvestorTradeTopDto[]).slice(0, limit).map(mapInvestorTradeTop);
}

function mapRanking(dto: MarketStockRankingDto): MarketStockRanking {
  return {
    rank: dto.rank,
    code: dto.code ?? dto.stockCode ?? "",
    name: dto.name ?? dto.stockName ?? "",
    market: dto.market,
    sector: dto.sector,
    closePrice: parseNumber(dto.closePrice),
    volume: parseNumber(dto.volume) ?? 0,
    tradeAmount: parseNumber(dto.tradeAmount) ?? 0,
    changeRate: parseNumber(dto.changeRate) ?? 0,
    tradeDate: normalizeTradeDate(dto.tradeDate),
  };
}

function mapInvestorTradeTop(dto: InvestorTradeTopDto): InvestorTradeTopItem {
  return {
    rank: dto.rank,
    code: dto.stockCode ?? "",
    name: dto.stockName ?? "",
    amount: parseNumber(dto.netBuyAmount) ?? 0,
    volume: parseNumber(dto.netBuyVolume) ?? 0,
    currentPrice: parseNumber(dto.currentPrice) ?? 0,
    changeRate: parseNumber(dto.changeRate) ?? 0,
  };
}

function mapMarketIndex(fallbackCode: string, dto: IndexResponseDto | undefined): MarketIndexItem | null {
  const current = dto?.output1;
  const value = parseNumber(current?.bstp_nmix_prpr);
  if (value === undefined) return null;

  const code = current?.bstp_cls_code || fallbackCode;
  const trend = (dto?.output2 ?? [])
    .map((item) => parseNumber(item.bstp_nmix_prpr))
    .filter((price): price is number => price !== undefined)
    .slice(0, 7)
    .reverse();

  return {
    code,
    name: normalizeIndexName(code, current?.hts_kor_isnm),
    value,
    change: parseNumber(current?.bstp_nmix_prdy_vrss) ?? 0,
    changeRate: parseNumber(current?.bstp_nmix_prdy_ctrt) ?? 0,
    trend: trend.length > 0 ? trend : [value],
  };
}

function unwrapResponse<T>(body: ApiResponse<T> | T): T {
  return body && typeof body === "object" && "success" in body && "data" in body
    ? body.data
    : body;
}

function normalizeIndexName(code: string, name?: string | null) {
  if (code === "0001") return "KOSPI";
  if (code === "1001") return "KOSDAQ";
  if (code === "2001") return "KOSPI200";
  return name || code;
}

function parseNumber(value?: number | string | null) {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeTradeDate(value?: string) {
  if (!value) return "";
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
}
