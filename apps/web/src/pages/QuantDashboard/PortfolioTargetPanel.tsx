import type { QuantPortfolioTarget } from "@/types";
import { formatDate, formatPctRatio, formatScore } from "./quantTypes";

type Props = {
  portfolio: QuantPortfolioTarget | null;
};

export function PortfolioTargetPanel({ portfolio }: Props) {
  const positions = portfolio?.positions ?? [];
  const sectorRows = Object.entries(portfolio?.sectorWeights ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const effectiveDate = portfolio?.executionDate ?? portfolio?.rebalanceDate ?? portfolio?.date;

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">목표 포트폴리오</div>
          <div className="card-sub">체결 가정일 {formatDate(effectiveDate)}</div>
        </div>
        <span className="tag">현금 {formatPctRatio(portfolio?.cashWeight)}</span>
      </div>
      <div className="space-y-3">
        {positions.slice(0, 8).map((item) => (
          <div key={item.assetCode}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium">{item.assetName}</span>
              <span className="mono">{formatPctRatio(item.targetWeight)}</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-alt)]">
              <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: formatPctRatio(item.targetWeight, 0) }} />
            </div>
            <div className="mt-1 mono text-[11px] text-[var(--text-4)]">{item.assetCode} · score {formatScore(item.modelScore)}</div>
          </div>
        ))}
        {positions.length === 0 && <p className="text-sm text-[var(--text-3)]">목표 비중 데이터가 없습니다.</p>}
      </div>
      <div className="divider" />
      <div className="space-y-2">
        <div className="text-xs font-semibold text-[var(--text-3)]">섹터 노출</div>
        {sectorRows.map(([sector, weight]) => (
          <div key={sector} className="flex items-center justify-between text-xs">
            <span className="truncate">{sector}</span>
            <span className="mono">{formatPctRatio(weight)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
