import { formatAmount, mockInvestorFlows } from "@/features/mock/marketMockData";
import { Badge, DataTable, PageHeaderCard, PageShell, PageTitle, TableCard, TableScroll } from "@/components/ui/Page";

export function InvestorTrend() {
  return (
    <PageShell $width="1000px">
      <PageHeaderCard>
        <PageTitle>투자자 동향</PageTitle>
      </PageHeaderCard>
      <TableCard>
        <TableScroll>
          <DataTable>
            <thead><tr><th>순위</th><th>종목</th><th>투자자</th><th className="num">순매수</th><th className="num">등락률</th></tr></thead>
            <tbody>
              {mockInvestorFlows.map((flow) => (
                <tr key={`${flow.rank}-${flow.stockCode}`}>
                  <td>{flow.rank}</td>
                  <td>{flow.stockName}</td>
                  <td><Badge $tone="accent">{flow.investor}</Badge></td>
                  <td className="num">{formatAmount(flow.netBuyAmount)}</td>
                  <td className="num">{flow.changeRate}%</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </TableScroll>
      </TableCard>
    </PageShell>
  );
}
