import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient, getToken } from "@/services/apiClient";
import type { TradeTopItem, InvestorMemo } from "@/types";
import { dirCls, triangle, fmtPct, fmtAmount } from "@/utils/format";
import { LiveBadge } from "@/components/common/LiveBadge";

type Market = "KOSPI" | "KOSDAQ";
type TradeType = "BUY" | "SELL";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
function shiftDay(s: string, delta: number) {
  const d = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
function apiToInput(s: string) { return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`; }
function dispDate(s: string) { return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`; }

/* ── 투자자 열 컴포넌트 ── */
interface ColProps {
  title: string;
  ready?: boolean;
  items: TradeTopItem[];
  loading: boolean;
  tradeType: TradeType;
}

function InvestorCol({ title, ready = true, items, loading, tradeType }: ColProps) {
  const navigate = useNavigate();
  const labelTrade = tradeType === "BUY" ? "순매수" : "순매도";

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", minWidth: 0 }}>
      {/* 열 헤더 */}
      <div
        style={{
          padding: "14px var(--pad-card) 10px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{title}</span>
        {ready ? <LiveBadge size={11} /> : <span className="tag">준비 중</span>}
      </div>

      {/* 컨텐츠 */}
      {!ready ? (
        <div
          style={{
            padding: "48px var(--pad-card)",
            textAlign: "center",
            color: "var(--text-4)",
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          {title} {labelTrade} 데이터<br />서비스 준비 중입니다
        </div>
      ) : loading ? (
        <div style={{ padding: "8px var(--pad-card)", display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="sk" style={{ height: 52, borderRadius: "var(--radius-sm)" }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-4)", fontSize: 13 }}>
          데이터가 없습니다
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <div
              key={item.stockCode}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px var(--pad-card)",
                borderBottom: "1px solid var(--divider)",
                gap: 10,
                cursor: "pointer",
              }}
              className="clickable"
              onClick={() => navigate(`/stock/${item.stockCode}`)}
            >
              {/* 순위 */}
              <span
                style={{
                  width: 22,
                  flexShrink: 0,
                  fontWeight: 700,
                  fontSize: 13,
                  color: item.rank <= 3 ? "var(--accent)" : "var(--text-4)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {item.rank}
              </span>

              {/* 종목명 + 현재가/등락률 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.stockName}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1, fontFamily: "var(--font-mono)" }}>
                  {item.currentPrice > 0 ? (
                    <>
                      {item.currentPrice.toLocaleString()}원{" "}
                      <span className={dirCls(item.changeRate)}>
                        {triangle(item.changeRate)}{fmtPct(item.changeRate)}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "var(--text-4)" }}>{item.stockCode}</span>
                  )}
                </div>
              </div>

              {/* 순매수대금 */}
              <div
                style={{
                  flexShrink: 0,
                  textAlign: "right",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                {fmtAmount(item.netBuyAmount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 메인 페이지 ── */
export function InvestorTrend() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthed = !!getToken();

  const [market, setMarket] = useState<Market>(
    (searchParams.get("market") as Market) ?? "KOSPI"
  );
  const [tradeType, setTradeType] = useState<TradeType>("BUY");
  const [date, setDate] = useState(
    searchParams.get("date") ?? todayStr()
  );
  const [investorTab, setInvestorTab] = useState<"FOREIGN" | "INSTITUTION" | "INDIVIDUAL">("FOREIGN");

  const [foreignItems, setForeignItems] = useState<TradeTopItem[]>([]);
  const [foreignLoading, setForeignLoading] = useState(false);

  const [memo, setMemo] = useState<InvestorMemo | null>(null);
  const [memoContent, setMemoContent] = useState("");
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoSaving, setMemoSaving] = useState(false);

  const fetchForeign = useCallback(async () => {
    setForeignLoading(true);
    try {
      const res = await apiClient.get("/investor/trade-top", {
        params: { market, investorType: "FOREIGN", tradeType, date },
      });
      setForeignItems(res.data.data ?? []);
    } catch {
      setForeignItems([]);
    } finally {
      setForeignLoading(false);
    }
  }, [market, tradeType, date]);

  const fetchMemo = useCallback(async () => {
    if (!isAuthed) return;
    setMemoLoading(true);
    try {
      const res = await apiClient.get("/investor/memo", { params: { date, market } });
      const m: InvestorMemo | null = res.data.data ?? null;
      setMemo(m);
      setMemoContent(m?.content ?? "");
    } catch {
      setMemo(null);
      setMemoContent("");
    } finally {
      setMemoLoading(false);
    }
  }, [date, market, isAuthed]);

  useEffect(() => { fetchForeign(); }, [fetchForeign]);
  useEffect(() => { fetchMemo(); }, [fetchMemo]);

  async function saveMemo() {
    if (!isAuthed || !memoContent.trim()) return;
    setMemoSaving(true);
    try {
      const res = await apiClient.post("/investor/memo", { date, market, content: memoContent });
      setMemo(res.data.data);
    } finally {
      setMemoSaving(false);
    }
  }

  async function deleteMemo() {
    if (!isAuthed || !memo) return;
    try {
      await apiClient.delete(`/investor/memo/${memo.id}`);
      setMemo(null);
      setMemoContent("");
    } catch { /* silent */ }
  }

  const labelMarket = market === "KOSPI" ? "코스피" : "코스닥";

  return (
    <div className="stack">
      {/* 필터 카드 */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">투자자 동향</div>
          <span className="tag">KRX 기준</span>
        </div>
        <div className="flex flex-col gap-4">
          {/* 필터 칩 그룹 */}
          <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {([
              { label: "시장",   opts: [["KOSPI", "코스피"], ["KOSDAQ", "코스닥"]] as [string, string][], val: market,     set: (v: string) => setMarket(v as Market) },
              { label: "거래유형", opts: [["BUY", "순매수"], ["SELL", "순매도"]] as [string, string][],   val: tradeType, set: (v: string) => setTradeType(v as TradeType) },
            ]).map(({ label, opts, val, set }) => (
              <div key={label} className="flex flex-col gap-1.5 flex-shrink-0">
                <span style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {label}
                </span>
                <div className="chips">
                  {opts.map(([v, lbl]) => (
                    <button key={v} className="chip" aria-pressed={val === v} onClick={() => set(v)}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 날짜 선택 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn sm" onClick={() => setDate((d) => shiftDay(d, -1))}>← 이전일</button>
            <input
              type="date"
              value={apiToInput(date)}
              onChange={(e) => { if (e.target.value) setDate(e.target.value.replace(/-/g, "")); }}
            />
            <button className="btn sm" onClick={() => setDate((d) => shiftDay(d, 1))}>다음일 →</button>
            <button className="btn sm" onClick={() => setDate(todayStr())}>오늘</button>
            <span style={{ fontSize: 12, color: "var(--text-4)" }}>{dispDate(date)}</span>
          </div>

          {/* 투자자 탭 — 모바일 전용 */}
          <div className="flex gap-2 lg:hidden">
            {([ ["FOREIGN", "외국인"], ["INSTITUTION", "기관"], ["INDIVIDUAL", "개인"] ] as const).map(([v, lbl]) => (
              <button key={v} className="chip flex-1" aria-pressed={investorTab === v} onClick={() => setInvestorTab(v)}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 투자자 열 — 모바일: 탭 선택 1개, 데스크톱: 3열 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={investorTab === "FOREIGN" ? "block" : "hidden lg:block"}>
          <InvestorCol
            title="외국인"
            items={foreignItems}
            loading={foreignLoading}
            tradeType={tradeType}
          />
        </div>
        <div className={investorTab === "INSTITUTION" ? "block" : "hidden lg:block"}>
          <InvestorCol
            title="기관"
            ready={false}
            items={[]}
            loading={false}
            tradeType={tradeType}
          />
        </div>
        <div className={investorTab === "INDIVIDUAL" ? "block" : "hidden lg:block"}>
          <InvestorCol
            title="개인"
            ready={false}
            items={[]}
            loading={false}
            tradeType={tradeType}
          />
        </div>
      </div>

      {/* 메모 카드 */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">메모</div>
            <div className="card-sub">
              {labelMarket} · {dispDate(date)}
              {isAuthed && memo && (
                <span style={{ marginLeft: 8, color: "var(--text-4)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  저장됨
                </span>
              )}
            </div>
          </div>
          {isAuthed && memo && (
            <button className="btn sm danger" onClick={deleteMemo}>삭제</button>
          )}
        </div>

        {isAuthed ? (
          <>
            <textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder={memoLoading ? "불러오는 중..." : "이 날의 투자 동향을 기록하세요..."}
              disabled={memoLoading}
              style={{ width: "100%", minHeight: 100 }}
            />
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn primary"
                onClick={saveMemo}
                disabled={memoSaving || !memoContent.trim()}
              >
                {memoSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              minHeight: 100,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              border: "1px dashed var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text-4)",
              fontSize: 13,
            }}
          >
            <span>로그인이 필요한 기능입니다</span>
            <button className="btn sm" onClick={() => navigate("/login")}>로그인하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
