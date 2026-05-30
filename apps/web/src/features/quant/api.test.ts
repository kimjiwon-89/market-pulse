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
        return Promise.resolve({ data: [] });
      }

      if (path === "/quant/live/models/BULL_V4/candidates") {
        return Promise.resolve({ data: [] });
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
});
