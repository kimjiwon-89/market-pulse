import type { QuantCandidateSignal } from "@/types";
import {
  BEGINNER_RISK_LABEL,
  BEGINNER_STATE_LABEL,
  beginnerStateTone,
  formatDate,
  mapBeginnerDecision,
} from "./quantTypes";

type Props = {
  candidates: QuantCandidateSignal[];
  loading: boolean;
  onSelect: (candidate: QuantCandidateSignal) => void;
};

export function CandidateMobileList({ candidates, loading, onSelect }: Props) {
  if (loading) return <div className="lg:hidden"><div className="sk tall" /></div>;

  return (
    <div className="space-y-2 lg:hidden">
      {candidates.map((item) => {
        const decision = mapBeginnerDecision(item);
        return (
          <button
            key={item.assetCode}
            type="button"
            className="card linklike w-full"
            onClick={() => onSelect(item)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`tag ${beginnerStateTone(decision.state)}`}>{BEGINNER_STATE_LABEL[decision.state]}</span>
                  <span className="mono text-xs text-[var(--text-4)]">#{item.rank}</span>
                </div>
                <div className="mt-2 truncate font-semibold">{item.assetName}</div>
                <div className="mono text-xs text-[var(--text-3)]">{item.assetCode} · {item.market} · {item.sector || "-"}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold">{decision.shortAction}</div>
                <div className="mono text-xs text-[var(--text-3)]">{formatDate(item.rebalanceDate)}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
              <div className="stat-cell">
                <div className="stat-label">이유</div>
                <div>{decision.reasons.slice(0, 2).join(" ") || "확인할 조건이 남아 있습니다."}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">위험</div>
                <div className={decision.riskLevel === "HIGH" ? "down" : decision.riskLevel === "LOW" ? "up" : "flat"}>
                  {BEGINNER_RISK_LABEL[decision.riskLevel]} · {decision.riskText}
                </div>
              </div>
            </div>
          </button>
        );
      })}
      {candidates.length === 0 && <p className="py-8 text-center text-sm text-[var(--text-3)]">후보 데이터가 없습니다.</p>}
    </div>
  );
}
