import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/apiClient";
import {
  getStockChart,
  getStockDetail,
  getStockDisclosures,
  getStockInvestor,
  getStockMinuteChart,
  getStockOrderbook,
  getStockReports,
} from "./api";

vi.mock("@/services/apiClient", () => ({
  apiClient: {
    get: vi.fn(async (path: string) => {
      const dataByPath: Record<string, unknown> = {
        "/stock/detail": { code: "089590", name: "제주항공", currentPrice: 10000, changeRate: 1.2, volume: 1000 },
        "/stock/chart": [{ date: "20260529", close: 10000, open: 9900, high: 10100, low: 9800, volume: 1000, changeRate: 1.2 }],
        "/stock/investor": { foreignBuy: 1, foreignSell: 2, foreignNet: -1, institutionBuy: 3, institutionSell: 1, institutionNet: 2, individualBuy: 1, individualSell: 1, individualNet: 0 },
        "/stock/minute-chart": [{ code: "089590", time: "093000", open: 9900, high: 10000, low: 9900, close: 10000, volume: 100, tradeAmount: 1000000, source: "KIS_REST" }],
        "/stock/orderbook": { code: "089590", asks: [], bids: [], expectedPrice: 10000, expectedVolume: 10 },
        "/stock/disclosures": [{ code: "089590", title: "공시", filedAt: "2026-05-29", source: "OpenDART" }],
        "/stock/reports": [{ title: "리포트", publishedAt: "2026-05-29", source: "증권사", licenseStatus: "metadata-only" }],
      };
      return { data: { success: true, data: dataByPath[path] } };
    }),
  },
}));

describe("stock api", () => {
  it("fetches the stock workspace endpoints with the selected code", async () => {
    await getStockDetail("089590");
    await getStockChart("089590", "3M");
    await getStockInvestor("089590");
    await getStockMinuteChart("089590");
    await getStockOrderbook("089590");
    await getStockDisclosures("089590");
    await getStockReports("089590");

    expect(apiClient.get).toHaveBeenCalledWith("/stock/detail", { params: { code: "089590" } });
    expect(apiClient.get).toHaveBeenCalledWith("/stock/chart", { params: { code: "089590", period: "3M" } });
    expect(apiClient.get).toHaveBeenCalledWith("/stock/investor", { params: { code: "089590" } });
    expect(apiClient.get).toHaveBeenCalledWith("/stock/minute-chart", { params: { code: "089590" } });
    expect(apiClient.get).toHaveBeenCalledWith("/stock/orderbook", { params: { code: "089590" } });
    expect(apiClient.get).toHaveBeenCalledWith("/stock/disclosures", { params: { code: "089590" } });
    expect(apiClient.get).toHaveBeenCalledWith("/stock/reports", { params: { code: "089590" } });
  });

  it("normalizes unavailable optional stock endpoints to empty display data", async () => {
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path === "/stock/disclosures") {
        return { data: { success: false, data: null, message: "OpenDART API 키가 설정되지 않았습니다." } };
      }
      if (path === "/stock/orderbook") {
        return { data: { success: false, data: null, message: "KIS credentials unavailable" } };
      }
      return { data: { success: true, data: null } };
    });

    await expect(getStockDisclosures("089590")).resolves.toEqual([]);
    await expect(getStockReports("089590")).resolves.toEqual([]);
    await expect(getStockMinuteChart("089590")).resolves.toEqual([]);
    await expect(getStockOrderbook("089590")).resolves.toEqual(null);
  });
});
