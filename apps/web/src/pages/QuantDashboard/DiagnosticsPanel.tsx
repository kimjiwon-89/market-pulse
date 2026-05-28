import type { QuantDiagnostics } from "@/types";
import { formatPctRatio, formatScore } from "./quantTypes";

type Props = {
  diagnostics: QuantDiagnostics | null;
  loading: boolean;
};

function mapRows(values?: Record<string, number>) {
  return Object.entries(values ?? {}).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
}

export function DiagnosticsPanel({ diagnostics, loading }: Props) {
  if (loading) return <div className="card"><div className="sk tall" /></div>;

  const importance = mapRows(diagnostics?.featureImportance);
  const exposure = mapRows(diagnostics?.sectorExposure);
  const correlation = mapRows(diagnostics?.factorCorrelation);
  const classDistribution = mapRows(diagnostics?.classDistribution);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
      <div className="card">
        <div className="card-head">
          <div className="card-title">Feature Importance</div>
          <div className="card-sub">상위 팩터</div>
        </div>
        <div className="space-y-3">
          {importance.map(([name, value]) => (
            <div key={name}>
              <div className="mb-1 flex justify-between gap-2 text-xs">
                <span className="truncate">{name}</span>
                <span className="mono">{formatScore(value, 3)}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-alt)]">
                <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, value * 100)}%` }} />
              </div>
            </div>
          ))}
          {importance.length === 0 && <p className="text-sm text-[var(--text-3)]">진단 데이터가 없습니다.</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Factor Correlation</div>
          <div className="card-sub">상관 경고 확인</div>
        </div>
        <div className="space-y-2">
          {correlation.slice(0, 12).map(([name, value]) => (
            <div key={name} className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate">{name}</span>
              <span className={`mono ${Math.abs(value) > 0.7 ? "down" : "flat"}`}>{formatScore(value, 2)}</span>
            </div>
          ))}
          {correlation.length === 0 && <p className="text-sm text-[var(--text-3)]">상관 데이터가 없습니다.</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Sector Exposure</div>
          <div className="card-sub">섹터 편중</div>
        </div>
        <div className="space-y-3">
          {exposure.map(([name, weight]) => (
            <div key={name}>
              <div className="mb-1 flex justify-between gap-2 text-xs">
                <span className="truncate">{name}</span>
                <span className="mono">{formatPctRatio(weight)}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-alt)]">
                <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: formatPctRatio(weight, 0) }} />
              </div>
            </div>
          ))}
          {exposure.length === 0 && <p className="text-sm text-[var(--text-3)]">노출 데이터가 없습니다.</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Class Distribution</div>
          <div className="card-sub">신호 분포</div>
        </div>
        <div className="space-y-3">
          {classDistribution.map(([name, weight]) => (
            <div key={name}>
              <div className="mb-1 flex justify-between gap-2 text-xs">
                <span className="truncate">{name}</span>
                <span className="mono">{formatPctRatio(weight)}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-alt)]">
                <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: formatPctRatio(weight, 0) }} />
              </div>
            </div>
          ))}
          {classDistribution.length === 0 && <p className="text-sm text-[var(--text-3)]">분포 데이터가 없습니다.</p>}
        </div>
      </div>
    </div>
  );
}
