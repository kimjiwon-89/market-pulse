import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { DefaultLayout } from "@/components/common/DefaultLayout";
import { Dashboard } from "@/pages/Dashboard";
import { IndexDetail } from "@/pages/IndexDetail";
import { InvestorTrend } from "@/pages/InvestorTrend";
import { NetBuyingList } from "@/pages/NetBuyingList";
import { MemoList } from "@/pages/MemoList";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "index/:id", element: <IndexDetail /> },
      { path: "investor", element: <InvestorTrend /> },
      { path: "net-buy", element: <NetBuyingList /> },
      { path: "memo", element: <MemoList /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
