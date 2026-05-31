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
  MarketStatusDetail,
  MarketStatusLabel,
  MarketStatusLink,
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
    to: string;
    regime?: QuantMarketOverviewItem["regime"];
    delta: string;
    direction: "up" | "down" | "flat";
  }> = [
    ...marketCards.map((item) => ({
      ...item,
      to: item.id === "kosdaq" ? "/index/1001" : "/index/0001",
    })),
    {
      id: "best-model",
      label: "수익률 최고 모델",
      value: bestModel?.name ?? "-",
      to: bestModel ? `/quant/${bestModel.code}` : "/quant",
      regime: undefined,
      delta: bestModel ? `현재 수익률 ${formatPct(bestModel.totalReturnPct)}` : "현재 수익률 -",
      direction: (bestModel?.totalReturnPct ?? 0) >= 0 ? "up" : "down",
    },
    {
      id: "reports",
      label: "리포트",
      value: `${reportCount}개`,
      to: "/reports",
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
              <MarketStatusLink key={item.id} to={item.to}>
                <MarketStatusLabel>{item.label}</MarketStatusLabel>
                <MarketStatusValue>{item.value}</MarketStatusValue>
                <MarketStatusDetail>
                  {"regime" in item && item.regime ? `${item.regime} · ` : ""}
                  <DirectionText $direction={item.direction}>{item.delta}</DirectionText>
                </MarketStatusDetail>
              </MarketStatusLink>
            ))}
          </MarketStatusRail>
        </HeroPanel>

        <HeroPanel $market>
          <div>
            <MarketTitle>최근 거래일 핫한 종목들</MarketTitle>
            <HeroDescription>정상 일일 등락 범위 안에서 상승률과 하락률이 큰 종목입니다.</HeroDescription>
          </div>
          <MarketStatusRail>
            {hotStocks.map((item) => (
              <MarketStatusLink key={item.id} to={item.assetCode ? `/stock/${item.assetCode}` : "/market"}>
                <MarketStatusLabel>{item.label}</MarketStatusLabel>
                <MarketStatusValue>{item.assetName}</MarketStatusValue>
                <MarketStatusDetail>
                  <DirectionText $direction={item.direction}>{item.changeRate}</DirectionText>
                  {item.assetCode ? ` · ${item.assetCode}` : ""}
                </MarketStatusDetail>
              </MarketStatusLink>
            ))}
          </MarketStatusRail>
        </HeroPanel>
      </HeroSectionStack>
    </Card>
  );
}
