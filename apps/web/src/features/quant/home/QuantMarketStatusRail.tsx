import {
  MarketStatusCard,
  MarketStatusDetail,
  MarketStatusLabel,
  MarketStatusRail,
  MarketStatusValue,
} from "./styles";

const marketStatuses = [
  {
    label: "지수",
    value: "약세 관찰",
    detail: "KOSPI·KOSDAQ 모두 변동성 확대",
  },
  {
    label: "수급",
    value: "반도체 개선",
    detail: "기관·외국인 흐름 동시 확인",
  },
  {
    label: "체크",
    value: "환율·금리",
    detail: "단기 변동성은 계속 관찰",
  },
  {
    label: "분위기",
    value: "선별 강세",
    detail: "강한 업종 중심으로 압축",
  },
];

export function QuantMarketStatusRail() {
  return (
    <MarketStatusRail>
      {marketStatuses.map((item) => (
        <MarketStatusCard key={item.label}>
          <MarketStatusLabel>{item.label}</MarketStatusLabel>
          <MarketStatusValue>{item.value}</MarketStatusValue>
          <MarketStatusDetail>{item.detail}</MarketStatusDetail>
        </MarketStatusCard>
      ))}
    </MarketStatusRail>
  );
}
