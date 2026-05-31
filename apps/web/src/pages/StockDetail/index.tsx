import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type WheelEvent } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { formatWon, mockNews, mockStocks } from "@/features/mock/marketMockData";
import { getQuantModelDetail } from "@/features/quant/api";
import type { QuantCandidateHistoryItem, QuantTradeHistoryItem } from "@/features/quant/quantTypes";
import {
  getStockChart,
  getStockDetail,
  getStockDisclosures,
  getStockInvestor,
  getStockMinuteChart,
  getStockOrderbook,
  getStockReports,
} from "@/features/stock/api";
import type {
  StockChartItem,
  StockDetailItem,
  StockDisclosureItem,
  StockInvestorItem,
  StockMinuteCandleItem,
  StockOrderbookItem,
  StockReportItem,
} from "@/features/stock/api";
import { StockLogo } from "@/features/stock/StockLogo";
import { getToken } from "@/services/apiClient";
import {
  Badge,
  Card,
  Chip,
  ChipRow,
  DataTable,
  Grid,
  Inline,
  List,
  ListItem,
  MutedText,
  PageHeaderCard,
  PageHeaderMeta,
  PageShell,
  PageTitle,
  SectionTitle,
  Stack,
  SubText,
  TableCard,
  TableScroll,
  TextLink,
  ValueText,
} from "@/components/ui/Page";

type ChartMode = "minute" | "day" | "week" | "month" | "year";
const MAX_CHART_ZOOM = 3;

const CHART_VISIBLE_COUNTS: Record<ChartMode, number[]> = {
  minute: [30, 20, 10, 5],
  day: [80, 45, 25, 12],
  week: [52, 36, 24, 12],
  month: [36, 24, 18, 12],
  year: [10, 8, 6, 4],
};

const CHART_DRAG_SENSITIVITY = 1.8;
const CHART_PAN_WHEEL_THRESHOLD = 34;
const CHART_ZOOM_WHEEL_THRESHOLD = 10;
const CHART_PINCH_THRESHOLD = 0.12;

const EMPTY_INVESTOR: StockInvestorItem = {
  foreignBuy: 0,
  foreignSell: 0,
  foreignNet: 0,
  institutionBuy: 0,
  institutionSell: 0,
  institutionNet: 0,
  individualBuy: 0,
  individualSell: 0,
  individualNet: 0,
};

export function StockDetail() {
  const { code } = useParams();
  const effectiveCode = code ?? "";
  const fallbackStock = useMemo(
    () => mockStocks.find((item) => item.code === code) ?? {
      code: effectiveCode || "UNKNOWN",
      name: effectiveCode ? `종목 ${effectiveCode}` : "종목 정보 없음",
      market: "시장 미확인",
      sector: "업종 미확인",
      price: 0,
      changeRate: 0,
      marketCap: "-",
      volume: 0,
    },
    [code, effectiveCode],
  );
  const [detail, setDetail] = useState<StockDetailItem | null>(null);
  const [chart, setChart] = useState<StockChartItem[]>([]);
  const [chartMode, setChartMode] = useState<ChartMode>("day");
  const [investor, setInvestor] = useState<StockInvestorItem>(EMPTY_INVESTOR);
  const [minutes, setMinutes] = useState<StockMinuteCandleItem[]>([]);
  const [orderbook, setOrderbook] = useState<StockOrderbookItem | null>(null);
  const [disclosures, setDisclosures] = useState<StockDisclosureItem[]>([]);
  const [reports, setReports] = useState<StockReportItem[]>([]);
  const [quantCandidates, setQuantCandidates] = useState<QuantCandidateHistoryItem[]>([]);
  const [quantTrades, setQuantTrades] = useState<QuantTradeHistoryItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCandle, setSelectedCandle] = useState<StockChartItem | null>(null);
  const [chartZoom, setChartZoom] = useState(0);
  const [chartPanOffset, setChartPanOffset] = useState(0);

  const stock = detail
    ? {
        code: detail.code,
        name: detail.name,
        market: detail.market || fallbackStock.market,
        price: detail.currentPrice,
        changeRate: detail.changeRate ?? 0,
        sector: detail.sector || fallbackStock.sector,
        marketCap: formatMarketCap(detail.marketCap),
        openPrice: detail.openPrice,
        highPrice: detail.highPrice,
        lowPrice: detail.lowPrice,
        volume: detail.volume,
        tradingValue: detail.tradingValue,
        per: detail.per,
        pbr: detail.pbr,
        weekHigh: detail.weekHigh,
        weekLow: detail.weekLow,
      }
    : {
        ...fallbackStock,
        price: fallbackStock.price,
        openPrice: undefined,
        highPrice: undefined,
        lowPrice: undefined,
        volume: fallbackStock.volume,
        tradingValue: undefined,
        per: undefined,
        pbr: undefined,
        weekHigh: undefined,
        weekLow: undefined,
      };

  useEffect(() => {
    if (!effectiveCode) return;
    let canceled = false;

    getStockDetail(effectiveCode)
      .then((item) => {
        if (!canceled) {
          setDetail(item);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (!canceled) setLoadError("종목 요약 데이터를 불러오지 못했습니다.");
      });

    Promise.all([
      getStockChart(effectiveCode, "3M").catch(() => []),
      getStockInvestor(effectiveCode).catch(() => EMPTY_INVESTOR),
      getStockMinuteChart(effectiveCode).catch(() => []),
      getStockOrderbook(effectiveCode).catch(() => null),
      getStockDisclosures(effectiveCode).catch(() => []),
      getStockReports(effectiveCode).catch(() => []),
      getQuantModelDetail("BULL_V4").catch(() => ({ candidates: [], trades: [] })),
    ]).then(([chartItems, investorItem, minuteItems, orderbookItem, disclosureItems, reportItems, quantDetail]) => {
      if (canceled) return;
      setChart(chartItems);
      setInvestor(investorItem);
      setMinutes(minuteItems);
      setOrderbook(orderbookItem);
      setDisclosures(disclosureItems);
      setReports(reportItems);
      setQuantCandidates(quantDetail.candidates.filter((item) => item.assetCode === effectiveCode));
      setQuantTrades(quantDetail.trades.filter((item) => item.assetCode === effectiveCode));
    });

    return () => {
      canceled = true;
    };
  }, [effectiveCode]);

  const financialChartData = useMemo(
    () => chartMode === "minute" ? mapMinuteCandles(minutes) : aggregateChart(chart, chartMode),
    [chart, chartMode, minutes],
  );
  const visibleCount = getVisibleCount(chartMode, chartZoom);
  const maxPanOffset = Math.max(0, financialChartData.length - visibleCount);
  const safeChartPanOffset = clamp(chartPanOffset, 0, maxPanOffset);
  const filteredNews = useMemo(() => {
    const name = stock.name.toLowerCase();
    return mockNews.filter((item) => `${item.title} ${item.summary}`.toLowerCase().includes(name)).slice(0, 3);
  }, [stock.name]);
  const isLoggedIn = Boolean(getToken());
  const hasQuantSignal = quantCandidates.length > 0 || quantTrades.length > 0;

  return (
    <PageShell $width="1180px">
      <PageHeaderCard>
        <TitleBlock>
          <StockLogo code={stock.code} name={stock.name} size={46} />
          <div>
            <PageTitle>{stock.name}</PageTitle>
            <MutedText>{stock.code} · {stock.market} · {stock.sector}</MutedText>
          </div>
        </TitleBlock>
        <PageHeaderMeta>
          <TextLink to="/market">시장 보기</TextLink>
          <Badge $tone={stock.changeRate >= 0 ? "up" : "down"}>{formatPercent(stock.changeRate)}</Badge>
          <Badge>{formatWon(stock.price)}</Badge>
        </PageHeaderMeta>
      </PageHeaderCard>

      {loadError ? <NoticeCard>{loadError} 현재 화면은 사용 가능한 보조 데이터와 기본 fallback으로 표시됩니다.</NoticeCard> : null}

      <TopGrid>
        <Card>
          <SectionTitle>요약</SectionTitle>
          <KpiGrid>
            <Metric label="현재가" value={formatWon(stock.price)} tone={stock.changeRate >= 0 ? "up" : "down"} />
            <Metric label="등락률" value={formatPercent(stock.changeRate)} tone={stock.changeRate >= 0 ? "up" : "down"} />
            <Metric label="거래량" value={formatNumber(stock.volume)} />
            <Metric label="거래대금" value={formatLargeWon(stock.tradingValue, false)} />
            <Metric label="시가총액" value={stock.marketCap} />
            <Metric label="52주 범위" value={formatRange(stock.weekLow, stock.weekHigh)} />
          </KpiGrid>
          <PriceStrip>
            <span>시가 {formatWonValue(stock.openPrice)}</span>
            <span>고가 {formatWonValue(stock.highPrice)}</span>
            <span>저가 {formatWonValue(stock.lowPrice)}</span>
            <span>PER {formatRatio(stock.per)}</span>
            <span>PBR {formatRatio(stock.pbr)}</span>
          </PriceStrip>
        </Card>

        <AdSlot aria-label="광고 영역">
          <AdLabel>광고</AdLabel>
          <AdMark>AD</AdMark>
        </AdSlot>

        <Card>
          <Inline $justify="space-between" $wrap>
            <SectionTitle>퀀트 판단</SectionTitle>
            <Chip>Bull v4</Chip>
          </Inline>
          {hasQuantSignal ? (
            <Stack $gap="12px">
              <SubText>이 종목은 Bull v4 후보/거래 기록에 포함되어 있습니다.</SubText>
              <ChipRow>
                <Chip>{quantCandidates.length}개 후보</Chip>
                <Chip>{quantTrades.length}개 거래</Chip>
              </ChipRow>
              {quantCandidates.slice(0, 2).map((item) => (
                <SignalRow key={`${item.assetCode}-${item.date}-${item.label}`}>
                  <strong>{item.label}</strong>
                  <span>{item.date} · {item.reason}</span>
                </SignalRow>
              ))}
            </Stack>
          ) : (
            <EmptyPanel>
              <strong>오늘 모델 후보에는 없습니다.</strong>
              <MutedText>후보가 없다는 뜻은 매도/매수 신호가 아니라, 현재 공개 모델 조건에 포함되지 않았다는 의미입니다.</MutedText>
            </EmptyPanel>
          )}
        </Card>
      </TopGrid>

      <MainGrid>
        <Stack>
          <FinancialChartCard>
            <FinancialToolbar>
              <ChartTabs role="tablist" aria-label="차트 주기">
                {[
                  ["minute", "1분"],
                  ["day", "일"],
                  ["week", "주"],
                  ["month", "월"],
                  ["year", "년"],
                ].map(([value, label]) => (
                  <ChartTab
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={chartMode === value}
                    $active={chartMode === value}
                    onClick={() => {
                      setChartMode(value as ChartMode);
                      setSelectedCandle(null);
                      setChartZoom(0);
                      setChartPanOffset(0);
                    }}
                  >
                    {label}
                  </ChartTab>
                ))}
              </ChartTabs>
              <ZoomControls aria-label="차트 확대 축소">
                <ZoomButton
                  type="button"
                  aria-label="이전 구간"
                  disabled={safeChartPanOffset >= maxPanOffset}
                  onClick={() => setChartPanOffset((value) => clamp(value + Math.ceil(visibleCount / 2), 0, maxPanOffset))}
                >
                  ←
                </ZoomButton>
                <ZoomButton
                  type="button"
                  aria-label="축소"
                  disabled={chartZoom === 0}
                  onClick={() => setChartZoom((value) => Math.max(0, value - 1))}
                >
                  −
                </ZoomButton>
                <ZoomButton
                  type="button"
                  aria-label="확대"
                  disabled={chartZoom === MAX_CHART_ZOOM}
                  onClick={() => setChartZoom((value) => Math.min(MAX_CHART_ZOOM, value + 1))}
                >
                  +
                </ZoomButton>
                <ZoomButton
                  type="button"
                  aria-label="다음 구간"
                  disabled={safeChartPanOffset === 0}
                  onClick={() => setChartPanOffset((value) => clamp(value - Math.ceil(visibleCount / 2), 0, maxPanOffset))}
                >
                  →
                </ZoomButton>
              </ZoomControls>
            </FinancialToolbar>
            <ChartInfoLine>
              {selectedCandle ? (
                <>
                  <span>시가 {formatWon(selectedCandle.open)}</span>
                  <PriceUp>고가 {formatWon(selectedCandle.high)}</PriceUp>
                  <PriceDown>저가 {formatWon(selectedCandle.low)}</PriceDown>
                  <span>종가 {formatWon(selectedCandle.close)}</span>
                </>
              ) : financialChartData.length === 0 ? (
                <span>{chartMode === "minute" ? "분봉 데이터가 없습니다." : "차트 데이터가 준비되지 않았습니다."}</span>
              ) : null}
            </ChartInfoLine>
            <FinancialChartBox>
              {financialChartData.length > 0 ? (
                <CandleChart
                  data={financialChartData}
                  mode={chartMode}
                  zoomLevel={chartZoom}
                  panOffset={safeChartPanOffset}
                  ariaLabel="가격 캔들 차트"
                  selectedDate={selectedCandle?.date ?? null}
                  onSelect={setSelectedCandle}
                  onZoom={setChartZoom}
                  onPanOffsetChange={setChartPanOffset}
                />
              ) : (
                <EmptyPanel>{chartMode === "minute" ? "분봉 데이터가 없습니다. KIS 분봉 응답 또는 저장된 분봉 테이블이 필요합니다." : "차트 데이터가 준비되지 않았습니다."}</EmptyPanel>
              )}
            </FinancialChartBox>
          </FinancialChartCard>

          <Grid $columns="minmax(0, 1fr) minmax(0, 1fr)">
            <Card>
              <Inline $justify="space-between" $wrap>
                <SectionTitle>호가</SectionTitle>
                <Badge>읽기 전용</Badge>
              </Inline>
              <SubText>읽기 전용 호가입니다. 주문 기능은 제공하지 않습니다.</SubText>
              {orderbook && (orderbook.asks.length > 0 || orderbook.bids.length > 0) ? (
                <OrderbookGrid>
                  <OrderbookSide title="매도" levels={orderbook.asks} />
                  <OrderbookSide title="매수" levels={orderbook.bids} />
                </OrderbookGrid>
              ) : (
                <EmptyPanel>KIS 호가 credentials 또는 응답 데이터가 없으면 비워둡니다.</EmptyPanel>
              )}
              <MutedText>예상가 {formatWonValue(orderbook?.expectedPrice)} · 예상수량 {formatNumber(orderbook?.expectedVolume)}</MutedText>
            </Card>

            <Card>
              <Inline $justify="space-between" $wrap>
                <SectionTitle>최근 체결 스냅샷</SectionTitle>
                <Badge>REST snapshot</Badge>
              </Inline>
              <SubText>실시간 streaming이 아니라 최근 REST 조회 결과입니다.</SubText>
              {minutes.length > 0 ? (
                <CompactRows>
                  {minutes.slice(0, 6).map((item) => (
                    <CompactRow key={`${item.time}-${item.close}`}>
                      <span>{formatMinuteTime(item.time)}</span>
                      <strong>{formatWon(item.close)}</strong>
                      <span>{formatNumber(item.volume)}주</span>
                    </CompactRow>
                  ))}
                </CompactRows>
              ) : (
                <EmptyPanel>최근 분봉 스냅샷이 없습니다.</EmptyPanel>
              )}
            </Card>
          </Grid>

          <Card>
            <SectionTitle>수급</SectionTitle>
            <InvestorGrid>
              <InvestorCard title="외국인" buy={investor.foreignBuy} sell={investor.foreignSell} net={investor.foreignNet} />
              <InvestorCard title="기관" buy={investor.institutionBuy} sell={investor.institutionSell} net={investor.institutionNet} />
              <InvestorCard title="개인" buy={investor.individualBuy} sell={investor.individualSell} net={investor.individualNet} />
            </InvestorGrid>
          </Card>
        </Stack>

        <Stack>
          <Card>
            <SectionTitle>뉴스 / 공시</SectionTitle>
            <List>
              {disclosures.slice(0, 4).map((item) => (
                <ListItem key={`${item.title}-${item.filedAt}`}>
                  <strong>{item.title}</strong>
                  <MutedText>{item.source ?? "OpenDART"} · {formatDateText(item.filedAt)}</MutedText>
                </ListItem>
              ))}
              {reports.slice(0, 3).map((item) => (
                <ListItem key={`${item.title}-${item.publishedAt}`}>
                  <strong>{item.title}</strong>
                  <SubText>{item.summary ?? "리포트 메타데이터만 표시합니다."}</SubText>
                  <MutedText>{item.source ?? "리포트"} · {formatDateText(item.publishedAt)} · {item.licenseStatus ?? "metadata-only"}</MutedText>
                </ListItem>
              ))}
              {filteredNews.map((item) => (
                <ListItem key={item.id}>
                  <strong>{item.title}</strong>
                  <SubText>{item.summary}</SubText>
                  <MutedText>{item.source} · {item.date}</MutedText>
                </ListItem>
              ))}
            </List>
            {disclosures.length + reports.length + filteredNews.length === 0 ? (
              <EmptyPanel>종목명 기준으로 매칭된 뉴스/공시가 없습니다.</EmptyPanel>
            ) : null}
          </Card>

          <Card>
            <SectionTitle>메모</SectionTitle>
            {isLoggedIn ? (
              <Stack $gap="10px">
                <SubText>이 종목에 연결된 메모를 메모 화면에서 작성하고 관리합니다.</SubText>
                <TextLink to={`/memo?stockCode=${stock.code}`}>종목 메모 열기</TextLink>
              </Stack>
            ) : (
              <EmptyPanel>
                <strong>종목 메모는 로그인 후 사용할 수 있습니다.</strong>
                <MutedText>메모는 종목 코드와 연결해 저장됩니다.</MutedText>
              </EmptyPanel>
            )}
          </Card>

          <TableCard>
            <TableScroll>
              <DataTable>
                <thead>
                  <tr>
                    <th>항목</th>
                    <th className="num">값</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>시장</td><td className="num">{stock.market}</td></tr>
                  <tr><td>업종</td><td className="num">{stock.sector}</td></tr>
                  <tr><td>시가총액</td><td className="num">{stock.marketCap}</td></tr>
                  <tr><td>거래대금</td><td className="num">{formatLargeWon(stock.tradingValue, false)}</td></tr>
                  <tr><td>52주 고가</td><td className="num">{formatWonValue(stock.weekHigh)}</td></tr>
                  <tr><td>52주 저가</td><td className="num">{formatWonValue(stock.weekLow)}</td></tr>
                </tbody>
              </DataTable>
            </TableScroll>
          </TableCard>
        </Stack>
      </MainGrid>
    </PageShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "flat" }) {
  return (
    <MetricBox>
      <MutedText>{label}</MutedText>
      <ValueText $tone={tone}>{value}</ValueText>
    </MetricBox>
  );
}

function InvestorCard({ title, buy, sell, net }: { title: string; buy: number; sell: number; net: number }) {
  return (
    <InvestorBox>
      <Inline $justify="space-between">
        <strong>{title}</strong>
        <Badge $tone={net >= 0 ? "up" : "down"}>{formatLargeWon(net)}</Badge>
      </Inline>
      <MutedText>매수 {formatLargeWon(buy, false)}</MutedText>
      <MutedText>매도 {formatLargeWon(sell, false)}</MutedText>
    </InvestorBox>
  );
}

function OrderbookSide({ title, levels }: { title: string; levels: { level: number; price: number; volume: number }[] }) {
  return (
    <OrderbookColumn>
      <MutedText>{title}</MutedText>
      {levels.slice(0, 5).map((level) => (
        <CompactRow key={`${title}-${level.level}-${level.price}`}>
          <span>{level.level}</span>
          <strong>{formatWon(level.price)}</strong>
          <span>{formatNumber(level.volume)}</span>
        </CompactRow>
      ))}
    </OrderbookColumn>
  );
}

function CandleChart({
  data,
  mode,
  zoomLevel,
  panOffset,
  ariaLabel,
  selectedDate,
  onSelect,
  onZoom,
  onPanOffsetChange,
}: {
  data: StockChartItem[];
  mode: ChartMode;
  zoomLevel: number;
  panOffset: number;
  ariaLabel: string;
  selectedDate: string | null;
  onSelect: (item: StockChartItem) => void;
  onZoom: (updater: (value: number) => number) => void;
  onPanOffsetChange: (updater: (value: number) => number) => void;
}) {
  const [hoverPoint, setHoverPoint] = useState<{ index: number; x: number; y: number; price: number } | null>(null);
  const [dragState, setDragState] = useState<{ pointerId: number; x: number; panOffset: number; moved: boolean } | null>(null);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStateRef = useRef<{ distance: number; zoomLevel: number } | null>(null);
  const visibleCount = getVisibleCount(mode, zoomLevel);
  const maxPanOffset = Math.max(0, data.length - visibleCount);
  const end = data.length - clamp(panOffset, 0, maxPanOffset);
  const start = Math.max(0, end - visibleCount);
  const points = data.slice(start, end);
  const prices = points.flatMap((item) => [item.open, item.high, item.low, item.close]).filter((value) => Number.isFinite(value));
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const rawRange = rawMax - rawMin || Math.max(rawMax * 0.02, 1);
  const min = rawMin - rawRange * 0.08;
  const max = rawMax + rawRange * 0.14;
  const range = max - min || 1;
  const width = 980;
  const height = 300;
  const left = 24;
  const right = 112;
  const top = 18;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const rawSlot = plotWidth / Math.max(points.length, 1);
  const slot = points.length < 16 ? Math.min(76, rawSlot) : rawSlot;
  const usedWidth = slot * Math.max(points.length, 1);
  const startX = left + Math.max(0, (plotWidth - usedWidth) / 2);
  const bodyWidth = Math.max(6, Math.min(points.length < 16 ? 42 : 14, slot * 0.72));
  const y = (value: number) => top + ((max - value) / range) * plotHeight;
  const x = (index: number) => startX + slot * index + slot / 2;
  const ticks = [max, min + range / 2, min];
  const last = points[points.length - 1];
  const lastY = last ? y(last.close) : top;
  const hoveredCandle = hoverPoint ? points[hoverPoint.index] : null;
  const compactAxisLabel = points.length > 10;

  const resolveHoverPoint = (event: MouseEvent<SVGSVGElement> | PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const renderedWidth = bounds.width || width;
    const renderedHeight = bounds.height || height;
    const mouseX = ((event.clientX - bounds.left) / renderedWidth) * width;
    const mouseY = ((event.clientY - bounds.top) / renderedHeight) * height;
    const index = Math.max(0, Math.min(points.length - 1, Math.round((mouseX - startX - slot / 2) / slot)));
    const boundedY = Math.max(top, Math.min(top + plotHeight, mouseY));
    return {
      index,
      x: x(index),
      y: boundedY,
      price: max - ((boundedY - top) / plotHeight) * range,
    };
  };

  const panBySlots = (slotDelta: number) => {
    onPanOffsetChange((value) => clamp(value + slotDelta, 0, maxPanOffset));
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      if (Math.abs(event.deltaX) >= CHART_PAN_WHEEL_THRESHOLD) {
        panBySlots(event.deltaX > 0 ? -1 : 1);
      }
      return;
    }
    if (Math.abs(event.deltaY) >= CHART_ZOOM_WHEEL_THRESHOLD) {
      onZoom((value) => clamp(value + (event.deltaY < 0 ? 1 : -1), 0, MAX_CHART_ZOOM));
    }
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const activePointers = Array.from(activePointersRef.current.values());
    if (activePointers.length === 2) {
      pinchStateRef.current = { distance: distanceBetween(activePointers[0], activePointers[1]), zoomLevel };
      setDragState(null);
      return;
    }
    setDragState({ pointerId: event.pointerId, x: event.clientX, panOffset, moved: false });
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const activePointers = Array.from(activePointersRef.current.values());
    if (activePointers.length >= 2 && pinchStateRef.current) {
      const nextDistance = distanceBetween(activePointers[0], activePointers[1]);
      const ratio = nextDistance / Math.max(pinchStateRef.current.distance, 1);
      if (Math.abs(ratio - 1) >= CHART_PINCH_THRESHOLD) {
        const zoomDelta = ratio > 1 ? 1 : -1;
        const nextZoom = clamp(pinchStateRef.current.zoomLevel + zoomDelta, 0, MAX_CHART_ZOOM);
        onZoom(() => nextZoom);
        pinchStateRef.current = { distance: nextDistance, zoomLevel: nextZoom };
      }
      return;
    }
    setHoverPoint(resolveHoverPoint(event));
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const delta = event.clientX - dragState.x;
    const slotDelta = Math.trunc(-delta / Math.max(slot * CHART_DRAG_SENSITIVITY, 1));
    if (slotDelta !== 0) {
      onPanOffsetChange(() => clamp(dragState.panOffset + slotDelta, 0, maxPanOffset));
      setDragState((state) => state ? { ...state, moved: true } : state);
    }
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStateRef.current = null;
    }
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!dragState.moved) {
      const point = resolveHoverPoint(event);
      const item = points[point.index];
      if (item) {
        setHoverPoint(point);
        onSelect(item);
      }
    }
    setDragState(null);
  };

  return (
    <ChartSvg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={(event) => {
        activePointersRef.current.delete(event.pointerId);
        pinchStateRef.current = null;
        setDragState(null);
      }}
      onMouseLeave={() => {
        setHoverPoint(null);
        setDragState(null);
      }}
    >
      <ChartPointerSurface x={left} y={top} width={plotWidth} height={plotHeight} />
      {ticks.map((tick) => (
        <g key={tick}>
          <GridLine x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} />
          <RightAxisLabel x={width - right + 14} y={y(tick) + 5}>{formatCompactPrice(tick)}</RightAxisLabel>
        </g>
      ))}
      <GuideLine x1={left} x2={width - right} y1={lastY} y2={lastY} />
      {hoverPoint && hoveredCandle ? (
        <>
          <HoverBand
            x={hoverPoint.x - Math.max(bodyWidth + 10, slot * 0.42) / 2}
            y={top}
            width={Math.max(bodyWidth + 10, slot * 0.42)}
            height={plotHeight}
            rx={6}
          />
          <CrosshairLine x1={hoverPoint.x} x2={hoverPoint.x} y1={top} y2={top + plotHeight} />
          <CrosshairLine x1={left} x2={width - right} y1={hoverPoint.y} y2={hoverPoint.y} />
        </>
      ) : null}
      {points.map((item, index) => {
        const center = x(index);
        const up = item.close >= item.open;
        const bodyTop = y(Math.max(item.open, item.close));
        const bodyBottom = y(Math.min(item.open, item.close));
        const bodyHeight = Math.max(2, bodyBottom - bodyTop);
        const selected = selectedDate === item.date;
        const hovered = hoverPoint?.index === index;
        return (
          <g key={`${item.date}-${index}`}>
            <WickLine x1={center} x2={center} y1={y(item.high)} y2={y(item.low)} $up={up} />
            <CandleBody
              role="button"
              tabIndex={0}
              aria-label={`${item.date} 캔들`}
              x={center - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={bodyHeight}
              rx={1.5}
              $up={up}
              $selected={selected}
              $hovered={hovered}
              onClick={() => onSelect(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(item);
                }
              }}
            />
          </g>
        );
      })}
      {pickLabels(points, mode).map(({ item, index, label }) => (
        <BottomAxisLabel key={`${item.date}-label`} x={x(index)} y={height - 10} textAnchor="middle">
          {compactAxisLabel ? formatCompactAxisLabel(label) : label}
        </BottomAxisLabel>
      ))}
      {last ? (
        <>
          <PriceMarker x={width - right + 2} y={lastY - 16} width={86} height={32} rx={4} />
          <PriceMarkerText x={width - right + 45} y={lastY + 5} textAnchor="middle">{Math.round(last.close).toLocaleString("ko-KR")}</PriceMarkerText>
        </>
      ) : null}
      {hoverPoint && hoveredCandle ? (
        <g pointerEvents="none" data-testid="chart-crosshair">
          <HoverPriceMarker x={width - right + 2} y={hoverPoint.y - 14} width={86} height={28} rx={4} />
          <HoverMarkerText x={width - right + 45} y={hoverPoint.y + 5} textAnchor="middle">
            {Math.round(hoverPoint.price).toLocaleString("ko-KR")}
          </HoverMarkerText>
          <HoverDateMarker x={hoverPoint.x - 42} y={height - 34} width={84} height={28} rx={4} />
          <HoverMarkerText x={hoverPoint.x} y={height - 15} textAnchor="middle">
            {formatChartDate(hoveredCandle.date)}
          </HoverMarkerText>
        </g>
      ) : null}
    </ChartSvg>
  );
}

function aggregateChart(items: StockChartItem[], mode: ChartMode) {
  if (mode === "day") return items;
  const buckets = new Map<string, StockChartItem[]>();
  items.forEach((item) => {
    const key = mode === "year" ? item.date.slice(0, 4) : mode === "month" ? item.date.slice(0, 6) : weekKey(item.date);
    buckets.set(key, [...(buckets.get(key) ?? []), item]);
  });
  return Array.from(buckets.entries()).map(([date, values]) => {
    const first = values[0];
    const last = values[values.length - 1];
    return {
      date,
      open: first.open,
      close: last.close,
      high: Math.max(...values.map((item) => item.high)),
      low: Math.min(...values.map((item) => item.low)),
      volume: values.reduce((sum, item) => sum + item.volume, 0),
      changeRate: last.changeRate,
    };
  });
}

function mapMinuteCandles(items: StockMinuteCandleItem[]): StockChartItem[] {
  return items.map((item) => ({
    date: item.time,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
    changeRate: 0,
  }));
}

function pickLabels(items: StockChartItem[], mode: ChartMode) {
  if (items.length <= 1) return items.map((item, index) => ({ item, index, label: formatAxisDate(item.date, mode) }));

  const labels: { item: StockChartItem; index: number; label: string }[] = [];
  let lastDate: Date | null = null;
  let lastMonth = "";
  let lastQuarter = "";
  let lastYear = "";

  items.forEach((item, index) => {
    if (mode === "day") {
      const date = parseChartDate(item.date);
      if (!date) return;
      const shouldLabel = !lastDate || daysBetween(lastDate, date) >= 7 || index === items.length - 1;
      if (shouldLabel) {
        labels.push({ item, index, label: formatAxisDate(item.date, mode) });
        lastDate = date;
      }
      return;
    }

    if (mode === "week") {
      const month = item.date.slice(0, 6);
      if (month && month !== lastMonth) {
        labels.push({ item, index, label: formatAxisDate(item.date, mode) });
        lastMonth = month;
      }
      return;
    }

    if (mode === "month") {
      const year = item.date.slice(0, 4);
      const month = Number(item.date.slice(4, 6));
      const quarterKey = `${year}-${Math.floor((month - 1) / 3)}`;
      if (year !== lastYear) {
        labels.push({ item, index, label: `${year.slice(2)}년` });
        lastYear = year;
        lastQuarter = quarterKey;
        return;
      }
      if (month && quarterKey !== lastQuarter) {
        labels.push({ item, index, label: `${month}월` });
        lastQuarter = quarterKey;
      }
      return;
    }

    if (mode === "year") {
      labels.push({ item, index, label: formatAxisDate(item.date, mode) });
      return;
    }

    const step = Math.max(1, Math.ceil(items.length / 6));
    if (index % step === 0 || index === items.length - 1) {
      labels.push({ item, index, label: formatAxisDate(item.date, mode) });
    }
  });

  return labels.length > 0 ? labels : [{ item: items[0], index: 0, label: formatAxisDate(items[0].date, mode) }];
}

function weekKey(value: string) {
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = Number(value.slice(6, 8));
  const week = Math.ceil(day / 7);
  return `${year}${month}W${week}`;
}

function formatMarketCap(value?: number) {
  if (!value) return "-";
  if (Math.abs(value) >= 1_0000_0000_0000) return `${Math.round(value / 1_0000_0000_0000).toLocaleString("ko-KR")}조`;
  if (Math.abs(value) >= 1_0000_0000) return `${Math.round(value / 1_0000_0000).toLocaleString("ko-KR")}억`;
  return formatWon(value);
}

function formatLargeWon(value?: number, signed = true) {
  if (!value) return "0원";
  const sign = signed && value > 0 ? "+" : "";
  if (Math.abs(value) >= 1_0000_0000) return `${sign}${Math.round(value / 1_0000_0000).toLocaleString("ko-KR")}억`;
  return `${sign}${formatWon(value)}`;
}

function formatWonValue(value?: number) {
  return value ? formatWon(value) : "-";
}

function formatNumber(value?: number) {
  return value ? value.toLocaleString("ko-KR") : "0";
}

function formatPercent(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatRatio(value?: number) {
  return value ? value.toFixed(2) : "-";
}

function formatRange(low?: number, high?: number) {
  if (!low && !high) return "-";
  return `${formatWonValue(low)} - ${formatWonValue(high)}`;
}

function formatChartDate(value: string) {
  if (value.length === 4) return value;
  if (value.includes("W")) return `${value.slice(4, 6)}월 ${value.slice(-1)}주`;
  if (value.length === 6 && !value.startsWith("20")) return formatMinuteTime(value);
  if (value.length === 6) return `${value.slice(4, 6)}월`;
  if (value.length === 8) return `${value.slice(4, 6)}.${value.slice(6, 8)}`;
  return value;
}

function formatAxisDate(value: string, mode: ChartMode) {
  if (mode === "day" && value.length === 8) return `${Number(value.slice(4, 6))}월 ${Number(value.slice(6, 8))}일`;
  if (mode === "week" && value.length >= 6) return `${Number(value.slice(4, 6))}월`;
  if (mode === "month" && value.length >= 6) return `${value.slice(2, 4)}년 ${Number(value.slice(4, 6))}월`;
  if (mode === "year" && value.length >= 4) return `${value.slice(2, 4)}년`;
  return formatChartDate(value);
}

function formatCompactAxisLabel(value: string) {
  return value.replace("월 ", ".").replace("일", "").replace("년 ", ".");
}

function formatCompactPrice(value: number) {
  const rounded = Math.round(value);
  if (Math.abs(rounded) >= 1_000_000) return `${Math.round(rounded / 10_000).toLocaleString("ko-KR")}만`;
  return rounded.toLocaleString("ko-KR");
}

function parseChartDate(value: string) {
  if (value.length !== 8) return null;
  return new Date(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)));
}

function daysBetween(a: Date, b: Date) {
  return Math.abs(b.getTime() - a.getTime()) / 86_400_000;
}

function formatMinuteTime(value: string) {
  if (value.length >= 6) return `${value.slice(0, 2)}:${value.slice(2, 4)}`;
  return value;
}

function formatDateText(value?: string | null) {
  return value || "날짜 없음";
}

function getVisibleCount(mode: ChartMode, zoomLevel: number) {
  return CHART_VISIBLE_COUNTS[mode][zoomLevel] ?? CHART_VISIBLE_COUNTS[mode][0];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distanceBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const TitleBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  > div {
    min-width: 0;
  }

  ${PageTitle} {
    overflow-wrap: anywhere;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    align-items: flex-start;
  }
`;

const NoticeCard = styled(Card)`
  color: ${({ theme }) => theme.color.warning};
`;

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(160px, 220px) minmax(280px, 0.65fr);
  gap: ${({ theme }) => theme.spacing.sectionGap};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const AdSlot = styled(Card)`
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  border-style: dashed;
  color: ${({ theme }) => theme.color.textFaint};
`;

const AdLabel = styled.span`
  font-size: 12px;
  font-weight: 800;
`;

const AdMark = styled.strong`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 28px;
  letter-spacing: 0;
  color: ${({ theme }) => theme.color.textMuted};
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: ${({ theme }) => theme.spacing.sectionGap};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const MetricBox = styled.div`
  min-height: 92px;
  min-width: 0;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.softPanel};

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    flex: 0 0 clamp(124px, 46%, 168px);
    padding: 12px;
  }

  ${ValueText} {
    overflow-wrap: anywhere;
    font-size: clamp(18px, 5vw, 22px);
  }
`;

const PriceStrip = styled.div`
  display: flex;
  gap: 8px 14px;
  flex-wrap: wrap;
  margin-top: 14px;
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 12px;
`;

const FinancialChartCard = styled(Card)`
  padding: 16px 16px 16px;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    padding: 10px;
  }
`;

const FinancialToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  min-height: 58px;
  padding: 4px 8px;
  color: ${({ theme }) => theme.color.textMuted};

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    gap: 8px;
    padding: 0;
    min-height: 48px;
  }
`;

const ChartTabs = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    flex: 1 1 100%;
    gap: 6px;
  }
`;

const ChartTab = styled.button<{ $active: boolean }>`
  min-width: 48px;
  height: 48px;
  border: 0;
  border-radius: 14px;
  background: ${({ $active, theme }) => ($active ? theme.color.hover : "transparent")};
  color: ${({ theme }) => theme.color.textMuted};
  font: inherit;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.hover};
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    min-width: 42px;
    height: 42px;
    border-radius: 12px;
    font-size: 16px;
  }

  @media (max-width: 360px) {
    min-width: 38px;
    height: 40px;
  }
`;

const ZoomControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    width: 100%;
    justify-content: flex-end;
    gap: 6px;
  }
`;

const ZoomButton = styled.button`
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.color.textMuted};
  font: inherit;
  font-size: 24px;
  font-weight: 800;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.hover};
    color: ${({ theme }) => theme.color.text};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.36;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    width: 32px;
    height: 32px;
    font-size: 22px;
  }
`;

const ChartInfoLine = styled.div`
  min-height: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 0 10px;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 15px;
  line-height: 1.4;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    padding: 0;
    gap: 6px 10px;
    font-size: 13px;
  }
`;

const PriceUp = styled.span`
  color: ${({ theme }) => theme.color.up};
`;

const PriceDown = styled.span`
  color: ${({ theme }) => theme.color.down};
`;

const FinancialChartBox = styled.div`
  height: 340px;
  margin-top: 4px;
  padding: 0 4px 10px;
  border-radius: 18px;
  background: ${({ theme }) => theme.color.input};
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    height: 260px;
    margin-inline: -4px;
    padding: 0 0 4px;
    border-radius: 14px;
  }

  @media (max-width: 360px) {
    height: 248px;
  }
`;

const ChartSvg = styled.svg`
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  cursor: grab;
  touch-action: none;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

const ChartPointerSurface = styled.rect`
  fill: transparent;
`;

const GridLine = styled.line`
  stroke: ${({ theme }) => theme.color.divider};
  stroke-width: 1;
`;

const GuideLine = styled.line`
  stroke: ${({ theme }) => theme.color.textFaint};
  stroke-width: 1;
  stroke-dasharray: 8 10;
`;

const CrosshairLine = styled.line`
  stroke: ${({ theme }) => theme.color.textMuted};
  stroke-width: 1;
  stroke-dasharray: 4 6;
  opacity: 0.72;
`;

const HoverBand = styled.rect`
  fill: ${({ theme }) => theme.color.hover};
  opacity: 0.56;
`;

const RightAxisLabel = styled.text`
  fill: ${({ theme }) => theme.color.textFaint};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    font-size: 21px;
    font-weight: 700;
  }
`;

const BottomAxisLabel = styled.text`
  fill: ${({ theme }) => theme.color.textFaint};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 18px;
  font-weight: 800;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    font-size: 22px;
  }
`;

const WickLine = styled.line<{ $up: boolean }>`
  stroke: ${({ $up, theme }) => ($up ? theme.color.up : theme.color.down)};
  stroke-width: 1.2;
`;

const CandleBody = styled.rect<{ $up: boolean; $selected: boolean; $hovered: boolean }>`
  fill: ${({ $up, theme }) => ($up ? theme.color.up : theme.color.down)};
  stroke: ${({ $hovered, $selected, theme }) => ($selected || $hovered ? theme.color.text : "transparent")};
  stroke-width: ${({ $hovered, $selected }) => ($selected || $hovered ? 2 : 0)};
  opacity: ${({ $hovered }) => ($hovered ? 1 : 0.95)};
  cursor: pointer;

  &:focus {
    outline: none;
    stroke: ${({ theme }) => theme.color.text};
    stroke-width: 2;
  }
`;

const PriceMarker = styled.rect`
  fill: ${({ theme }) => theme.color.up};
`;

const HoverPriceMarker = styled.rect`
  fill: ${({ theme }) => theme.color.text};
  opacity: 0.92;
`;

const HoverDateMarker = styled.rect`
  fill: ${({ theme }) => theme.color.text};
  opacity: 0.9;
`;

const PriceMarkerText = styled.text`
  fill: #ffffff;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 18px;
  font-weight: 800;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    font-size: 21px;
  }
`;

const HoverMarkerText = styled.text`
  fill: ${({ theme }) => theme.color.bg};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 15px;
  font-weight: 800;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    font-size: 18px;
  }
`;

const EmptyPanel = styled.div`
  min-height: 88px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
  padding: 14px;
  border: 1px dashed ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.control};
  color: ${({ theme }) => theme.color.textMuted};
  overflow-wrap: anywhere;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    padding: 12px;
    font-size: 13px;
  }
`;

const SignalRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
  border-top: 1px solid ${({ theme }) => theme.color.divider};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 13px;
`;

const OrderbookGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const OrderbookColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CompactRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
`;

const CompactRow = styled.div`
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) minmax(72px, auto);
  gap: 10px;
  align-items: center;
  min-height: 32px;
  padding: 7px 9px;
  border-radius: ${({ theme }) => theme.radius.small};
  background: ${({ theme }) => theme.color.hover};
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 12px;

  strong {
    color: ${({ theme }) => theme.color.text};
    font-family: ${({ theme }) => theme.font.mono};
  }

  span:last-child {
    text-align: right;
  }

  @media (max-width: 360px) {
    grid-template-columns: 44px minmax(0, 1fr) minmax(58px, auto);
    gap: 6px;
    padding: 7px;
  }
`;

const InvestorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const InvestorBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.softPanel};
`;
