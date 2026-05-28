import { Link, useParams } from "react-router-dom";
import { quantReports } from "@/features/quant/quantMockData";

export function Reports() {
  const { reportId } = useParams();
  const selected = reportId ? quantReports.find((report) => report.id === reportId) : null;

  if (reportId && !selected) {
    return (
      <div className="error-block">
        <div className="error-title">리포트를 찾을 수 없습니다</div>
        <Link className="btn" to="/reports">리포트 목록으로</Link>
      </div>
    );
  }

  if (selected) {
    return (
      <article className="stack max-w-[880px] mx-auto">
        <div className="card">
          <Link className="card-link" to="/reports">← 리포트 목록</Link>
          <h1 style={{ margin: "14px 0 0", fontSize: 24, fontWeight: 800 }}>{selected.title}</h1>
          <p className="card-sub" style={{ marginTop: 8 }}>{selected.modelName} · {selected.publishedAt}</p>
        </div>
        <div className="card">
          <div className="card-title">요약</div>
          <p style={{ color: "var(--text-2)", lineHeight: 1.8 }}>{selected.summary}</p>
          <div className="chips" style={{ marginTop: 16 }}>
            {selected.keywords.map((keyword) => <span key={keyword} className="chip">{keyword}</span>)}
          </div>
        </div>
        <div className="card">
          <div className="card-title">화면 구현 메모</div>
          <p style={{ margin: "10px 0 0", color: "var(--text-3)" }}>
            현재는 목데이터입니다. 실제 백엔드는 화면 확정 후 리포트 목록, 상세 본문, 모델 연결 정보를 제공하면 됩니다.
          </p>
        </div>
      </article>
    );
  }

  return (
    <div className="stack max-w-[1000px] mx-auto">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>리포트</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>모델이 오늘 어떤 이유로 판단했는지 쉬운 말로 정리합니다.</p>
      </div>
      <div className="stack">
        {quantReports.map((report) => (
          <Link key={report.id} to={`/reports/${report.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card-head">
              <div className="card-title" style={{ fontSize: 16 }}>{report.title}</div>
              <span className="tag">{report.modelName}</span>
            </div>
            <p style={{ color: "var(--text-2)", margin: 0 }}>{report.summary}</p>
            <div className="card-sub" style={{ marginTop: 14 }}>{report.publishedAt}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
