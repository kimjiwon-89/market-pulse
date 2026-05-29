import {
  MarketStatusCard,
  MarketStatusDetail,
  MarketStatusLabel,
  MarketStatusRail,
  MarketStatusValue,
} from "./styles";
import type { QuantHomeSummary } from "@/features/quant/types";

interface QuantMarketStatusRailProps {
  summary: QuantHomeSummary;
}

export function QuantMarketStatusRail({ summary }: QuantMarketStatusRailProps) {
  const model = summary.models[0];
  const latestReport = summary.reports[0];
  const marketStatuses = [
    {
      label: "모델",
      value: model?.status ?? "확인 중",
      detail: model ? `${model.name}만 노출 중` : "Bull v4 상태를 불러오는 중",
    },
    {
      label: "후보",
      value: `${summary.decisions.length}개`,
      detail: "백엔드 후보 API 기준",
    },
    {
      label: "리포트",
      value: latestReport ? "생성됨" : "없음",
      detail: latestReport?.publishedAt ?? "생성된 Bull v4 리포트 없음",
    },
    {
      label: "기준",
      value: summary.asOf ?? "실시간",
      detail: "백엔드 최신 모델 시간",
    },
  ];

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
