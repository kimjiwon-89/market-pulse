import { describe, expect, it, vi } from "vitest";
import { mockNews } from "@/features/mock/marketMockData";
import { getQuantHomeSummary } from "./api";

vi.mock("@/services/apiClient", () => ({
  apiClient: {
    get: vi.fn((path: string) => {
      if (path === "/news/inquire-daily-news") {
        return Promise.reject(new Error("news API unavailable"));
      }

      if (path === "/quant/live/models") {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              {
                modelCode: "BULL_V4",
                modelName: "Bull v4 모델",
                status: "RUNNING",
                seedMoney: 100000000,
                totalReturnPct: 999,
                totalProfit: 999000000,
                monthlyReturnPct: 0,
                rawCandidateCountToday: 1,
                actualEntryCountToday: 1,
              },
              {
                modelCode: "KOSPI_BULL",
                modelName: "KOSPI Bull v1",
                status: "PACKAGE_READY",
                seedMoney: 100000000,
                totalReturnPct: 81.87,
                totalProfit: 81870000,
                monthlyReturnPct: 0,
                rawCandidateCountToday: 1,
                actualEntryCountToday: 1,
              },
            ],
          },
        });
      }

      if (path === "/quant/live/models/KOSPI_BULL/candidates") {
        return Promise.resolve({
          data: {
            success: true,
            data: [{
              assetCode: "005930",
              assetName: "삼성전자",
              signalDate: "2026-05-30",
              candidateType: "HISTORICAL_VALIDATION",
              decision: "POST",
              reason: "최근 검증 후보",
              signalPrice: 86100,
              expectedReturnPct: 4.24,
            }],
          },
        });
      }

      if (path === "/quant/live/reports") {
        return Promise.resolve({ data: [] });
      }

      if (path === "/index/inquire-daily-indexchartprice") {
        return Promise.resolve({ data: undefined });
      }

      if (path === "/quant/live/market-regime/latest") {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              tradeDate: "2026-05-30",
              cacheDate: "2026-05-29",
              liveKospi: 2886.74,
              liveKosdaq: 742.31,
              kospiRegime: "BULL",
              kosdaqRegime: "BEAR",
              kospiAllowedStrategy: "FULL_RISK",
              kosdaqAllowedStrategy: "DEFENSIVE_ONLY",
              kospiRiskBudget: 1,
              kosdaqRiskBudget: 0.2,
              combinedRegime: "SIDE",
              allowedStrategy: "SELECTIVE_ONLY",
              confidence: 0.72,
              riskBudget: 0.5,
              bullScore: 3,
              bearScore: 1,
              stressScore: 1,
              breadthMa20: 0.63,
              breadthMa60: 0.58,
              volatility20: 0.19,
              liquidityTrend: 0.04,
              updatedAt: "2026-05-30T10:30:00",
            },
          },
        });
      }

      if (path === "/market/stocks/rankings") {
        return Promise.resolve({
          data: {
            success: true,
            data: [{
              rank: 1,
              code: "005930",
              name: "삼성전자",
              closePrice: 86100,
              volume: 19665151,
              tradeAmount: 1690000000000,
              changeRate: 4.24,
              tradeDate: "2026-05-26",
            }],
          },
        });
      }

      return Promise.reject(new Error(`Unhandled request: ${path}`));
    }),
  },
}));

describe("getQuantHomeSummary", () => {
  it("falls back to displayable news when the latest news API is unavailable", async () => {
    const summary = await getQuantHomeSummary();

    expect(summary.news).toHaveLength(5);
    expect(summary.news[0]).toMatchObject({
      id: mockNews[0].id,
      title: mockNews[0].title,
      source: mockNews[0].source,
      publishedAt: mockNews[0].date,
    });
  });

  it("exposes the latest KOSPI/KOSDAQ regime monitor snapshot on the home summary", async () => {
    const summary = await getQuantHomeSummary();

    expect(summary.marketRegime).toMatchObject({
      kospiRegime: "BULL",
      kosdaqRegime: "BEAR",
      combinedRegime: "SIDE",
      allowedStrategy: "SELECTIVE_ONLY",
      riskBudget: 0.5,
    });
    expect(summary.marketOverview?.[0]).toMatchObject({
      label: "KOSPI",
      value: "2,886.74",
      regime: "BULL",
      delta: "FULL_RISK · 리스크 100%",
      direction: "up",
    });
    expect(summary.marketOverview?.[1]).toMatchObject({
      label: "KOSDAQ",
      value: "742.31",
      regime: "BEAR",
      delta: "DEFENSIVE_ONLY · 리스크 20%",
      direction: "down",
    });
  });

  it("loads hot stocks from market rankings", async () => {
    const summary = await getQuantHomeSummary();

    expect(summary.hotStocks?.[0]).toMatchObject({
      assetName: "삼성전자",
      assetCode: "005930",
      changeRate: "05/26 · +4.24%",
    });
  });

  it("hides legacy Bull v4 and falls back to latest candidates when today has none", async () => {
    const summary = await getQuantHomeSummary();

    expect(summary.models.map((model) => model.code)).toEqual(["KOSPI_BULL"]);
    expect(summary.models[0].focus.join(" ")).not.toContain("Bull v4");
    expect(summary.decisions).toHaveLength(1);
    expect(summary.decisions[0]).toMatchObject({
      assetCode: "005930",
      assetName: "삼성전자",
      modelNames: ["KOSPI Bull v1"],
    });
  });
});
