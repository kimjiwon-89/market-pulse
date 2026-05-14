import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { DefaultLayout } from "@/components/common/DefaultLayout";
import { Dashboard } from "@/pages/Dashboard";
import { IndexDetail } from "@/pages/IndexDetail";
import { InvestorTrend } from "@/pages/InvestorTrend";
import { NetBuyingList } from "@/pages/NetBuyingList";
import { MemoList } from "@/pages/MemoList";
import { NewsList } from "@/pages/NewsList";
import { Login } from "@/pages/Login";
import { Admin } from "@/pages/Admin";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "index/:id", element: <IndexDetail /> },
      { path: "investor", element: <InvestorTrend /> },
      { path: "net-buy", element: <NetBuyingList /> },
      { path: "memo", element: <MemoList /> },
      { path: "news", element: <NewsList /> },
      { path: "admin", element: <Admin /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
