import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, getToken } from "@/services/apiClient";
import type { MemoRecord, MemoSourceType } from "@/types";

type MarketFilter = "ALL" | "KOSPI" | "KOSDAQ";
type SourceFilter = "ALL" | MemoSourceType;

const PAGE_SIZE = 20;

const SOURCE_LABEL: Record<MemoSourceType, string> = {
  INVESTOR_TREND: "투자자 동향",
  NET_BUY: "순매수도",
  STOCK_DETAIL: "종목 상세",
  MANUAL: "직접 작성",
};

function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inputToApi(value: string): string | undefined {
  return value ? value.replace(/-/g, "") : undefined;
}

function fmtDisplayDate(memoDate: string | null): string {
  if (!memoDate) return "날짜 없음";
  return memoDate.replace(/-/g, ".");
}

function fmtApiDate(memoDate: string | null): string {
  return memoDate ? memoDate.replace(/-/g, "") : "";
}

function contextPath(memo: MemoRecord): string {
  if (memo.sourceType === "NET_BUY") {
    const params = new URLSearchParams();
    if (memo.memoDate) params.set("date", fmtApiDate(memo.memoDate));
    if (memo.market) params.set("market", memo.market);
    return `/net-buy?${params.toString()}`;
  }
  if (memo.sourceType === "STOCK_DETAIL" && memo.stockCode) {
    return `/stock/${memo.stockCode}`;
  }
  if (memo.sourceType === "INVESTOR_TREND") {
    const params = new URLSearchParams();
    if (memo.memoDate) params.set("date", fmtApiDate(memo.memoDate));
    if (memo.market) params.set("market", memo.market);
    return `/investor?${params.toString()}`;
  }
  return "/memo";
}

export function MemoList() {
  const navigate = useNavigate();
  const isAuthed = !!getToken();

  const [sourceType, setSourceType] = useState<SourceFilter>("ALL");
  const [market, setMarket] = useState<MarketFilter>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(todayInput());
  const [stockCode, setStockCode] = useState("");
  const [keyword, setKeyword] = useState("");
  const [memos, setMemos] = useState<MemoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchMemos = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (!isAuthed) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get("/memo", {
          params: {
            sourceType: sourceType === "ALL" ? undefined : sourceType,
            market: market === "ALL" ? undefined : market,
            from: inputToApi(from),
            to: inputToApi(to),
            stockCode: stockCode.trim() || undefined,
            keyword: keyword.trim() || undefined,
            page: pageNum,
            size: PAGE_SIZE,
          },
        });
        const data: MemoRecord[] = res.data.data ?? [];
        setMemos((prev) => (replace ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
      } catch {
        setError("메모를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    },
    [from, isAuthed, keyword, market, sourceType, stockCode, to]
  );

  useEffect(() => {
    if (!isAuthed) return;
    setPage(0);
    fetchMemos(0, true);
  }, [fetchMemos, isAuthed]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchMemos(next, false);
  }

  function resetFilters() {
    setSourceType("ALL");
    setMarket("ALL");
    setFrom("");
    setTo(todayInput());
    setStockCode("");
    setKeyword("");
  }

  if (!isAuthed) {
    return (
      <div style={{ position: "relative" }}>
        <div className="stack" style={{ filter: "blur(3px)", opacity: 0.45, pointerEvents: "none", userSelect: "none" }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">메모 모아보기</div>
              <span className="tag">필터</span>
            </div>
          </div>
          <div className="card" style={{ padding: "var(--pad-card)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                <div className="sk short" />
                <div className="sk" />
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 600 }}>
            로그인이 필요한 기능입니다
          </div>
          <button className="btn primary sm" onClick={() => navigate("/login")}>
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">메모 모아보기</div>
            <div className="card-sub">기능, 날짜, 시장, 종목, 키워드로 투자 기록을 찾습니다</div>
          </div>
          <span className="tag">최신순</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>기능</span>
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceFilter)}>
              <option value="ALL">전체</option>
              <option value="NET_BUY">순매수도</option>
              <option value="INVESTOR_TREND">투자자 동향</option>
              <option value="STOCK_DETAIL">종목 상세</option>
              <option value="MANUAL">직접 작성</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>시장</span>
            <select value={market} onChange={(e) => setMarket(e.target.value as MarketFilter)}>
              <option value="ALL">전체</option>
              <option value="KOSPI">코스피</option>
              <option value="KOSDAQ">코스닥</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>종목코드</span>
            <input value={stockCode} onChange={(e) => setStockCode(e.target.value)} placeholder="005930" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>시작일</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>종료일</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>키워드</span>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="외국인, 반도체..." />
          </label>
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn sm ghost" onClick={resetFilters}>초기화</button>
          <button className="btn sm primary" onClick={() => fetchMemos(0, true)} disabled={loading}>
            조회
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading && memos.length === 0 ? (
          <div style={{ padding: "var(--pad-card)", display: "flex", flexDirection: "column", gap: 16 }}>
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
            <button className="btn sm" onClick={() => fetchMemos(0, true)}>재시도</button>
          </div>
        ) : memos.length === 0 ? (
          <div className="error-block" style={{ color: "var(--text-4)", padding: 48 }}>
            <div style={{ fontSize: 13 }}>조건에 맞는 메모가 없습니다</div>
            <button className="btn sm ghost" onClick={() => navigate("/net-buy")}>순매수도 보러 가기</button>
          </div>
        ) : (
          <div className="memo-list" style={{ padding: "0 var(--pad-card)" }}>
            {memos.map((memo) => (
              <div
                key={memo.id}
                className="memo-item"
                onClick={() => navigate(contextPath(memo))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(contextPath(memo))}
              >
                <div className="memo-date">
                  <span>{fmtDisplayDate(memo.memoDate)}</span>
                  <span className="tag">{SOURCE_LABEL[memo.sourceType]}</span>
                  {memo.market && <span className={`tag ${memo.market === "KOSDAQ" ? "down" : ""}`}>{memo.market}</span>}
                  {memo.stockName && (
                    <span style={{ color: "var(--text-3)", fontSize: 12 }}>
                      {memo.stockName} {memo.stockCode && <span style={{ fontFamily: "var(--font-mono)" }}>{memo.stockCode}</span>}
                    </span>
                  )}
                </div>
                {memo.title && <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{memo.title}</div>}
                <div className="memo-preview">{memo.content}</div>
              </div>
            ))}
            {hasMore && (
              <div style={{ padding: "16px 0", textAlign: "center" }}>
                <button className="btn ghost sm" onClick={loadMore} disabled={loading}>
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
