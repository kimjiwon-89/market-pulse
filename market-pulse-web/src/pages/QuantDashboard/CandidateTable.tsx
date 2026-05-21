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
            <th>순위</th>
            <th>상태</th>
            <th>종목</th>
            <th>시장/섹터</th>
            <th className="num">확률</th>
            <th className="num">점수</th>
            <th className="num">현재</th>
            <th className="num">목표</th>
            <th>다음 행동</th>
            <th>리밸런싱</th>
            <th className="num">기준 거리</th>
            <th>조건/제약</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((item) => (
            <tr key={item.assetCode} className="clickable" onClick={() => onSelect(item)}>
              <td className="rank">{item.rank}</td>
              <td>
                <span className={`tag ${statusTone(item.candidateStatus)}`}>
                  {CANDIDATE_STATUS_LABEL[item.candidateStatus]}
                </span>
              </td>
              <td className="ticker">
                {item.assetName}
                <div className="mono text-xs text-[var(--text-4)]">{item.assetCode}</div>
              </td>
              <td>
                {item.market}
                <div className="text-xs text-[var(--text-4)]">{item.sector || "-"}</div>
              </td>
              <td className="num">{formatPctRatio(item.winnerProb)}</td>
              <td className="num">{formatScore(item.score)}</td>
              <td className="num">{formatPctRatio(item.currentWeight)}</td>
              <td className="num">{formatPctRatio(item.targetWeight)}</td>
              <td>{item.nextAction}</td>
              <td className="mono text-xs">{formatDate(item.rebalanceDate)}</td>
              <td className="num">{formatScore(item.thresholdDistance, 2)}</td>
              <td>
                <div className="flex max-w-[260px] flex-wrap gap-1">
                  {item.triggerConditions.slice(0, 2).map((condition) => <span key={condition} className="tag">{condition}</span>)}
                  {item.blockers.map((blocker) => <span key={blocker} className="tag down">{blocker}</span>)}
                  {item.riskFlags.map((flag) => <span key={flag} className="tag down">{flag}</span>)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
