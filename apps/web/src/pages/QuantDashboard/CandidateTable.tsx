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

export function CandidateTable({ candidates, loading, onSelect }: Props) {
  if (loading) return <div className="sk tall" style={{ height: 280 }} />;
  if (candidates.length === 0) {
    return <p className="py-10 text-center text-sm text-[var(--text-3)]">후보 데이터가 없습니다.</p>;
  }

  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="t">
        <thead>
          <tr>
            <th>종목</th>
            <th>모델 판단</th>
            <th>내가 할 행동</th>
            <th>이유</th>
            <th>위험</th>
            <th>예정일</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((item) => {
            const decision = mapBeginnerDecision(item);
            return (
            <tr key={item.assetCode} className="clickable" onClick={() => onSelect(item)}>
              <td className="ticker">
                {item.assetName}
                <div className="mono text-xs text-[var(--text-4)]">
                  #{item.rank} · {item.assetCode} · {item.market} · {item.sector || "-"}
                </div>
              </td>
              <td>
                <span className={`tag ${beginnerStateTone(decision.state)}`}>
                  {BEGINNER_STATE_LABEL[decision.state]}
                </span>
              </td>
              <td>
                <div className="font-medium">{decision.shortAction}</div>
                {decision.action === "BUY_READY" && <div className="text-xs text-[var(--text-3)]">조건 확인 후 체결 검토</div>}
              </td>
              <td>
                <div className="flex max-w-[320px] flex-wrap gap-1">
                  {decision.reasons.slice(0, 2).map((reason) => <span key={reason} className="tag">{reason}</span>)}
                </div>
              </td>
              <td>
                <span className={`tag ${decision.riskLevel === "HIGH" ? "down" : decision.riskLevel === "LOW" ? "up" : "flat"}`}>
                  {BEGINNER_RISK_LABEL[decision.riskLevel]}
                </span>
                <div className="mt-1 text-xs text-[var(--text-3)]">{decision.riskText}</div>
              </td>
              <td className="mono text-xs">{formatDate(item.rebalanceDate)}</td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}
