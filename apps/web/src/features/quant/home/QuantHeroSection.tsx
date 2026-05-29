import { QuantMarketStatusRail } from "./QuantMarketStatusRail";
import { QuantMetricRail } from "./QuantMetricRail";
import {
  Card,
  HeroCopy,
  HeroDescription,
  HeroPanel,
  HeroSplit,
  HeroTitle,
  MarketTitle,
} from "./styles";

export function QuantHeroSection() {
  return (
    <Card $soft>
      <HeroSplit>
        <HeroPanel>
          <HeroCopy>
            <HeroTitle>퀀트 모델이 고른 오늘의 종목</HeroTitle>
            <HeroDescription>
              매일 시장 데이터를 계산해 살펴볼 종목, 기다릴 종목, 조심할 종목을 쉽게 정리합니다.
            </HeroDescription>
          </HeroCopy>
          <QuantMetricRail ids={["look", "caution", "performance", "reports"]} />
        </HeroPanel>
        <HeroPanel $market>
          <HeroCopy>
            <MarketTitle>오늘의 시장 현황</MarketTitle>
            <HeroDescription>
              지수는 약세지만 급락 신호는 제한적이고, 반도체 쪽 수급은 개선 흐름입니다.
            </HeroDescription>
          </HeroCopy>
          <QuantMarketStatusRail />
        </HeroPanel>
      </HeroSplit>
    </Card>
  );
}
