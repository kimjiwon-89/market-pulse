import type { StockReport } from "@/types";

interface ReportPanelProps {
  reports: StockReport[];
  loading: boolean;
}

const LICENSE_LABEL: Record<string, string> = {
  PUBLIC_LINK_ONLY: "링크만",
  LICENSED: "라이선스",
  UNKNOWN: "확인필요",
};

export function ReportPanel({ reports, loading }: ReportPanelProps) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">리서치 리포트</div>
        <span className="tag">본문 저장 제외</span>
      </div>
      {loading ? (
        <div className="sk tall" />
      ) : reports.length === 0 ? (
        <p style={{ color: "var(--text-3)", fontSize: 13 }}>
          저장된 리포트 메타데이터가 없습니다.
        </p>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {reports.map(report => (
            <a
              key={`${report.source}-${report.publishedAt}-${report.title}`}
              href={report.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 14,
                color: "var(--text)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                <strong>{report.title}</strong>
                <span className="tag">{LICENSE_LABEL[report.licenseStatus] ?? report.licenseStatus}</span>
              </div>
              <div style={{ color: "var(--text-3)", fontSize: 12 }}>
                {report.source} · {report.publishedAt}
              </div>
              {report.licenseStatus === "LICENSED" && report.summary && (
                <p style={{ color: "var(--text-2)", fontSize: 13, margin: "8px 0 0" }}>{report.summary}</p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
