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
  name: string;
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

function unwrap<T>(body: ApiResponse<T> | T): T {
  return body && typeof body === "object" && "success" in body && "data" in body
    ? body.data
    : body;
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
