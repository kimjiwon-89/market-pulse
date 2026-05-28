import type { QuantCandidateDetail } from "@/types";
import {
  CANDIDATE_STATUS_LABEL,
  formatDate,
  formatPctRatio,
  formatScore,
  statusTone,
} from "./quantTypes";
import { FactorScoreBreakdown } from "./FactorScoreBreakdown";
import { SignalHistoryTimeline } from "./SignalHistoryTimeline";

const REBALANCE_STATUS_LABEL: Record<string, string> = {
  PENDING: "대기",
  SCHEDULED: "예정",
  EXECUTED: "실행",
  SKIPPED: "건너뜀",
  BLOCKED: "차단",
};

type Props = {
  detail: QuantCandidateDetail | null;
  loading: boolean;
  onClose: () => void;
};

export function CandidateDrilldown({ detail, loading, onClose }: Props) {
  if (!detail && !loading) return null;
  const candidate = detail?.candidate;

  return (
    <div className="fixed inset-0 z-40 bg-black/20" role="dialog" aria-modal="true">
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 shadow-xl lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[520px] lg:rounded-none lg:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">{candidate?.assetName ?? "후보 상세"}</div>
            <div className="mono text-xs text-[var(--text-3)]">
              {candidate?.assetCode ?? ""} {candidate ? `· ${candidate.market} · ${candidate.sector || "-"}` : ""}
            </div>
          </div>
          <button className="btn sm" type="button" onClick={onClose}>닫기</button>
        </div>

        {loading && <div className="sk tall" />}

        {detail && candidate && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-cell">
                <div className="stat-label">상태</div>
                <span className={`tag w-fit ${statusTone(candidate.candidateStatus)}`}>
                  {CANDIDATE_STATUS_LABEL[candidate.candidateStatus]}
                </span>
              </div>
              <div className="stat-cell text-right">
                <div className="stat-label">다음 행동</div>
                <div className="font-semibold">{candidate.nextAction}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">리밸런싱 상태</div>
                <div>{REBALANCE_STATUS_LABEL[candidate.rebalanceStatus] ?? candidate.rebalanceStatus}</div>
              </div>
              <div className="stat-cell text-right">
                <div className="stat-label">리밸런싱 날짜</div>
                <div className="mono">{formatDate(candidate.rebalanceDate)}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">현재/목표 비중</div>
                <div className="mono">{formatPctRatio(candidate.currentWeight)} / {formatPctRatio(candidate.targetWeight)}</div>
              </div>
              <div className="stat-cell text-right">
                <div className="stat-label">기준 거리</div>
                <div className="mono">{formatScore(candidate.thresholdDistance, 2)}</div>
              </div>
            </div>

            <div className="divider" />

            <section>
              <div className="mb-3 text-sm font-semibold">팩터 분해</div>
              <FactorScoreBreakdown items={detail.factorBreakdown} fallbackScores={candidate.factorScores} />
            </section>

            <section>
              <div className="mb-2 text-sm font-semibold">판단 근거</div>
              <div className="flex flex-wrap gap-1">
                {(detail.reasonChips.length > 0 ? detail.reasonChips : candidate.reasonChips).map((chip) => (
                  <span key={chip} className="tag">{chip}</span>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-2 text-sm font-semibold">트리거 조건</div>
              <div className="space-y-2">
                {detail.triggerConditions.map((trigger) => (
                  <div key={`${trigger.type}-${trigger.label}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{trigger.label}</span>
                    <span className={`tag ${trigger.passed ? "up" : "down"}`}>
                      {trigger.currentValue} / {trigger.threshold}
                    </span>
                  </div>
                ))}
                {detail.triggerConditions.length === 0 && candidate.triggerConditions.map((trigger) => (
                  <span key={trigger} className="tag mr-1">{trigger}</span>
                ))}
              </div>
            </section>

            {(candidate.blockers.length > 0 || candidate.riskFlags.length > 0) && (
              <section>
                <div className="mb-2 text-sm font-semibold">제약/리스크</div>
                <div className="flex flex-wrap gap-1">
                  {candidate.blockers.map((blocker) => <span key={blocker} className="tag down">{blocker}</span>)}
                  {candidate.riskFlags.map((flag) => <span key={flag} className="tag down">{flag}</span>)}
                </div>
              </section>
            )}

            <section>
              <div className="mb-2 text-sm font-semibold">신호 히스토리</div>
              <SignalHistoryTimeline items={detail.signalHistory} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
