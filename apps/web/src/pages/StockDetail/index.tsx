import { useParams } from "react-router-dom";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatWon, mockInvestorFlows, mockNews, mockStocks } from "@/features/mock/marketMockData";
import { quantDecisions } from "@/features/quant/quantMockData";
import { Badge, Card, CardHeader, ChartBox, Chip, ChipRow, Inline, List, ListItem, MutedText, PageShell, PageTitle, SectionTitle, Split, Stack, SubText, TextLink, ValueText } from "@/components/ui/Page";

export function StockDetail() {
  const { code } = useParams();
  const stock = mockStocks.find((item) => item.code === code) ?? mockStocks[0];
  const decision = quantDecisions.find((item) => item.assetCode === stock.code);
  const chart = [92, 94, 93, 97, 99, 96, 101].map((value, index) => ({ day: `${index + 1}`, value: value * (stock.price / 100) }));

  return (
    <PageShell $width="1100px">
      <Card>
        <TextLink to="/market">시장 보기</TextLink>
        <CardHeader>
          <div>
            <PageTitle>{stock.name}</PageTitle>
            <MutedText>{stock.code} · {stock.market} · {stock.sector}</MutedText>
          </div>
          <div>
            <ValueText $tone={stock.changeRate >= 0 ? "up" : "down"}>{formatWon(stock.price)}</ValueText>
            <MutedText>{stock.change.toLocaleString("ko-KR")} ({stock.changeRate}%)</MutedText>
          </div>
        </CardHeader>
      </Card>

      <Split>
        <Stack>
          <Card>
            <SectionTitle>가격 흐름</SectionTitle>
            <ChartBox $height="280px">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <XAxis dataKey="day" />
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Tooltip formatter={(value) => formatWon(Number(value))} />
                  <Line dataKey="value" stroke={stock.changeRate >= 0 ? "#d62828" : "#1e5edb"} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
          </Card>
          <Card>
            <SectionTitle>수급 흐름</SectionTitle>
            <ChartBox $height="220px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockInvestorFlows.map((flow) => ({ name: flow.investor, value: flow.netBuyAmount / 100000000 }))}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1e5edb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </Card>
        </Stack>

        <Stack>
          <Card>
            <SectionTitle>퀀트 모델 판단</SectionTitle>
            {decision ? (
              <Stack $gap="12px">
                <Inline>
                  <Badge $tone={decision.decisionCode === "WARNING" ? "warning" : "accent"}>{decision.decisionCode}</Badge>
                  <strong>{decision.decisionLabel}</strong>
                </Inline>
                <ChipRow>{decision.modelNames.map((name) => <Chip key={name}>{name}</Chip>)}</ChipRow>
                <SubText>{decision.reasonBullets.join(", ")}</SubText>
                <MutedText>조심할 점: {decision.cautionBullets.join(", ")}</MutedText>
              </Stack>
            ) : (
              <SubText>오늘 표시된 모델 판단이 없습니다.</SubText>
            )}
          </Card>
          <Card>
            <SectionTitle>기본 정보</SectionTitle>
            <List>
              <ListItem>시가총액 <strong>{stock.marketCap}</strong></ListItem>
              <ListItem>업종 <strong>{stock.sector}</strong></ListItem>
              <ListItem>시장 <strong>{stock.market}</strong></ListItem>
            </List>
          </Card>
          <Card>
            <SectionTitle>관련 뉴스</SectionTitle>
            <List>{mockNews.slice(0, 2).map((news) => <ListItem key={news.id}>{news.title}</ListItem>)}</List>
          </Card>
        </Stack>
      </Split>
    </PageShell>
  );
}
