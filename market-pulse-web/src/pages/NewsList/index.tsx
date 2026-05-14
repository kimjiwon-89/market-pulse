import { useState, useEffect } from "react";
import { apiClient } from "@/services/apiClient";

interface NewsItem {
  id: string;
  title: string;
  date: string;
  time: string;
  source: string;
}

function mapNews(raw: any): NewsItem {
  return {
    id: raw.cntt_usiq_srno ?? String(Math.random()),
    title: raw.hts_pbnt_titl_cntt ?? "",
    date: raw.data_dt
      ? `${raw.data_dt.slice(0, 4)}-${raw.data_dt.slice(4, 6)}-${raw.data_dt.slice(6, 8)}`
      : "",
    time: raw.data_tm
      ? `${raw.data_tm.slice(0, 2)}:${raw.data_tm.slice(2, 4)}`
      : "",
    source: raw.dorg ?? "",
  };
}

export function NewsList() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient
      .get("/news/inquire-daily-news")
      .then(r => {
        const raw: any[] = Array.isArray(r.data.data) ? r.data.data : [];
        setItems(raw.map(mapNews));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stack">
      <div className="card">
        <div className="card-head">
          <div className="card-title">국내 주요 뉴스</div>
          <span className="tag">실시간</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "var(--pad-card)", display: "flex", flexDirection: "column", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="sk" />
                <div className="sk short" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="error-block">
            <div className="error-title">뉴스를 불러올 수 없습니다</div>
            <div className="error-msg">잠시 후 다시 시도해 주세요</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-4)", fontSize: 13 }}>
            뉴스가 없습니다
          </div>
        ) : (
          <div className="news-list" style={{ padding: "0 var(--pad-card)" }}>
            {items.map(item => (
              <div key={item.id} className="news-item">
                <div className="news-title">{item.title}</div>
                <div className="news-meta">
                  {[item.source, item.date, item.time].filter(Boolean).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
