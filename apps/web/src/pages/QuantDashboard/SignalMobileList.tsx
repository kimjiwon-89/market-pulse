import type { QuantCoreSignal } from "@/types";
import { formatPctRatio, formatScore } from "./quantTypes";

type Props = {
  signals: QuantCoreSignal[];
  loading: boolean;
};

export function SignalMobileList({ signals, loading }: Props) {
  if (loading) return <div className="lg:hidden"><div className="sk tall" /></div>;

  return (
    <div className="space-y-2 lg:hidden">
      {signals.map((signal) => (
        <div key={signal.assetCode} className="card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">{signal.assetName}</div>
              <div className="mono text-xs text-[var(--text-3)]">
                #{signal.rank} · {signal.assetCode} · {signal.market} · {signal.sector || "-"}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="mono text-base font-semibold">{formatScore(signal.score)}</div>
              <div className="mono text-xs text-[var(--text-3)]">{formatPctRatio(signal.winnerProb)}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <span>중립 <b className="mono">{formatPctRatio(signal.neutralProb)}</b></span>
            <span>하락 <b className="mono">{formatPctRatio(signal.loserProb)}</b></span>
            <span>목표 <b className="mono">{formatPctRatio(signal.targetWeight)}</b></span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {signal.riskFlags.map((flag) => <span key={flag} className="tag down">{flag}</span>)}
          </div>
        </div>
      ))}
      {signals.length === 0 && <p className="py-8 text-center text-sm text-[var(--text-3)]">신호 데이터가 없습니다.</p>}
    </div>
  );
}
