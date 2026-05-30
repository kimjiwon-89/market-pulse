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
});
