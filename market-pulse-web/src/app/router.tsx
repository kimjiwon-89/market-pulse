import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { IndexDetail } from '@/pages/IndexDetail';
import { InvestorTrend } from '@/pages/InvestorTrend';
import { NetBuyingList } from '@/pages/NetBuyingList';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div>
        <Outlet />
      </div>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'index/:id', element: <IndexDetail /> },
      { path: 'investor', element: <InvestorTrend /> },
      { path: 'net-buy', element: <NetBuyingList /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
