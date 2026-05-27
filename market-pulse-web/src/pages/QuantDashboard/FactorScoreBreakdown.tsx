import type { QuantFactorScoreItem } from "@/types";
import { formatScore } from "./quantTypes";

type Props = {
  items: QuantFactorScoreItem[];
  fallbackScores: Record<string, number>;
};

export function FactorScoreBreakdown({ items, fallbackScores }: Props) {
  const rows = items.length > 0
    ? items
    : Object.entries(fallbackScores).map(([factor, score]) => ({
      factor,
      label: factor,
      score,
      contribution: score,
      direction: score > 0 ? "POSITIVE" : score < 0 ? "NEGATIVE" : "NEUTRAL",
    }));

  return (
    <div className="space-y-3">
      {rows.map((item) => {
        const width = `${Math.min(100, Math.max(4, Math.abs(item.contribution || item.score)))}%`;
        const tone = item.direction === "NEGATIVE" || item.score < 0 ? "down" : item.direction === "POSITIVE" || item.score > 0 ? "up" : "flat";
        return (
          <div key={item.factor}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-[var(--text-2)]">{item.label}</span>
              <span className={`mono ${tone}`}>{formatScore(item.score, 2)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-alt)]">
              <div className={`h-full rounded-full ${tone === "down" ? "bg-[var(--down)]" : "bg-[var(--up)]"}`} style={{ width }} />
            </div>
          </div>
        );
      })}
      {rows.length === 0 && <p className="text-sm text-[var(--text-3)]">팩터 분해 데이터가 없습니다.</p>}
    </div>
  );
}
