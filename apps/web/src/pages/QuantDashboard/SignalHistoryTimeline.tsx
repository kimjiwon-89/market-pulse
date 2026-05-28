import type { QuantSignalHistoryItem } from "@/types";
import { CANDIDATE_STATUS_LABEL, formatDate, formatPctRatio, formatScore } from "./quantTypes";

type Props = {
  items: QuantSignalHistoryItem[];
};

export function SignalHistoryTimeline({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--text-3)]">최근 신호 변화가 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={`${item.signalDate}-${item.nextAction}`} className="border-l border-[var(--border)] pl-3">
          <div className="flex items-center justify-between gap-2">
            <span className="mono text-xs text-[var(--text-3)]">{formatDate(item.signalDate)}</span>
            <span className="tag">{CANDIDATE_STATUS_LABEL[item.candidateStatus]}</span>
          </div>
          <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
            <span>점수 <b className="mono">{formatScore(item.score)}</b></span>
            <span>목표 <b className="mono">{formatPctRatio(item.targetWeight)}</b></span>
            <span>{item.nextAction}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
