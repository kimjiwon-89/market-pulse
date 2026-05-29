import { formatAmount, mockInvestorFlows } from "@/features/mock/marketMockData";
import { Card, Grid, Inline, List, ListItem, Mono, PageHeaderCard, PageShell, PageTitle, SectionTitle } from "@/components/ui/Page";

export function NetBuyingList() {
  return (
    <PageShell $width="1000px">
      <PageHeaderCard>
        <PageTitle>순매수도</PageTitle>
      </PageHeaderCard>
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
