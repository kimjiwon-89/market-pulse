import type { QuantCandidateSignal } from "@/types";
import {
  CANDIDATE_STATUS_LABEL,
  formatDate,
  formatPctRatio,
  formatScore,
  statusTone,
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
      {candidates.map((item) => (
        <button
          key={item.assetCode}
          type="button"
          className="card linklike w-full"
          onClick={() => onSelect(item)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`tag ${statusTone(item.candidateStatus)}`}>{CANDIDATE_STATUS_LABEL[item.candidateStatus]}</span>
                <span className="mono text-xs text-[var(--text-4)]">#{item.rank}</span>
              </div>
              <div className="mt-2 truncate font-semibold">{item.assetName}</div>
              <div className="mono text-xs text-[var(--text-3)]">{item.assetCode} · {item.market} · {item.sector || "-"}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="mono text-base font-semibold">{formatScore(item.score)}</div>
              <div className="mono text-xs text-[var(--text-3)]">{formatPctRatio(item.winnerProb)}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="stat-cell">
              <div className="stat-label">다음 행동</div>
              <div className="font-medium">{item.nextAction}</div>
            </div>
            <div className="stat-cell text-right">
              <div className="stat-label">리밸런싱</div>
              <div className="mono">{formatDate(item.rebalanceDate)}</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">현재/목표</div>
              <div className="mono">{formatPctRatio(item.currentWeight)} / {formatPctRatio(item.targetWeight)}</div>
            </div>
            <div className="stat-cell text-right">
              <div className="stat-label">기준 거리</div>
              <div className="mono">{formatScore(item.thresholdDistance, 2)}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {item.triggerConditions.slice(0, 2).map((condition) => <span key={condition} className="tag">{condition}</span>)}
            {item.blockers.map((blocker) => <span key={blocker} className="tag down">{blocker}</span>)}
            {item.riskFlags.map((flag) => <span key={flag} className="tag down">{flag}</span>)}
          </div>
        </button>
      ))}
      {candidates.length === 0 && <p className="py-8 text-center text-sm text-[var(--text-3)]">후보 데이터가 없습니다.</p>}
    </div>
  );
}
