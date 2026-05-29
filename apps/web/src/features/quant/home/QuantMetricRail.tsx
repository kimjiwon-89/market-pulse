import { quantKpis } from "@/features/quant/mock";
import { MetricRail } from "./styles";
import { QuantMetricCard } from "./QuantMetricCard";

interface QuantMetricRailProps {
  ids?: string[];
}

export function QuantMetricRail({ ids }: QuantMetricRailProps) {
  const kpis = ids ? quantKpis.filter((kpi) => ids.includes(kpi.id)) : quantKpis;

  return (
    <MetricRail>
      {kpis.map((kpi) => (
        <QuantMetricCard key={kpi.id} kpi={kpi} />
      ))}
    </MetricRail>
  );
}
