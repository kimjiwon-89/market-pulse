import type {
  QuantHomeSummary,
  QuantHotStockItem,
  QuantMarketOverviewItem,
  QuantModelSummary,
} from "@/features/quant/types";
import {
  Card,
  DirectionText,
  HeroDescription,
  HeroPanel,
  HeroSectionStack,
  MarketStatusCard,
  MarketStatusDetail,
  MarketStatusLabel,
  MarketStatusRail,
  MarketStatusValue,
  MarketTitle,
} from "./styles";

interface QuantHeroSectionProps {
  summary: QuantHomeSummary;
}

function formatPct(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function topModel(models: QuantModelSummary[]) {
  return [...models].sort((a, b) => (b.totalReturnPct ?? -Infinity) - (a.totalReturnPct ?? -Infinity))[0];
}

function defaultMarketOverview(): QuantMarketOverviewItem[] {
  return [
    { id: "kospi", label: "KOSPI", value: "-", regime: "SIDE", delta: "전일 대비 -", direction: "flat" },
    { id: "kosdaq", label: "KOSDAQ", value: "-", regime: "SIDE", delta: "전일 대비 -", direction: "flat" },
  ];
}

function defaultHotStocks(): QuantHotStockItem[] {
  return [
    { id: "up-1", label: "상승률 1위", assetName: "데이터 준비 중", changeRate: "-", direction: "flat" },
    { id: "up-2", label: "상승률 2위", assetName: "데이터 준비 중", changeRate: "-", direction: "flat" },
    { id: "down-1", label: "하락률 1위", assetName: "데이터 준비 중", changeRate: "-", direction: "flat" },
    { id: "down-2", label: "하락률 2위", assetName: "데이터 준비 중", changeRate: "-", direction: "flat" },
  ];
}

export function QuantHeroSection({ summary }: QuantHeroSectionProps) {
  const bestModel = topModel(summary.models);
  const marketCards = summary.marketOverview?.length ? summary.marketOverview : defaultMarketOverview();
  const reportCount = summary.reports.length;
  const hotStocks = summary.hotStocks?.length ? summary.hotStocks : defaultHotStocks();

  const overviewCards: Array<{
    id: string;
    label: string;
    value: string;
    regime?: QuantMarketOverviewItem["regime"];
    delta: string;
    direction: "up" | "down" | "flat";
  }> = [
    ...marketCards,
    {
      id: "best-model",
      label: "수익률 최고 모델",
      value: bestModel?.name ?? "-",
      regime: undefined,
      delta: bestModel ? `현재 수익률 ${formatPct(bestModel.totalReturnPct)}` : "현재 수익률 -",
      direction: (bestModel?.totalReturnPct ?? 0) >= 0 ? "up" : "down",
    },
    {
      id: "reports",
      label: "리포트",
      value: `${reportCount}개`,
      regime: undefined,
      delta: summary.reports[0]?.publishedAt ? `최근 ${summary.reports[0].publishedAt}` : "최근 리포트 없음",
      direction: reportCount > 0 ? "up" : "flat",
    },
  ];

  return (
    <Card $soft $flush>
      <HeroSectionStack>
        <HeroPanel>
          <div>
            <MarketTitle>오늘 시장 요약</MarketTitle>
            <HeroDescription>KOSPI/KOSDAQ 지수 감시 모델의 장세, 전략, 리스크 예산을 먼저 확인합니다.</HeroDescription>
          </div>
          <MarketStatusRail>
            {overviewCards.map((item) => (
              <MarketStatusCard key={item.id}>
                <MarketStatusLabel>{item.label}</MarketStatusLabel>
                <MarketStatusValue>{item.value}</MarketStatusValue>
                <MarketStatusDetail>
                  {"regime" in item && item.regime ? `${item.regime} · ` : ""}
                  <DirectionText $direction={item.direction}>{item.delta}</DirectionText>
                </MarketStatusDetail>
              </MarketStatusCard>
            ))}
          </MarketStatusRail>
        </HeroPanel>

        <HeroPanel $market>
          <div>
            <MarketTitle>오늘 핫한 종목들</MarketTitle>
            <HeroDescription>상승률과 하락률이 큰 종목을 빠르게 확인하는 영역입니다.</HeroDescription>
          </div>
          <MarketStatusRail>
            {hotStocks.map((item) => (
              <MarketStatusCard key={item.id}>
                <MarketStatusLabel>{item.label}</MarketStatusLabel>
                <MarketStatusValue>{item.assetName}</MarketStatusValue>
                <MarketStatusDetail>
                  <DirectionText $direction={item.direction}>{item.changeRate}</DirectionText>
                  {item.assetCode ? ` · ${item.assetCode}` : ""}
                </MarketStatusDetail>
              </MarketStatusCard>
            ))}
          </MarketStatusRail>
        </HeroPanel>
      </HeroSectionStack>
    </Card>
  );
}
