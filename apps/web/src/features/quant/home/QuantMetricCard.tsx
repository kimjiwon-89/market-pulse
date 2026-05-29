import type { QuantKpi } from "@/features/quant/types";
import {
  DirectionText,
  InfoDot,
  MetricCard,
  MetricLabel,
  MetricSub,
  MetricValue,
} from "./styles";

interface QuantMetricCardProps {
  kpi: QuantKpi;
}

export function QuantMetricCard({ kpi }: QuantMetricCardProps) {
  const direction = kpi.direction ?? "flat";
  const valueTone = kpi.id === "look" || kpi.id === "reports" ? "accent" : direction;

  return (
    <MetricCard>
      <MetricLabel>
        <span>{kpi.label}</span>
        <InfoDot>i</InfoDot>
      </MetricLabel>
      <MetricValue $tone={valueTone === "flat" ? undefined : valueTone}>
        {kpi.value}
      </MetricValue>
      <MetricSub>
        {kpi.hint}{" "}
        {kpi.delta && (
          <DirectionText $direction={direction}>
            {kpi.delta}
          </DirectionText>
        )}
      </MetricSub>
    </MetricCard>
  );
}
