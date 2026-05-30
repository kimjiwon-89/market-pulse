import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import styled from "styled-components";
import { formatWon, mockInvestorFlows, mockNews, mockStocks } from "@/features/mock/marketMockData";
import { quantDecisions } from "@/features/quant/quantMockData";
import { getStockChart, getStockDetail } from "@/features/stock/api";
import type { StockChartItem, StockDetailItem } from "@/features/stock/api";
import { StockLogo } from "@/features/stock/StockLogo";
import { Badge, Card, ChartBox, Chip, ChipRow, Inline, List, ListItem, MutedText, PageHeaderCard, PageHeaderMeta, PageShell, PageTitle, SectionTitle, Split, Stack, SubText, TextLink } from "@/components/ui/Page";

export function StockDetail() {
  const { code } = useParams();
  const fallbackStock = useMemo(() => mockStocks.find((item) => item.code === code) ?? mockStocks[0], [code]);
  const [apiStock, setApiStock] = useState<StockDetailItem | null>(null);
  const [chart, setChart] = useState<StockChartItem[]>([]);
  const stock = apiStock
    ? {
        code: apiStock.code,
        name: apiStock.name,
        market: apiStock.market || fallbackStock.market,
        price: apiStock.currentPrice,
        changeRate: apiStock.changeRate ?? 0,
        sector: apiStock.sector || fallbackStock.sector,
        marketCap: formatMarketCap(apiStock.marketCap),
      }
    : fallbackStock;
  const decision = quantDecisions.find((item) => item.assetCode === stock.code);

  useEffect(() => {
    if (!code) return;
    let canceled = false;
    getStockDetail(code)
      .then((item) => {
        if (!canceled) setApiStock(item);
      })
      .catch(() => {
        if (!canceled) setApiStock(null);
      });
    return () => {
      canceled = true;
    };
  }, [code]);

  useEffect(() => {
    if (!code) return;
    let canceled = false;
    getStockChart(code, "3M")
      .then((items) => {
        if (!canceled) setChart(items);
      })
      .catch(() => {
        if (!canceled) setChart([]);
      });
    return () => {
      canceled = true;
    };
  }, [code]);

  return (
    <PageShell $width="1100px">
      <PageHeaderCard>
        <TitleBlock>
          <StockLogo code={stock.code} name={stock.name} size={48} />
          <PageTitle>{stock.name}</PageTitle>
        </TitleBlock>
        <PageHeaderMeta>
          <TextLink to="/market">시장 보기</TextLink>
          <Badge>{stock.code}</Badge>
          <Badge>{stock.market}</Badge>
          <Badge $tone={stock.changeRate >= 0 ? "up" : "down"}>{stock.changeRate}%</Badge>
        </PageHeaderMeta>
      </PageHeaderCard>

      <Split>
        <Stack>
          <Card>
            <SectionTitle>일봉 종가 추이</SectionTitle>
            <ChartBox $height="280px">
              {chart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <XAxis dataKey="date" tickFormatter={formatChartDate} />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Tooltip
                      labelFormatter={(label) => formatChartDate(String(label))}
                      formatter={(value) => formatWon(Number(value))}
                    />
                    <Line dataKey="close" stroke={stock.changeRate >= 0 ? "#d62828" : "#1e5edb"} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmpty>일봉 차트 데이터가 준비되지 않았습니다.</ChartEmpty>
              )}
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

const TitleBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

function formatMarketCap(value?: number) {
  if (!value) return "-";
  if (Math.abs(value) >= 1_0000_0000_0000) {
    return `${Math.round(value / 1_0000_0000_0000).toLocaleString("ko-KR")}조`;
  }
  if (Math.abs(value) >= 1_0000_0000) {
    return `${Math.round(value / 1_0000_0000).toLocaleString("ko-KR")}억`;
  }
  return formatWon(value);
}

function formatChartDate(value: string) {
  if (value.length === 8) return `${value.slice(4, 6)}.${value.slice(6, 8)}`;
  return value;
}

const ChartEmpty = styled(MutedText)`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
