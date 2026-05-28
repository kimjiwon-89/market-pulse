import { mockNews } from "@/features/mock/marketMockData";

export function NewsList() {
  return (
    <div className="stack max-w-[900px] mx-auto">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>뉴스</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>시장과 모델 판단에 영향을 줄 수 있는 주요 뉴스를 모았습니다.</p>
      </div>
      <div className="card">
        <div className="news-list">
          {mockNews.map((news) => (
            <article key={news.id} className="news-item">
              <h2 className="news-title" style={{ fontSize: 16 }}>{news.title}</h2>
              <p style={{ color: "var(--text-2)", margin: "8px 0 0" }}>{news.summary}</p>
              <div className="news-meta">{news.source} · {news.date}</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
