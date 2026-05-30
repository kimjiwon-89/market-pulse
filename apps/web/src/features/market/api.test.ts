import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/apiClient";
import { getInvestorTradeTop, getLastFridayBasicDate, getMarketIndices, getMarketStockRankings } from "./api";

vi.mock("@/services/apiClient", () => ({
  apiClient: {
    get: vi.fn(async (path: string) => {
      if (path === "/index/inquire-daily-indexchartprice") {
        return {
          data: {
            success: true,
            data: {
              output1: {
                bstp_cls_code: "0001",
                hts_kor_isnm: "코스피",
                bstp_nmix_prpr: "2719.55",
                bstp_nmix_prdy_vrss: "-15.32",
                bstp_nmix_prdy_ctrt: "-0.56",
              },
              output2: [
                { bstp_nmix_prpr: "2719.55" },
                { bstp_nmix_prpr: "2734.87" },
                { bstp_nmix_prpr: "2701.12" },
              ],
            },
          },
        };
      }

      if (path === "/investor/trade-top") {
        return {
          data: {
            success: true,
            data: [{
              rank: 1,
              stockCode: "005930",
              stockName: "삼성전자",
              netBuyAmount: 81200000000,
              netBuyVolume: 1000000,
              currentPrice: 81200,
              changeRate: -1.25,
            }],
          },
        };
      }

      return {
        data: {
          success: true,
          data: [{
            rank: 1,
            stockCode: "005930",
            stockName: "삼성전자",
            market: "KOSPI",
            sector: "반도체",
            closePrice: 81200,
            volume: 1000000,
            tradeAmount: 81200000000,
            changeRate: 1.25,
            tradeDate: "2026-05-29",
          }],
        },
      };
    }),
  },
}));

describe("market api", () => {
  it("uses the previous Friday as the default market ranking date", () => {
    expect(getLastFridayBasicDate(new Date("2026-05-30T12:00:00+09:00"))).toBe("20260529");
  });

  it("fetches stock rankings from the market API with date, sort, and limit", async () => {
    const rankings = await getMarketStockRankings({ date: "20260529", sort: "TRADE_AMOUNT", limit: 20 });

    expect(apiClient.get).toHaveBeenCalledWith("/market/stocks/rankings", {
      params: { date: "20260529", sort: "TRADE_AMOUNT", limit: 20 },
    });
    expect(rankings[0]).toMatchObject({
      rank: 1,
      code: "005930",
      name: "삼성전자",
      tradeDate: "2026-05-29",
      changeRate: 1.25,
    });
  });

  it("fetches market indices from the index API", async () => {
    const indices = await getMarketIndices(["0001"]);

    expect(apiClient.get).toHaveBeenCalledWith("/index/inquire-daily-indexchartprice", {
      params: { indexCode: "0001" },
    });
    expect(indices[0]).toMatchObject({
      code: "0001",
      name: "KOSPI",
      value: 2719.55,
      change: -15.32,
      changeRate: -0.56,
      trend: [2701.12, 2734.87, 2719.55],
    });
  });

  it("fetches investor trade top with investor and buy/sell filters", async () => {
    const items = await getInvestorTradeTop({
      date: "20260529",
      investorType: "INSTITUTION",
      tradeType: "SELL",
      market: "ALL",
      limit: 20,
    });

    expect(apiClient.get).toHaveBeenCalledWith("/investor/trade-top", {
      params: { date: "20260529", investorType: "INSTITUTION", tradeType: "SELL", market: "ALL" },
    });
    expect(items[0]).toMatchObject({
      rank: 1,
      code: "005930",
      name: "삼성전자",
      amount: 81200000000,
      volume: 1000000,
      changeRate: -1.25,
    });
  });
});
