import type { QuantCoreSignal } from "@/types";
import { formatPctRatio, formatScore } from "./quantTypes";

type Props = {
  signals: QuantCoreSignal[];
  loading: boolean;
};

function reasonText(reason: Record<string, unknown>) {
  return Object.entries(reason)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export function SignalTable({ signals, loading }: Props) {
  if (loading) return <div className="hidden lg:block"><div className="sk tall" /></div>;

  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="t">
        <thead>
          <tr>
            <th>순위</th>
            <th>종목</th>
            <th>시장/섹터</th>
            <th className="num">상승 확률</th>
            <th className="num">중립</th>
            <th className="num">하락</th>
            <th className="num">점수</th>
            <th className="num">목표 비중</th>
            <th>근거</th>
            <th>리스크</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((signal) => (
            <tr key={signal.assetCode}>
              <td className="rank">{signal.rank}</td>
              <td className="ticker">
                {signal.assetName}
                <div className="mono text-xs text-[var(--text-4)]">{signal.assetCode}</div>
              </td>
              <td>
                {signal.market}
                <div className="text-xs text-[var(--text-4)]">{signal.sector || "-"}</div>
              </td>
              <td className="num">{formatPctRatio(signal.winnerProb)}</td>
              <td className="num">{formatPctRatio(signal.neutralProb)}</td>
              <td className="num">{formatPctRatio(signal.loserProb)}</td>
              <td className="num">{formatScore(signal.score)}</td>
              <td className="num">{formatPctRatio(signal.targetWeight)}</td>
              <td className="max-w-[280px] truncate text-xs">{reasonText(signal.reason)}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {signal.riskFlags.map((flag) => <span key={flag} className="tag down">{flag}</span>)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {signals.length === 0 && <p className="py-8 text-center text-sm text-[var(--text-3)]">신호 데이터가 없습니다.</p>}
    </div>
  );
}
