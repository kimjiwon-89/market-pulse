import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
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
import { QuantToday } from "./QuantToday";
import { Reports } from "./Reports";
import { Services } from "./Services";
import { TarotPage } from "./Services/TarotPage";
import { StockDetail } from "./StockDetail";

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
    ["오늘의 종목", "/quant/today", <QuantToday />],
    ["모델 목록", "/quant", <QuantModels />],
    ["리포트", "/reports", <Reports />],
  ])("renders %s page", (heading, path, element) => {
    renderAt(path, element);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("renders index detail", () => {
    renderAt("/index/0001", <IndexDetail />, "/index/:id");
    expect(screen.getByRole("heading", { name: "KOSPI" })).toBeInTheDocument();
  });

  it("renders stock detail", () => {
    renderAt("/stock/000660", <StockDetail />, "/stock/:code");
    expect(screen.getByRole("heading", { name: "SK하이닉스" })).toBeInTheDocument();
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

  it("keeps market page attached to quant decisions", () => {
    renderAt("/market", <Dashboard />);
    expect(screen.getByText("퀀트 모델 신호")).toBeInTheDocument();
    expect(screen.getByText("오늘의 종목과 시장을 같이 봅니다.")).toBeInTheDocument();
  });

  it("renders quant report detail with user-facing body sections", () => {
    renderAt("/reports/report-20260528-am", <Reports />, "/reports/:reportId");
    expect(screen.getByText("핵심 판단")).toBeInTheDocument();
    expect(screen.getByText("모델 근거")).toBeInTheDocument();
    expect(screen.getByText("사용자 체크포인트")).toBeInTheDocument();
  });

  it("renders services as separated production serving entries", () => {
    renderAt("/services", <Services />);
    expect(screen.getByText("로또 분석")).toBeInTheDocument();
    expect(screen.getByText("타로 리딩")).toBeInTheDocument();
  });
});
