import { useNavigate } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { formatAmount, formatWon, mockIndices, mockInvestorFlows, mockNews, mockStocks } from "@/features/mock/marketMockData";
import { quantDecisions } from "@/features/quant/quantMockData";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Chip,
  ChipRow,
  ClickCard,
  DataTable,
  Grid,
  Inline,
  List,
  ListItem,
  Mono,
  MutedText,
  PageHeaderCard,
  PageHeaderMeta,
  PageShell,
  PageTitle,
  RowButton,
  SectionTitle,
  Split,
  Stack,
  SubText,
  TableCard,
  TableScroll,
  ValueText,
} from "@/components/ui/Page";

function MiniLine({ data, positive }: { data: number[]; positive: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={34}>
      <LineChart data={data.map((value, index) => ({ value, index }))}>
        <Line type="monotone" dataKey="value" dot={false} stroke={positive ? "#d62828" : "#1e5edb"} strokeWidth={1.5} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <PageShell $width="1200px">
      <PageHeaderCard>
        <PageTitle>시장 보기</PageTitle>
        <PageHeaderMeta>
          <Button type="button" onClick={() => navigate("/quant/today")} $primary>
            오늘의 종목 보기
          </Button>
        </PageHeaderMeta>
      </PageHeaderCard>

      <Grid>
        {mockIndices.map((item) => (
          <ClickCard key={item.code} type="button" onClick={() => navigate(`/index/${item.code}`)}>
            <SectionTitle>{item.name}</SectionTitle>
            <ValueText $tone={item.changeRate >= 0 ? "up" : "down"}>{item.value.toLocaleString("ko-KR")}</ValueText>
            <MutedText>
              <Mono>{item.change.toLocaleString("ko-KR")} ({item.changeRate}%)</Mono>
            </MutedText>
            <div>
              <MiniLine data={item.trend} positive={item.changeRate >= 0} />
            </div>
          </ClickCard>
        ))}
      </Grid>

      <Split $right="360px">
        <Stack>
          <TableCard>
            <CardHeader>
              <SectionTitle>주요 종목</SectionTitle>
              <Button type="button" onClick={() => navigate("/quant/today")}>퀀트 신호 확인</Button>
            </CardHeader>
            <TableScroll>
              <DataTable>
                <thead>
                  <tr>
                    <th>종목</th>
                    <th>업종</th>
                    <th className="num">현재가</th>
                    <th className="num">등락률</th>
                  </tr>
                </thead>
                <tbody>
                  {mockStocks.map((stock) => (
                    <RowButton key={stock.code} onClick={() => navigate(`/stock/${stock.code}`)}>
                      <td><strong>{stock.name}</strong><br /><Mono>{stock.code}</Mono></td>
                      <td>{stock.sector}</td>
                      <td className="num">{formatWon(stock.price)}</td>
                      <td className="num">{stock.changeRate}%</td>
                    </RowButton>
                  ))}
                </tbody>
              </DataTable>
            </TableScroll>
          </TableCard>

          <Card>
            <CardHeader>
              <div>
                <SectionTitle>퀀트 모델 신호</SectionTitle>
                <SubText>오늘의 종목과 시장을 같이 봅니다.</SubText>
              </div>
            </CardHeader>
            <Grid $columns="repeat(2, minmax(0, 1fr))">
              {quantDecisions.slice(0, 4).map((item) => (
                <Card key={item.assetCode} $soft $pad="16px">
                  <Inline $justify="space-between">
                    <strong>{item.assetName}</strong>
                    <Badge $tone={item.decisionCode === "WARNING" ? "warning" : item.decisionCode === "BUY" ? "up" : "flat"}>{item.decisionCode}</Badge>
                  </Inline>
                  <MutedText>{item.modelNames.join(", ")}</MutedText>
                  <ChipRow>
                    {item.reasonBullets.slice(0, 2).map((reason) => <Chip key={reason}>{reason}</Chip>)}
                  </ChipRow>
                </Card>
              ))}
            </Grid>
          </Card>
        </Stack>

        <Stack>
          <Card>
            <SectionTitle>수급 TOP</SectionTitle>
            <List>
              {mockInvestorFlows.slice(0, 4).map((flow) => (
                <ListItem key={flow.stockCode}>
                  <Inline $justify="space-between">
                    <span>{flow.rank}. {flow.stockName}</span>
                    <Mono>{formatAmount(flow.netBuyAmount)}</Mono>
                  </Inline>
                </ListItem>
              ))}
            </List>
          </Card>
          <Card>
            <SectionTitle>오늘의 뉴스</SectionTitle>
            <List>
              {mockNews.slice(0, 5).map((news) => (
                <ListItem key={news.id}>
                  <strong>{news.title}</strong>
                  <MutedText>{news.source} · {news.date}</MutedText>
                </ListItem>
              ))}
            </List>
          </Card>
        </Stack>
      </Split>
    </PageShell>
  );
}
