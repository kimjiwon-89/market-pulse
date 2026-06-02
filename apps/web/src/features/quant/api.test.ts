import { describe, expect, it, vi } from "vitest";
import { mockNews } from "@/features/mock/marketMockData";
import { apiClient } from "@/services/apiClient";
import { getQuantDecisions, getQuantHomeSummary } from "./api";

vi.mock("@/services/apiClient", () => ({
  apiClient: {
    get: vi.fn((path: string, config?: { params?: Record<string, unknown> }) => {
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
                modelName: "Bull v4",
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
              {
                modelCode: "KOSDAQ_BULL",
                modelName: "KOSDAQ Bull v1",
                status: "PACKAGE_READY",
                seedMoney: 100000000,
                totalReturnPct: 0,
                totalProfit: 0,
                monthlyReturnPct: 0,
                rawCandidateCountToday: 1,
                actualEntryCountToday: 0,
              },
            ],
          },
        });
      }

      if (path === "/quant/live/models/KOSPI_BULL/candidates") {
        if (config?.params?.date === "2026-06-02") {
          return Promise.resolve({
            data: {
              success: true,
              data: Array.from({ length: 9 }, (_, index) => ({
                assetCode: `00593${index}`,
                assetName: `KOSPI Candidate ${index + 1}`,
                signalDate: "2026-06-02",
                candidateType: "AUTO_PAPER_REALTIME_SCAN",
                decision: "HOT",
                reason: "KOSPI_REALTIME_MOMENTUM HOT",
                signalPrice: 100000 + index,
                expectedReturnPct: 10 + index,
              })),
            },
          });
        }
        return Promise.resolve({
          data: {
            success: true,
            data: [{
              assetCode: "005930",
              assetName: "Samsung Electronics",
              signalDate: "2026-05-30",
              candidateType: "HISTORICAL_VALIDATION",
              decision: "POST",
              reason: "historical validation candidate",
              signalPrice: 86100,
              expectedReturnPct: 4.24,
            }],
          },
        });
      }

      if (path === "/quant/live/models/KOSDAQ_BULL/candidates") {
        return Promise.resolve({
          data: {
            success: true,
            data: [{
              assetCode: "356860",
              assetName: "TLB",
              signalDate: "2026-06-02",
              candidateType: "AUTO_PAPER_REALTIME_SCAN",
              decision: "HOT",
              reason: "KOSDAQ_REALTIME_MOMENTUM HOT: live momentum +11.80%",
              signalPrice: 92200,
              expectedReturnPct: 11.8,
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
              name: "Samsung Electronics",
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
      direction: "up",
    });
    expect(summary.marketOverview?.[1]).toMatchObject({
      label: "KOSDAQ",
      value: "742.31",
      regime: "BEAR",
      direction: "down",
    });
  });

  it("loads hot stocks from market rankings", async () => {
    const summary = await getQuantHomeSummary();

    expect(summary.hotStocks?.[0]).toMatchObject({
      assetName: "Samsung Electronics",
      assetCode: "005930",
      changeRate: "05/26 · +4.24%",
    });
  });

  it("hides legacy Bull v4 and does not show historical candidates as today picks", async () => {
    const summary = await getQuantHomeSummary();

    expect(summary.models.map((model) => model.code)).toEqual(["KOSPI_BULL", "KOSDAQ_BULL"]);
    expect(summary.models[0].focus.join(" ")).not.toContain("Bull v4");
    expect(summary.decisions.map((item) => item.assetCode)).toContain("356860");
    expect(apiClient.get).toHaveBeenCalledWith(
      "/quant/live/models/KOSPI_BULL/candidates",
      expect.objectContaining({
        params: expect.objectContaining({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      }),
    );
  });

  it("loads today's candidates from every visible bull model", async () => {
    const decisions = await getQuantDecisions("2026-06-02");

    expect(decisions).toHaveLength(10);
    expect(decisions).toEqual(expect.arrayContaining([
      expect.objectContaining({
      assetCode: "356860",
      modelNames: ["KOSDAQ Bull v1"],
      decisionCode: "HOT",
      sourceType: "AUTO_PAPER_REALTIME_SCAN",
      }),
    ]));
    expect(apiClient.get).toHaveBeenCalledWith(
      "/quant/live/models/KOSDAQ_BULL/candidates",
      expect.objectContaining({
        params: expect.objectContaining({ date: "2026-06-02" }),
      }),
    );
  });
});
