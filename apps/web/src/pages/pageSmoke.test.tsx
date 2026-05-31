import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { Admin } from "./Admin";
import { Dashboard } from "./Dashboard";
import { IndexDetail } from "./IndexDetail";
import { InvestorTrend } from "./InvestorTrend";
import { LottoAnalysis } from "./LottoAnalysis";
import { MemoList } from "./MemoList";
import { MyPage } from "./MyPage";
import { NetBuyingList } from "./NetBuyingList";
import { NewsList } from "./NewsList";
import { QuantModels } from "./QuantModels";
import { QuantHome } from "./QuantHome";
import { QuantToday } from "./QuantToday";
import { Reports } from "./Reports";
import { Services } from "./Services";
import { TarotPage } from "./Services/TarotPage";
import { StockDetail } from "./StockDetail";

const { getMarketIndicesMock, getMarketStockRankingsMock } = vi.hoisted(() => ({
  getMarketIndicesMock: vi.fn(async () => [
    {
      code: "0001",
      name: "KOSPI",
      value: 2719.55,
      change: -15.32,
      changeRate: -0.56,
      trend: [2680, 2695, 2710, 2730, 2719.55],
    },
    {
      code: "1001",
      name: "KOSDAQ",
      value: 946.21,
      change: 4.12,
      changeRate: 0.44,
      trend: [930, 936, 940, 942, 946.21],
    },
    {
      code: "2001",
      name: "KOSPI200",
      value: 365.12,
      change: -2.21,
      changeRate: -0.6,
      trend: [360, 364, 368, 367, 365.12],
    },
  ]),
  getMarketStockRankingsMock: vi.fn(async ({ sort }: { sort: "VOLUME" | "TRADE_AMOUNT" | "CHANGE_RATE_DESC" | "CHANGE_RATE_ASC" }) => {
    const base = Array.from({ length: 20 }, (_, index) => ({
      rank: index + 1,
      code: `${String(index + 1).padStart(6, "0")}`,
      name: `API종목${index + 1}`,
      market: "KOSPI",
      sector: index % 2 === 0 ? "반도체" : "자동차",
      closePrice: 10000 + index,
      volume: 2000000 - index,
      tradeAmount: 1000000000 - index,
      changeRate: index === 0 ? 1.25 : index === 1 ? -2.5 : 0,
      tradeDate: "2026-05-29",
    }));
    return sort === "TRADE_AMOUNT" ? [...base].reverse() : base;
  }),
}));

const { getInvestorTradeTopMock } = vi.hoisted(() => ({
  getInvestorTradeTopMock: vi.fn(async ({
    investorType,
    tradeType,
  }: {
    investorType: "FOREIGN" | "INSTITUTION" | "ALL";
    tradeType: "BUY" | "SELL";
  }) => Array.from({ length: 20 }, (_, index) => ({
    rank: index + 1,
    code: `${String(index + 1).padStart(6, "1")}`,
    name: `${investorType === "FOREIGN" ? "외국인" : investorType === "INSTITUTION" ? "기관" : "전체"}${tradeType === "BUY" ? "순매수" : "순매도"}${index + 1}`,
    amount: 5000000000 - index,
    volume: 1000000 - index,
    currentPrice: 10000 + index,
    changeRate: index === 0 ? 2.1 : index === 1 ? -1.5 : 0,
  }))),
}));

const {
  searchStocksMock,
  getStockDetailMock,
  getStockChartMock,
  getStockInvestorMock,
  getStockMinuteChartMock,
  getStockOrderbookMock,
  getStockDisclosuresMock,
  getStockReportsMock,
  getQuantModelDetailMock,
} = vi.hoisted(() => ({
  searchStocksMock: vi.fn(async () => [
    { code: "005930", name: "삼성전자", market: "KOSPI", sector: "반도체" },
    { code: "000660", name: "SK하이닉스", market: "KOSPI", sector: "반도체" },
  ]),
  getStockDetailMock: vi.fn(async () => ({
    code: "000660",
    name: "SK하이닉스",
    market: "KOSPI",
    sector: "반도체",
    currentPrice: 223700,
    changeRate: -0.26,
    volume: 34500000,
    tradingValue: 7717650000000,
    marketCap: 162000000000000,
    openPrice: 224000,
    highPrice: 225000,
    lowPrice: 221000,
  })),
  getStockChartMock: vi.fn(async () => [
    { date: "20260522", close: 221000, open: 220000, high: 222000, low: 219000, volume: 1000, changeRate: 0.4 },
    { date: "20260523", close: 223700, open: 222000, high: 224000, low: 221000, volume: 1100, changeRate: 1.2 },
  ]),
  getStockInvestorMock: vi.fn(async () => ({
    foreignBuy: 25000000000,
    foreignSell: 18000000000,
    foreignNet: 7000000000,
    institutionBuy: 12000000000,
    institutionSell: 15000000000,
    institutionNet: -3000000000,
    individualBuy: 21000000000,
    individualSell: 22000000000,
    individualNet: -1000000000,
  })),
  getStockMinuteChartMock: vi.fn(async () => [
    { code: "000660", time: "093000", open: 222000, high: 223000, low: 221500, close: 222800, volume: 10000, tradeAmount: 2228000000, source: "KIS_REST" },
    { code: "000660", time: "093100", open: 222800, high: 223700, low: 222700, close: 223700, volume: 12000, tradeAmount: 2684400000, source: "KIS_REST" },
  ]),
  getStockOrderbookMock: vi.fn(async () => ({
    code: "000660",
    timestamp: "2026-05-29T09:31:00",
    asks: [{ level: 1, price: 223800, volume: 1200 }],
    bids: [{ level: 1, price: 223600, volume: 1500 }],
    expectedPrice: 223700,
    expectedVolume: 900,
  })),
  getStockDisclosuresMock: vi.fn(async () => [
    { code: "000660", title: "대규모기업집단현황공시", filedAt: "2026-05-29", source: "OpenDART", url: "https://dart.fss.or.kr" },
  ]),
  getStockReportsMock: vi.fn(async () => [
    { source: "증권사", title: "HBM 수요 점검", publishedAt: "2026-05-29", url: "https://example.com/report", summary: "메모리 업황 회복 점검", licenseStatus: "metadata-only" },
  ]),
  getQuantModelDetailMock: vi.fn(async () => ({
    candidates: [{
      assetCode: "005930",
      assetName: "삼성전자",
      date: "2026-05-29",
      label: "후보",
      reason: "공개 모델 조건 통과",
      price: 81200,
      returnPct: 3.2,
    }],
    trades: [
      {
        tradeId: "1",
        assetCode: "005930",
        assetName: "삼성전자",
        side: "BUY",
        fillTime: "2026-05-20T09:01:00",
        fillPrice: 78000,
        reason: "historical replay entry",
      },
      {
        tradeId: "2",
        assetCode: "005930",
        assetName: "삼성전자",
        side: "SELL",
        fillTime: "2026-05-27T15:20:00",
        fillPrice: 82000,
        realizedReturnPct: 5.12,
        reason: "historical replay exit",
      },
    ],
  })),
}));

vi.mock("@/features/market/api", () => ({
  getLastFridayBasicDate: () => "20260529",
  getMarketIndices: getMarketIndicesMock,
  getMarketStockRankings: getMarketStockRankingsMock,
  getInvestorTradeTop: getInvestorTradeTopMock,
}));

vi.mock("@/features/stock/api", () => ({
  searchStocks: searchStocksMock,
  getStockDetail: getStockDetailMock,
  getStockChart: getStockChartMock,
  getStockInvestor: getStockInvestorMock,
  getStockMinuteChart: getStockMinuteChartMock,
  getStockOrderbook: getStockOrderbookMock,
  getStockDisclosures: getStockDisclosuresMock,
  getStockReports: getStockReportsMock,
}));

vi.mock("@/features/quant/api", () => {
  const decision = {
    assetCode: "005930",
    assetName: "삼성전자",
    badgeText: "삼",
    badgeTone: "blue",
    modelNames: ["Bull v4 모델"],
    modelLabel: "상승장 모델",
    decisionLabel: "살펴볼 종목",
    decisionCode: "BUY",
    signalDate: "2026-05-29",
    reasonBullets: ["Bull v4 후보"],
    cautionBullets: ["리플레이 기반 후보"],
  };
  const report = {
    id: "101",
    title: "Bull v4 일간 리포트",
    modelCode: "BULL_V4",
    modelName: "Bull v4 모델",
    publishedAt: "05.29 09:00",
    summary: "Bull v4 리포트 요약",
    keywords: ["Bull v4"],
  };

  return {
    getQuantHomeSummary: vi.fn(async () => ({
      decisions: [decision],
      kpis: [],
      models: [{
        code: "BULL_V4",
        modelVersion: "5.0.1",
        name: "Bull v4 모델",
        plainName: "상승장 리플레이 기반 종목 신호",
        description: "Bull v4 운영 모델",
        category: "상승장",
        marketMode: "상승장 모델",
        status: "정상 운영",
        signalStrength: "보통",
        focus: ["Bull v4"],
        todayCount: 1,
        seedMoney: 100000000,
        totalReturnPct: 12.34,
        totalProfit: 12340000,
        currentCapital: 112340000,
        monthlyReturnPct: 4.56,
        monthlyMarketRegime: "BULL",
      }, {
        code: "BEAR_GUARD",
        name: "Bear Guard 모델",
        plainName: "하락장 방어형 종목 신호",
        description: "하락장 운영 모델",
        category: "하락장",
        marketMode: "하락장 모델",
        status: "관찰 중",
        signalStrength: "낮음",
        focus: ["방어", "변동성"],
        todayCount: 0,
      }],
      reports: [report],
      news: [],
      asOf: "05.29 09:00",
    })),
    getQuantModelDetail: getQuantModelDetailMock,
    getBullQuantDecisions: vi.fn(async () => [decision]),
    getBullQuantReports: vi.fn(async () => [report]),
    getQuantReports: vi.fn(async () => [report]),
    getBullQuantReportDetail: vi.fn(async () => ({
      ...report,
      sections: ["백엔드 리포트 본문"],
      checkpoints: ["체크포인트"],
    })),
  };
});

function renderAt(path: string, element: React.ReactNode, route = path) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={route} element={element} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe("page smoke rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it.each([
    ["시장 보기", "/market", <Dashboard />],
    ["투자자 동향", "/investor", <InvestorTrend />],
    ["순매수도", "/net-buy", <NetBuyingList />],
    ["뉴스", "/news", <NewsList />],
    ["로또", "/lotto", <LottoAnalysis />],
    ["서비스", "/services", <Services />],
    ["타로", "/tarot", <TarotPage />],
    ["관리자", "/admin", <Admin />],
    ["오늘 추천 후보 전체", "/quant/today", <QuantToday />],
    ["모델 목록", "/quant", <QuantModels />],
    ["리포트", "/reports", <Reports />],
  ])("renders %s page", (heading, path, element) => {
    renderAt(path, element);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("renders index detail", () => {
    renderAt("/index/0001", <IndexDetail />, "/index/:id");
    expect(screen.getByRole("heading", { name: "KOSPI" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "관련 주요 종목" })).toBeInTheDocument();
    expect(screen.getByText("지수 흐름과 같이 확인할 대표 종목입니다.")).toBeInTheDocument();
  });

  it("opens stock detail from index related stocks", async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/index/0001"]}>
          <Routes>
            <Route path="/index/:id" element={<IndexDetail />} />
            <Route path="/stock/:code" element={<div>종목 상세 이동됨</div>} />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    );

    await userEvent.click(screen.getByText("SK하이닉스"));

    expect(screen.getByText("종목 상세 이동됨")).toBeInTheDocument();
  });

  it("renders stock detail from the stock API", async () => {
    renderAt("/stock/000660", <StockDetail />, "/stock/:code");
    expect(await screen.findByRole("heading", { name: "SK하이닉스" })).toBeInTheDocument();
    expect(getStockDetailMock).toHaveBeenCalledWith("000660");
    expect(getStockChartMock).toHaveBeenCalledWith("000660", "3M");
    expect(getStockInvestorMock).toHaveBeenCalledWith("000660");
    expect(getStockMinuteChartMock).toHaveBeenCalledWith("000660");
    expect(getStockOrderbookMock).toHaveBeenCalledWith("000660");
    expect(getStockDisclosuresMock).toHaveBeenCalledWith("000660");
    expect(getStockReportsMock).toHaveBeenCalledWith("000660");
    expect(getQuantModelDetailMock).toHaveBeenCalledWith("KOSPI_BULL");
    expect(getQuantModelDetailMock).toHaveBeenCalledWith("KOSDAQ_BULL");
    expect(getQuantModelDetailMock).toHaveBeenCalledWith("KOSPI_WATCH");
    expect(getQuantModelDetailMock).toHaveBeenCalledWith("KOSDAQ_WATCH");
    expect(getQuantModelDetailMock).not.toHaveBeenCalledWith("BULL_V4");
    expect(screen.getByLabelText("SK하이닉스 로고")).toHaveAttribute("src", "/stock-logos/000660.svg");
    expect(screen.getAllByText("162조").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "요약" })).toBeInTheDocument();
    expect(screen.getByLabelText("광고 영역")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "1분" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "년" })).toBeInTheDocument();
    expect(screen.getByLabelText("축소")).toBeDisabled();
    await userEvent.click(screen.getByLabelText("확대"));
    expect(screen.getByLabelText("축소")).toBeEnabled();
    const chart = screen.getByLabelText("가격 캔들 차트");
    expect(chart).toBeInTheDocument();
    fireEvent.pointerMove(chart, { pointerId: 1, clientX: 260, clientY: 140 });
    expect(screen.getByTestId("chart-crosshair")).toBeInTheDocument();
    expect(screen.queryByText("시가 222,000원")).not.toBeInTheDocument();
    fireEvent.pointerDown(chart, { pointerId: 1, clientX: 760, clientY: 140 });
    fireEvent.pointerUp(chart, { pointerId: 1, clientX: 760, clientY: 140 });
    expect(screen.getByText("시가 222,000원")).toBeInTheDocument();
    expect(screen.getByText("고가 224,000원")).toBeInTheDocument();
    expect(screen.getAllByText("저가 221,000원").length).toBeGreaterThan(0);
    expect(screen.getByText("종가 223,700원")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "호가" })).toBeInTheDocument();
    expect(screen.getByText("읽기 전용 호가입니다. 주문 기능은 제공하지 않습니다.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "최근 체결 스냅샷" })).toBeInTheDocument();
    expect(screen.getAllByText("REST snapshot").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "수급" })).toBeInTheDocument();
    expect(screen.getByText("+70억")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "퀀트 판단" })).toBeInTheDocument();
    expect(screen.getByText("오늘 모델 후보에는 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "뉴스 / 공시" })).toBeInTheDocument();
    expect(screen.getByText("대규모기업집단현황공시")).toBeInTheDocument();
    expect(screen.getByText("HBM 수요 점검")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "메모" })).toBeInTheDocument();
    expect(screen.getByText("종목 메모는 로그인 후 사용할 수 있습니다.")).toBeInTheDocument();
  });

  it("renders logged-out personal page gates", () => {
    renderAt("/memo", <MemoList />);
    expect(screen.getByText("메모는 로그인 후 사용할 수 있습니다")).toBeInTheDocument();

    renderAt("/my", <MyPage />);
    expect(screen.getByText("로그인이 필요한 기능입니다")).toBeInTheDocument();
  });

  it.each([
    ["/market", <Dashboard />],
    ["/quant/today", <QuantToday />],
    ["/quant", <QuantModels />],
    ["/reports", <Reports />],
    ["/services", <Services />],
    ["/lotto", <LottoAnalysis />],
    ["/tarot", <TarotPage />],
    ["/admin", <Admin />],
  ])("does not expose internal mock-data labels on %s", (path, element) => {
    renderAt(path, element);
    expect(screen.queryByText(/목데이터/)).not.toBeInTheDocument();
  });

  it("shows today's candidates on the home page without duplicating signal tabs", async () => {
    renderAt("/", <QuantHome />);
    expect(screen.queryByText("퀀트 모델 신호")).not.toBeInTheDocument();
    expect(await screen.findByText("오늘 추천 후보")).toBeInTheDocument();
    expect(screen.getAllByText("삼성전자").length).toBeGreaterThan(0);

    const text = document.body.textContent ?? "";
    expect(text.indexOf("모바일 광고 영역")).toBeLessThan(text.indexOf("오늘 추천 후보"));
  });

  it("shows top 20 market stocks with volume and trade amount toggles", async () => {
    renderAt("/market", <Dashboard />);

    expect(await screen.findByText("KOSPI")).toBeInTheDocument();
    expect(screen.getByText("2,719.55")).toBeInTheDocument();
    expect(getMarketIndicesMock).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "거래량" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "거래대금" })).toBeInTheDocument();
    expect(await screen.findByText("API종목1")).toBeInTheDocument();
    expect(screen.getAllByText("1위").length).toBeGreaterThan(0);
    expect(screen.getAllByText("20위").length).toBeGreaterThan(0);
    expect(screen.getByText("+1.25%")).toBeInTheDocument();
    expect(screen.getByText("-2.50%")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "거래대금" }));

    expect(getMarketStockRankingsMock).toHaveBeenCalledWith({ date: "20260529", sort: "TRADE_AMOUNT", limit: 20 });
    expect(screen.getAllByText("거래대금").length).toBeGreaterThan(0);
    expect(screen.getAllByText("20위").length).toBeGreaterThan(0);
  });

  it("shows supply top 20 with investor and trade toggles", async () => {
    renderAt("/market", <Dashboard />);

    expect(screen.getByRole("heading", { name: "수급 TOP20" })).toBeInTheDocument();
    expect(await screen.findByText("외국인순매수1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "기관" }));
    await userEvent.click(screen.getByRole("button", { name: "순매도" }));

    expect(getInvestorTradeTopMock).toHaveBeenCalledWith({
      date: "20260529",
      investorType: "INSTITUTION",
      tradeType: "SELL",
      market: "ALL",
      limit: 20,
    });
    expect(await screen.findByText("기관순매도1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "더보기" })).toBeInTheDocument();
  });

  it("renders net buy page as a legacy weekly net-buy matrix", async () => {
    renderAt("/net-buy?date=20260529&investorType=INSTITUTION&tradeType=SELL&market=ALL", <NetBuyingList />, "/net-buy");

    expect(screen.getByRole("heading", { name: "순매수도" })).toBeInTheDocument();
    expect((await screen.findAllByText("기관순매도1")).length).toBeGreaterThan(0);
    expect(screen.getByText("합계")).toBeInTheDocument();
    expect(screen.getByText("2026.05.29")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이전주" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "오늘" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음주" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기관" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "순매도" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "전체" }).length).toBeGreaterThan(0);
  });


  it("renders quant report detail with user-facing body sections", async () => {
    renderAt("/reports/report-20260528-am", <Reports />, "/reports/:reportId");
    expect(await screen.findByText("핵심 판단")).toBeInTheDocument();
    expect(screen.getByText("모델 근거")).toBeInTheDocument();
    expect(screen.getByText("사용자 체크포인트")).toBeInTheDocument();
  });

  it("renders services as separated production serving entries", () => {
    renderAt("/services", <Services />);
    expect(screen.getByText("로또 분석")).toBeInTheDocument();
    expect(screen.getByText("타로 리딩")).toBeInTheDocument();
  });

  it("renders admin work tabs and model package management", () => {
    renderAt("/admin", <Admin />);
    expect(screen.getByRole("heading", { name: "관리자 처리할 일" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "계정" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "모델", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "버그" })).toBeInTheDocument();
    expect(screen.getByText("모델 패키지 관리")).toBeInTheDocument();
  });

  it("explains Bull v4 detail for first-time users", async () => {
    renderAt("/quant/BULL_V4", <QuantModels />, "/quant/:modelCode");

    expect(await screen.findByRole("heading", { name: "Bull v4 모델" })).toBeInTheDocument();
    expect(screen.getByText("5.0.1")).toBeInTheDocument();
    expect(screen.getByText("1억원 paper")).toBeInTheDocument();
    expect(screen.getByText("1종목 1천만원")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "수익률" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "요약" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "후보 선정 규칙" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "손절 / 익절" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "손절 / 익절" }));
    expect(screen.getByRole("heading", { name: "손절 / 익절 규칙" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "자금" }));
    expect(screen.getByText("운영 시드머니는 1억원 paper 기준입니다.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "이번달 수익률" }));
    expect(screen.getByRole("heading", { name: "이번달 수익률" })).toBeInTheDocument();
    expect(screen.getByText("전월 대비")).toBeInTheDocument();
    expect(screen.getByText("+4.56%p")).toBeInTheDocument();
    expect(screen.getAllByText("+4.56%").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "최근 6개월 수익률" })).toBeInTheDocument();
    expect(screen.getByLabelText("최근 6개월 월별 수익률 선 그래프")).toBeInTheDocument();
    expect(screen.queryByText("10%")).not.toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
    expect(screen.getByLabelText("5월 수익률 +4.56%, 전월 대비 +4.56%p")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "5월" })).toHaveAttribute("href", "/quant/BULL_V4?tab=reports&month=2026-05");
    expect(screen.getByRole("heading", { name: "광고 영역" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "요약" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "후보 목록" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "리포트" })).toBeInTheDocument();

    const text = document.body.textContent ?? "";
    expect(text.indexOf("매매 기준")).toBeLessThan(text.indexOf("최근 6개월 수익률"));
  });

  it("filters model list by category", async () => {
    renderAt("/quant", <QuantModels />);

    expect(await screen.findByText("Bull v4 모델")).toBeInTheDocument();
    expect(screen.getByText("Bear Guard 모델")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "하락장" }));

    expect(screen.queryByText("Bull v4 모델")).not.toBeInTheDocument();
    expect(screen.getByText("Bear Guard 모델")).toBeInTheDocument();
  });

  it("shows candidate filters and trade record period filters on Bull v4 detail", async () => {
    renderAt("/quant/BULL_V4", <QuantModels />, "/quant/:modelCode");

    expect(await screen.findByRole("tab", { name: "요약" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "후보 목록" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "거래 내역" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "후보 목록" }));

    expect(screen.getByText("기준일")).toBeInTheDocument();
    expect(screen.getByText("최근 30일")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "거래 내역" }));

    expect(screen.getByRole("tab", { name: "거래 내역", selected: true })).toBeInTheDocument();
    expect(screen.getByText("최근 7일")).toBeInTheDocument();
    expect(screen.getAllByText("매수").length).toBeGreaterThan(0);
    expect(screen.getAllByText("매도").length).toBeGreaterThan(0);
    expect(screen.getByText("+5.12%")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "최근 7일" }));

    expect(screen.getAllByText("삼성전자").length).toBeGreaterThan(0);
  });

  it("orders Bull v4 detail as performance, model rule, ad, and candidate tabs", async () => {
    renderAt("/quant/BULL_V4", <QuantModels />, "/quant/:modelCode");

    expect(await screen.findByRole("heading", { name: "수익률" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "수익금" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "현재 자금" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "이번달 시장상황" })).toBeInTheDocument();
    expect(screen.getAllByText("+12.34%").length).toBeGreaterThan(0);
    expect(screen.getByText("12,340,000원")).toBeInTheDocument();
    expect(screen.getAllByText("112,340,000원").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BULL").length).toBeGreaterThan(0);
    expect(screen.getByText("광고 영역")).toBeInTheDocument();

    const text = document.body.textContent ?? "";
    expect(text.indexOf("Bull v4 모델")).toBeLessThan(text.indexOf("수익률"));
    expect(text.indexOf("수익률")).toBeLessThan(text.indexOf("광고 영역"));
    expect(text.indexOf("광고 영역")).toBeLessThan(text.indexOf("요약"));
    expect(text.indexOf("요약")).toBeLessThan(text.indexOf("후보 목록"));
  });

  it("renders Bull v4 monthly summary page from a chart month", async () => {
    renderAt("/quant/BULL_V4/month/2026-05", <QuantModels />, "/quant/:modelCode/month/:monthKey");

    expect(await screen.findByRole("heading", { name: "2026년 5월 모델 월 요약" })).toBeInTheDocument();
    expect(screen.getByText("모델 상세로")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "월 수익률" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "거래 내용" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "후보 종목" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "이후 향방" })).toBeInTheDocument();
    expect(screen.getAllByText("삼성전자").length).toBeGreaterThan(0);
  });

  it("opens Bull v4 report tab for a selected chart month", async () => {
    renderAt("/quant/BULL_V4?tab=reports&month=2026-05", <QuantModels />, "/quant/:modelCode");

    expect(await screen.findByRole("tab", { name: "리포트", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "2026년 5월 월간 리포트" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2026년 5월 월간 리포트" })).toBeInTheDocument();
    expect(screen.getByText("선택한 월의 수익률, 거래 내용, 후보, 이후 향방을 요약합니다.")).toBeInTheDocument();
    expect(screen.getByText("월 수익률")).toBeInTheDocument();
    expect(screen.getByText("거래 건수")).toBeInTheDocument();
    expect(screen.getByText("중복 제외 종목 수")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "거래 내용" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "후보 종목" })).toBeInTheDocument();
    expect(screen.getByText("기준일")).toBeInTheDocument();
    expect(screen.getByText("최근 30일")).toBeInTheDocument();
    expect(screen.getByText("Bull v4 일간 리포트")).toBeInTheDocument();
  });

  it("shows selected model-authored report detail inside Bull v4 report tab", async () => {
    renderAt("/quant/BULL_V4?tab=reports&report=101", <QuantModels />, "/quant/:modelCode");

    expect(await screen.findByRole("tab", { name: "리포트", selected: true })).toBeInTheDocument();
    expect(screen.getAllByText("Bull v4 일간 리포트").length).toBeGreaterThan(0);
    expect(await screen.findByText("백엔드 리포트 본문")).toBeInTheDocument();
    expect(screen.getByText("체크포인트")).toBeInTheDocument();
  });
});
