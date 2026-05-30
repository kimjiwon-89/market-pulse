import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getInvestorTradeTop, getLastFridayBasicDate, getMarketIndices, getMarketStockRankings } from "@/features/market/api";
import type { InvestorTradeTopItem, InvestorTradeType, InvestorType, MarketIndexItem, MarketStockRanking, MarketStockRankingSort } from "@/features/market/api";
import { formatAmount, mockNews } from "@/features/mock/marketMockData";
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

type MarketRankingMode = "volume" | "tradeAmount";

function MiniLine({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 240;
  const height = 44;
  const padding = 3;
  const points = data.map((value, index) => {
    const x = padding + (index / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = padding + ((max - value) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <SparklineSvg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="최근 지수 흐름">
      <polyline points={points} stroke={positive ? "#ff5b5b" : "#6ea2ff"} />
    </SparklineSvg>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [rankingMode, setRankingMode] = useState<MarketRankingMode>("volume");
  const [rankedStocks, setRankedStocks] = useState<MarketStockRanking[]>([]);
  const [rankingStatus, setRankingStatus] = useState<"loading" | "ready" | "error">("loading");
  const [marketIndices, setMarketIndices] = useState<MarketIndexItem[]>([]);
  const [indexStatus, setIndexStatus] = useState<"loading" | "ready" | "error">("loading");
  const [supplyInvestor, setSupplyInvestor] = useState<InvestorType>("FOREIGN");
  const [supplyTrade, setSupplyTrade] = useState<InvestorTradeType>("BUY");
  const [supplyItems, setSupplyItems] = useState<InvestorTradeTopItem[]>([]);
  const [supplyStatus, setSupplyStatus] = useState<"loading" | "ready" | "error">("loading");
  const rankingDate = useMemo(() => getLastFridayBasicDate(), []);
  const rankingLabel = rankingMode === "volume" ? "거래량" : "거래대금";
  const rankingSort: MarketStockRankingSort = rankingMode === "volume" ? "VOLUME" : "TRADE_AMOUNT";

  useEffect(() => {
    let active = true;
    setIndexStatus("loading");
    getMarketIndices()
      .then((items) => {
        if (!active) return;
        setMarketIndices(items);
        setIndexStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setMarketIndices([]);
        setIndexStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setRankingStatus("loading");
    getMarketStockRankings({ date: rankingDate, sort: rankingSort, limit: 20 })
      .then((items) => {
        if (!active) return;
        setRankedStocks(items);
        setRankingStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setRankedStocks([]);
        setRankingStatus("error");
      });

    return () => {
      active = false;
    };
  }, [rankingDate, rankingSort]);

  useEffect(() => {
    let active = true;
    setSupplyStatus("loading");
    getInvestorTradeTop({ date: rankingDate, investorType: supplyInvestor, tradeType: supplyTrade, market: "ALL", limit: 20 })
      .then((items) => {
        if (!active) return;
        setSupplyItems(items);
        setSupplyStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setSupplyItems([]);
        setSupplyStatus("error");
      });

    return () => {
      active = false;
    };
  }, [rankingDate, supplyInvestor, supplyTrade]);

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

      <MarketIndexRail>
        {indexStatus === "loading" && (
          <IndexMessageCard>
            <SectionTitle>시장 지수</SectionTitle>
            <MutedText>실제 지수 API를 조회하는 중입니다.</MutedText>
          </IndexMessageCard>
        )}
        {indexStatus !== "loading" && marketIndices.length === 0 && (
          <IndexMessageCard>
            <SectionTitle>시장 지수</SectionTitle>
            <MutedText>{indexStatus === "error" ? "지수 API를 조회하지 못했습니다." : "조회된 지수 데이터가 없습니다."}</MutedText>
          </IndexMessageCard>
        )}
        {indexStatus !== "loading" && marketIndices.map((item) => (
          <MarketIndexCard key={item.code} type="button" onClick={() => navigate(`/index/${item.code}`)}>
            <SectionTitle>{item.name}</SectionTitle>
            <ValueText $tone={item.changeRate >= 0 ? "up" : "down"}>{item.value.toLocaleString("ko-KR")}</ValueText>
            <MutedText>
              <Mono>{item.change.toLocaleString("ko-KR")} ({item.changeRate}%)</Mono>
            </MutedText>
            <MarketSparklineBox>
              <MiniLine data={item.trend} positive={item.changeRate >= 0} />
            </MarketSparklineBox>
          </MarketIndexCard>
        ))}
      </MarketIndexRail>

      <Split $right="360px">
        <Stack>
          <MarketTableCard>
            <MarketTableHeader>
              <div>
                <SectionTitle>주요 종목</SectionTitle>
                <SubText>{formatRankingDate(rankingDate)} 기준</SubText>
              </div>
              <MarketRankingToggle aria-label="주요 종목 정렬 기준">
                <MarketRankingButton
                  type="button"
                  $active={rankingMode === "volume"}
                  onClick={() => setRankingMode("volume")}
                >
                  거래량
                </MarketRankingButton>
                <MarketRankingButton
                  type="button"
                  $active={rankingMode === "tradeAmount"}
                  onClick={() => setRankingMode("tradeAmount")}
                >
                  거래대금
                </MarketRankingButton>
              </MarketRankingToggle>
            </MarketTableHeader>
            <MarketTableScroll>
              <DataTable>
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>종목</th>
                    <th>업종</th>
                    <th className="num">{rankingLabel}</th>
                    <th className="num">등락률</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingStatus === "loading" && (
                    <tr>
                      <td colSpan={5}><MarketTableMessage>금요일 기준 주요 종목을 불러오는 중입니다.</MarketTableMessage></td>
                    </tr>
                  )}
                  {rankingStatus !== "loading" && rankedStocks.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <MarketTableMessage>
                          {rankingStatus === "error" ? "주요 종목 API를 조회하지 못했습니다." : "조회된 주요 종목이 없습니다."}
                        </MarketTableMessage>
                      </td>
                    </tr>
                  )}
                  {rankingStatus !== "loading" && rankedStocks.map((stock, index) => (
                    <RowButton key={stock.code} onClick={() => navigate(`/stock/${stock.code}`)}>
                      <td><MarketRank>{stock.rank || index + 1}위</MarketRank></td>
                      <td><strong>{stock.name}</strong><br /><Mono>{stock.code}</Mono></td>
                      <td>{stock.sector || "-"}</td>
                      <td className="num">
                        {rankingMode === "volume" ? formatVolume(stock.volume) : formatAmount(stock.tradeAmount)}
                      </td>
                      <td className="num">
                        <MarketChangeRate $tone={stock.changeRate > 0 ? "up" : stock.changeRate < 0 ? "down" : "flat"}>
                          {formatChangeRate(stock.changeRate)}
                        </MarketChangeRate>
                      </td>
                    </RowButton>
                  ))}
                </tbody>
              </DataTable>
            </MarketTableScroll>
          </MarketTableCard>

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
            <CardHeader>
              <div>
                <SectionTitle>수급 TOP20</SectionTitle>
                <SubText>{formatRankingDate(rankingDate)} 기준</SubText>
              </div>
              <Button
                type="button"
                onClick={() => navigate(`/net-buy?date=${rankingDate}&investorType=${supplyInvestor}&tradeType=${supplyTrade}&market=ALL`)}
              >
                더보기
              </Button>
            </CardHeader>
            <SupplyControls>
              <SupplyToggle aria-label="수급 투자자 필터">
                <SupplyToggleButton type="button" $active={supplyInvestor === "FOREIGN"} onClick={() => setSupplyInvestor("FOREIGN")}>
                  외국인
                </SupplyToggleButton>
                <SupplyToggleButton type="button" $active={supplyInvestor === "INSTITUTION"} onClick={() => setSupplyInvestor("INSTITUTION")}>
                  기관
                </SupplyToggleButton>
              </SupplyToggle>
              <SupplyToggle aria-label="수급 매매 필터">
                <SupplyToggleButton type="button" $active={supplyTrade === "BUY"} onClick={() => setSupplyTrade("BUY")}>
                  순매수
                </SupplyToggleButton>
                <SupplyToggleButton type="button" $active={supplyTrade === "SELL"} onClick={() => setSupplyTrade("SELL")}>
                  순매도
                </SupplyToggleButton>
              </SupplyToggle>
            </SupplyControls>
            <SupplyList>
              {supplyStatus === "loading" && <SupplyMessage>수급 TOP20을 불러오는 중입니다.</SupplyMessage>}
              {supplyStatus !== "loading" && supplyItems.length === 0 && (
                <SupplyMessage>{supplyStatus === "error" ? "수급 API를 조회하지 못했습니다." : "조회된 수급 데이터가 없습니다."}</SupplyMessage>
              )}
              {supplyStatus !== "loading" && supplyItems.map((item) => (
                <ListItem key={`${item.rank}-${item.code}`}>
                  <Inline $justify="space-between" $gap="10px">
                    <span><MarketRank>{item.rank}위</MarketRank> <strong>{item.name}</strong></span>
                    <Mono>{formatAmount(item.amount)}</Mono>
                  </Inline>
                </ListItem>
              ))}
            </SupplyList>
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

function formatVolume(value: number) {
  return `${value.toLocaleString("ko-KR")}주`;
}

function formatChangeRate(value: number) {
  if (!Number.isFinite(value)) return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatRankingDate(value: string) {
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

const MarketIndexRail = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sectionGap};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    display: flex;
    gap: 12px;
    margin-right: -16px;
    overflow-x: auto;
    padding: 0 16px 4px 0;
    scroll-padding-inline: 0 16px;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const MarketIndexCard = styled(ClickCard)`
  min-width: 0;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    flex: 0 0 78%;
    max-width: 360px;
    min-height: 190px;
    scroll-snap-align: start;
  }
`;

const IndexMessageCard = styled(Card)`
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    flex: 0 0 78%;
    max-width: 360px;
    min-height: 160px;
    scroll-snap-align: start;
  }
`;

const MarketSparklineBox = styled.div`
  height: 48px;
  margin-top: 14px;
`;

const MarketTableCard = styled(TableCard)`
  overflow: hidden;
`;

const MarketTableHeader = styled(CardHeader)`
  min-height: 72px;
  margin-bottom: 0;
  padding: 20px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    align-items: flex-start;
    padding: 16px;
  }
`;

const MarketRankingToggle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.color.softPanel};
`;

const MarketRankingButton = styled.button<{ $active: boolean }>`
  min-width: 74px;
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: ${({ $active, theme }) => ($active ? theme.color.accent : "transparent")};
  color: ${({ $active, theme }) => ($active ? "#fff" : theme.color.text)};
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 2px;
  }
`;

const MarketTableScroll = styled(TableScroll)`
  max-height: 392px;
  overflow: auto;

  table {
    border-collapse: separate;
    border-spacing: 0;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
  }
`;

const MarketRank = styled.span`
  display: inline-flex;
  min-width: 36px;
  color: ${({ theme }) => theme.color.textMuted};
  font-weight: 800;
`;

const MarketChangeRate = styled.span<{ $tone: "up" | "down" | "flat" }>`
  color: ${({ $tone, theme }) => {
    if ($tone === "up") return theme.color.up;
    if ($tone === "down") return theme.color.down;
    return theme.color.textMuted;
  }};
  font-weight: 800;
`;

const MarketTableMessage = styled.div`
  padding: 18px 0;
  color: ${({ theme }) => theme.color.textSubtle};
`;

const SupplyControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: nowrap;
`;

const SupplyToggle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.color.softPanel};
`;

const SupplyToggleButton = styled.button<{ $active: boolean }>`
  width: 64px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ $active, theme }) => ($active ? theme.color.accent : "transparent")};
  color: ${({ $active, theme }) => ($active ? "#fff" : theme.color.textMuted)};
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
`;

const SupplyList = styled(List)`
  max-height: 328px;
  overflow-y: auto;
  padding-right: 4px;
`;

const SupplyMessage = styled.div`
  padding: 18px 0;
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 13px;
`;

const SparklineSvg = styled.svg`
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;

  polyline {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3;
    vector-effect: non-scaling-stroke;
  }
`;
