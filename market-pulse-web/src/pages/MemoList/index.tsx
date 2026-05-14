import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import type { InvestorMemo } from "@/types";

type Market = "KOSPI" | "KOSDAQ";

function fmtDisplayDate(memoDate: string): string {
  // "2026-05-14" → "2026.05.14"
  return memoDate.replace(/-/g, ".");
}

function fmtApiDate(memoDate: string): string {
  // "2026-05-14" → "20260514"
  return memoDate.replace(/-/g, "");
}

export function MemoList() {
  const navigate = useNavigate();
  const [market, setMarket] = useState<Market>("KOSPI");
  const [memos, setMemos] = useState<InvestorMemo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 20;

  const fetchMemos = useCallback(
    async (pageNum: number, replace: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get("/investor/memo/list", {
          params: { market, page: pageNum, size: PAGE_SIZE },
        });
        const data: InvestorMemo[] = res.data.data ?? [];
        setMemos((prev) => (replace ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
      } catch {
        setError("메모를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    },
    [market]
  );

  useEffect(() => {
    setPage(0);
    fetchMemos(0, true);
  }, [fetchMemos]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchMemos(next, false);
  }

  function goToInvestor(memo: InvestorMemo) {
    sessionStorage.setItem("mp:flow:initDate", fmtApiDate(memo.memoDate));
    sessionStorage.setItem("mp:flow:initMarket", memo.market);
    navigate(`/investor?date=${fmtApiDate(memo.memoDate)}&market=${memo.market}`);
  }

  return (
    <div className="stack">
      {/* 헤더 카드 */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">메모 모아보기</div>
          <span className="tag">날짜 내림차순</span>
        </div>
        <div className="seg-tabs" role="tablist">
          {(["KOSPI", "KOSDAQ"] as Market[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={market === m}
              onClick={() => setMarket(m)}
            >
              {m === "KOSPI" ? "코스피" : "코스닥"}
            </button>
          ))}
        </div>
      </div>

      {/* 메모 목록 카드 */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading && memos.length === 0 ? (
          <div
            style={{
              padding: "var(--pad-card)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="sk short" />
                <div className="sk" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="error-block">
            <div className="error-title">{error}</div>
            <div className="error-msg">잠시 후 다시 시도해 주세요</div>
            <button className="btn sm" onClick={() => fetchMemos(0, true)}>
              재시도
            </button>
          </div>
        ) : memos.length === 0 ? (
          <div
            className="error-block"
            style={{ color: "var(--text-4)", padding: 48 }}
          >
            <div style={{ fontSize: 13 }}>저장된 메모가 없습니다</div>
            <button
              className="btn sm ghost"
              onClick={() => navigate("/investor")}
            >
              투자자 동향 보러 가기
            </button>
          </div>
        ) : (
          <div className="memo-list" style={{ padding: "0 var(--pad-card)" }}>
            {memos.map((memo) => (
              <div
                key={memo.id}
                className="memo-item"
                onClick={() => goToInvestor(memo)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && goToInvestor(memo)}
              >
                <div className="memo-date">
                  <span>{fmtDisplayDate(memo.memoDate)}</span>
                  <span className={`tag ${memo.market === "KOSPI" ? "" : "down"}`}>
                    {memo.market}
                  </span>
                  <span
                    style={{
                      color: "var(--text-4)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    {memo.updatedAt
                      ? new Date(memo.updatedAt).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <div className="memo-preview">{memo.content}</div>
              </div>
            ))}

            {hasMore && (
              <div style={{ padding: "16px 0", textAlign: "center" }}>
                <button
                  className="btn ghost sm"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "불러오는 중..." : "더 보기"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
