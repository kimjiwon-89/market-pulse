import { formatAmount, mockInvestorFlows } from "@/features/mock/marketMockData";
import { Card, Grid, Inline, List, ListItem, Mono, PageShell, PageTitle, SectionTitle, SubText } from "@/components/ui/Page";

export function NetBuyingList() {
  return (
    <PageShell $width="1000px">
      <Card>
        <PageTitle>순매수도</PageTitle>
        <SubText>투자자별 자금 흐름을 비교해 종목별 수급 온도를 확인합니다.</SubText>
      </Card>
      <Grid $columns="repeat(2, minmax(0, 1fr))">
        {["외국인", "기관"].map((investor) => (
          <Card key={investor}>
            <SectionTitle>{investor} 순매수</SectionTitle>
            <List>
              {mockInvestorFlows.filter((flow) => flow.investor === investor || investor === "외국인").slice(0, 4).map((flow) => (
                <ListItem key={`${investor}-${flow.stockCode}`}>
                  <Inline $justify="space-between">
                    <span>{flow.stockName}</span>
                    <Mono>{formatAmount(flow.netBuyAmount)}</Mono>
                  </Inline>
                </ListItem>
              ))}
            </List>
          </Card>
        ))}
      </Grid>
    </PageShell>
  );
}
