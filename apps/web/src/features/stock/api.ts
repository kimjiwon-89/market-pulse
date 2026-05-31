import { apiClient } from "@/services/apiClient";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
}

export interface StockSearchItem {
  code: string;
  name: string;
  market?: string | null;
  sector?: string | null;
}

export interface StockDetailItem {
  code: string;
  name?: string | null;
  market?: string | null;
  sector?: string | null;
  currentPrice: number;
  prdyVrss?: number;
  changeRate: number;
  volume: number;
  tradingValue?: number;
  marketCap?: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  per?: number;
  pbr?: number;
  weekHigh?: number;
  weekLow?: number;
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

export interface StockInvestorItem {
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

export interface StockMinuteCandleItem {
  code: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeAmount: number;
  source?: string | null;
}

export interface StockOrderbookLevel {
  price: number;
  volume: number;
  level: number;
}

export interface StockOrderbookItem {
  code: string;
  timestamp?: string | null;
  asks: StockOrderbookLevel[];
  bids: StockOrderbookLevel[];
  expectedPrice?: number;
  expectedVolume?: number;
}

export interface StockDisclosureItem {
  code: string;
  title: string;
  filedAt?: string | null;
  source?: string | null;
  url?: string | null;
}

export interface StockReportItem {
  source?: string | null;
  title: string;
  publishedAt?: string | null;
  url?: string | null;
  summary?: string | null;
  licenseStatus?: string | null;
}

function unwrap<T>(body: ApiResponse<T> | T): T {
  return body && typeof body === "object" && "success" in body && "data" in body
    ? body.data
    : body;
}

function unwrapArray<T>(body: ApiResponse<T[]> | T[] | null): T[] {
  const data = body && typeof body === "object" && "success" in body && "data" in body
    ? body.data
    : body;
  return Array.isArray(data) ? data : [];
}

function unwrapOptional<T>(body: ApiResponse<T> | T | null): T | null {
  const data = body && typeof body === "object" && "success" in body && "data" in body
    ? body.data
    : body;
  return data ?? null;
}

export async function searchStocks(query: string, limit = 10) {
  const response = await apiClient.get<ApiResponse<StockSearchItem[]> | StockSearchItem[]>("/stock/search", {
    params: { q: query, limit },
  });
  return unwrap(response.data);
}

export async function getStockDetail(code: string) {
  const response = await apiClient.get<ApiResponse<StockDetailItem> | StockDetailItem>("/stock/detail", {
    params: { code },
  });
  return unwrap(response.data);
}

export async function getStockChart(code: string, period = "3M") {
  const response = await apiClient.get<ApiResponse<StockChartItem[]> | StockChartItem[]>("/stock/chart", {
    params: { code, period },
  });
  return unwrap(response.data);
}

export async function getStockInvestor(code: string) {
  const response = await apiClient.get<ApiResponse<StockInvestorItem> | StockInvestorItem>("/stock/investor", {
    params: { code },
  });
  return unwrap(response.data);
}

export async function getStockMinuteChart(code: string) {
  const response = await apiClient.get<ApiResponse<StockMinuteCandleItem[]> | StockMinuteCandleItem[]>("/stock/minute-chart", {
    params: { code },
  });
  return unwrapArray(response.data);
}

export async function getStockOrderbook(code: string) {
  const response = await apiClient.get<ApiResponse<StockOrderbookItem> | StockOrderbookItem>("/stock/orderbook", {
    params: { code },
  });
  return unwrapOptional(response.data);
}

export async function getStockDisclosures(code: string) {
  const response = await apiClient.get<ApiResponse<StockDisclosureItem[]> | StockDisclosureItem[]>("/stock/disclosures", {
    params: { code },
  });
  return unwrapArray(response.data);
}

export async function getStockReports(code: string) {
  const response = await apiClient.get<ApiResponse<StockReportItem[]> | StockReportItem[]>("/stock/reports", {
    params: { code },
  });
  return unwrapArray(response.data);
}
