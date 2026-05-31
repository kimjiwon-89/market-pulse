import { createBrowserRouter, RouterProvider, useRouteError } from "react-router-dom";
import { DefaultLayout } from "@/layout/DefaultLayout";
import { Dashboard } from "@/pages/Dashboard";
import { IndexDetail } from "@/pages/IndexDetail";
import { InvestorTrend } from "@/pages/InvestorTrend";
import { NetBuyingList } from "@/pages/NetBuyingList";
import { MemoList } from "@/pages/MemoList";
import { NewsList } from "@/pages/NewsList";
import { Login } from "@/pages/Login";
import { Admin } from "@/pages/Admin";
import { LottoAnalysis } from "@/pages/LottoAnalysis";
import { StockDetail } from "@/pages/StockDetail";
import { QuantHome } from "@/pages/QuantHome";
import { QuantToday } from "@/pages/QuantToday";
import { QuantModels } from "@/pages/QuantModels";
import { Reports } from "@/pages/Reports";
import { Services } from "@/pages/Services";
import { TarotPage } from "@/pages/Services/TarotPage";
import { MyPage } from "@/pages/MyPage";
import { getRole } from "@/services/apiClient";
import { Card, PageHeaderCard, PageHeaderMeta, PageShell, PageTitle, SubText, TextLink } from "@/components/ui/Page";

function AdminRoute() {
  return getRole() === "ADMIN" ? <Admin /> : (
    <div className="error-block">
      <div className="error-title">관리자 권한이 필요합니다</div>
      <div className="error-msg">검증 기록과 운영 기능은 관리자에게만 표시됩니다.</div>
    </div>
  );
}

function RouteErrorFallback() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : "화면을 불러오는 중 문제가 발생했습니다.";

  return (
    <PageShell $width="760px">
      <PageHeaderCard>
        <PageTitle>화면을 다시 불러와주세요</PageTitle>
        <PageHeaderMeta>
          <TextLink to="/">홈으로</TextLink>
          <TextLink to="/market">시장 보기</TextLink>
        </PageHeaderMeta>
      </PageHeaderCard>
      <Card $soft>
        <SubText>{message}</SubText>
      </Card>
    </PageShell>
  );
}

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <DefaultLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <QuantHome /> },
      { path: "market", element: <Dashboard /> },
      { path: "index/:id", element: <IndexDetail /> },
      { path: "investor", element: <InvestorTrend /> },
      { path: "net-buy", element: <NetBuyingList /> },
      { path: "memo", element: <MemoList /> },
      { path: "news", element: <NewsList /> },
      { path: "admin", element: <AdminRoute /> },
      { path: "lotto", element: <LottoAnalysis /> },
      { path: "services", element: <Services /> },
      { path: "tarot", element: <TarotPage /> },
      { path: "my", element: <MyPage /> },
      { path: "my/:section", element: <MyPage /> },
      { path: "quant", element: <QuantModels /> },
      { path: "quant/today", element: <QuantToday /> },
      { path: "quant/:modelCode/month/:monthKey", element: <QuantModels /> },
      { path: "quant/:modelCode", element: <QuantModels /> },
      { path: "reports", element: <Reports /> },
      { path: "reports/:reportId", element: <Reports /> },
      { path: "stock/:code", element: <StockDetail /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
