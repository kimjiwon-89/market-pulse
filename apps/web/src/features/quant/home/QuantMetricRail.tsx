import type { QuantKpi } from "@/features/quant/types";
import { MetricRail } from "./styles";
import { QuantMetricCard } from "./QuantMetricCard";

interface QuantMetricRailProps {
  kpis: QuantKpi[];
  ids?: string[];
}

export function QuantMetricRail({ ids, kpis }: QuantMetricRailProps) {
  const visibleKpis = ids ? kpis.filter((kpi) => ids.includes(kpi.id)) : kpis;

  return (
    <MetricRail>
      {visibleKpis.map((kpi) => (
        <QuantMetricCard key={kpi.id} kpi={kpi} />
      ))}
    </MetricRail>
  );
}
