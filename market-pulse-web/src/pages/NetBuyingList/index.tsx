import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, getToken } from "@/services/apiClient";
import { dirCls, triangle, fmtPct, fmtAmount, fmtVolume } from "@/utils/format";

type InvestorType = "FOREIGN" | "INSTITUTION" | "ALL";
type TradeType = "BUY" | "SELL";
type MarketType = "KOSPI" | "KOSDAQ" | "ALL";

interface NetBuyItem {
  rank: number;
  stockCode: string;
  stockName: string;
  currentPrice: number;
  changeRate: number;
  netBuyAmount: number;
  netBuyVolume: number;
  foreignShareRatio: number;
}

interface DateRecord {
  items: NetBuyItem[];
  loading: boolean;
  error: boolean;
}

interface InvestorMemo {
  id: number;
  memoDate: string;
  market: string;
  content: string;
}

interface SelectedCell {
  item: NetBuyItem;
  date: string;
}

/* ── 날짜 유틸 ── */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function toDate(s: string): Date {
  return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
}

function fromDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function apiToInput(s: string) {
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function dispDate(s: string) {
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function getWeekdays(start: string, end: string): string[] {
  const result: string[] = [];
  const cur = toDate(start);
  const endD = toDate(end);
  while (cur <= endD) {
    if (isWeekday(cur)) result.push(fromDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

function nWeekdaysBefore(n: number, from: string): string {
  const d = toDate(from);
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() - 1);
    if (isWeekday(d)) count++;
  }
  return fromDate(d);
}

function nWeekdaysAfter(n: number, from: string): string {
  const d = toDate(from);
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    if (isWeekday(d)) count++;
  }
  return fromDate(d);
}

/* ── 전체 기간 합계 (조회된 모든 날짜 합산 → 대금순 TOP 20) ── */
function calcRangeTotal(dates: string[], dataMap: Map<string, DateRecord>): {
  items: NetBuyItem[];
  loading: boolean;
  ready: boolean;
} {
  const map = new Map<string, { name: string; amt: number; vol: number }>();
  let anyLoading = false;
  let anyReady = false;
  for (const d of dates) {
    const record = dataMap.get(d);
    if (!record || record.loading) { anyLoading = true; continue; }
    if (record.error) continue;
    anyReady = true;
    for (const item of record.items) {
      const e = map.get(item.stockCode);
      if (e) { e.amt += item.netBuyAmount; e.vol += item.netBuyVolume; }
      else map.set(item.stockCode, { name: item.stockName, amt: item.netBuyAmount, vol: item.netBuyVolume });
    }
  }
  const items = [...map.entries()]
    .sort((a, b) => b[1].amt - a[1].amt)
    .slice(0, 20)
    .map(([code, v], i) => ({
      rank: i + 1, stockCode: code, stockName: v.name,
      currentPrice: 0, changeRate: 0, foreignShareRatio: 0,
      netBuyAmount: v.amt, netBuyVolume: v.vol,
    }));
  return { items, loading: anyLoading && !anyReady, ready: anyReady };
}

const INVESTOR_OPTS: [InvestorType, string][] = [["FOREIGN", "외국인"], ["INSTITUTION", "기관"], ["ALL", "전체"]];
const TRADE_OPTS: [TradeType, string][] = [["BUY", "순매수"], ["SELL", "순매도"]];
const MARKET_OPTS: [MarketType, string][] = [["KOSPI", "코스피"], ["KOSDAQ", "코스닥"], ["ALL", "전체"]];
const WEEK_SHIFT = 5; // 평일 5일 = 1주

/* sticky 컬럼 폭 */
const RANK_W = 44;
const NAME_W = 110;
const AMT_W = 78;
const VOL_W = 68;
const GROUP_W = NAME_W + AMT_W + VOL_W;
const SUMMARY_BG = "var(--accent-soft)";

/* ── 종목 상세 모달 ── */
interface StockModalProps {
  cell: SelectedCell;
  investorType: InvestorType;
  tradeType: TradeType;
  market: MarketType;
  onClose: () => void;
}

function StockModal({ cell, investorType, tradeType, market: marketProp, onClose }: StockModalProps) {
  const navigate = useNavigate();
  const isAuthed = !!getToken();
  const { item, date } = cell;
  const memoMarket = marketProp === "ALL" ? "KOSPI" : marketProp;
  const labelTrade = tradeType === "BUY" ? "순매수" : "순매도";
  const hasPrice = item.currentPrice > 0;

  const [memo, setMemo] = useState<InvestorMemo | null>(null);
  const [memoContent, setMemoContent] = useState("");
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoSaving, setMemoSaving] = useState(false);

  useEffect(() => {
    if (!isAuthed) return;
    setMemoLoading(true);
    apiClient.get("/investor/memo", { params: { date, market: memoMarket } })
      .then(res => {
        const m: InvestorMemo | null = res.data.data ?? null;
        setMemo(m);
        setMemoContent(m?.content ?? "");
      })
      .catch(() => { setMemo(null); setMemoContent(""); })
      .finally(() => setMemoLoading(false));
  }, [date, memoMarket, isAuthed]);

  async function saveMemo() {
    if (!isAuthed || !memoContent.trim()) return;
    setMemoSaving(true);
    try {
      const res = await apiClient.post("/investor/memo", { date, market: memoMarket, content: memoContent });
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

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          width: "100%", maxWidth: 460,
          boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: "18px var(--pad-card)",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>
              {item.stockName}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
                {item.stockCode}
              </span>
              <button
                className="btn ghost"
                style={{ fontSize: 11, padding: "2px 8px", height: 22 }}
                onClick={() => navigate(`/stock/${item.stockCode}`)}
              >
                종목 상세 →
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, width: 28, height: 28,
              border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              background: "var(--bg-alt)", cursor: "pointer",
              color: "var(--text-3)", fontSize: 16, lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: "16px var(--pad-card)",
          borderBottom: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: investorType === "FOREIGN" && item.foreignShareRatio > 0
            ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
          gap: "12px 20px",
        }}>
          <div className="stat-cell" style={{ margin: 0 }}>
            <div className="stat-label">현재가</div>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {hasPrice ? item.currentPrice.toLocaleString() : "—"}
            </div>
            {hasPrice && <div className="stat-delta" style={{ fontSize: 11 }}>원</div>}
          </div>
          <div className="stat-cell" style={{ margin: 0 }}>
            <div className="stat-label">등락률</div>
            <div className={`stat-value ${hasPrice ? dirCls(item.changeRate) : "flat"}`} style={{ fontSize: 20 }}>
              {hasPrice ? <>{triangle(item.changeRate)}{fmtPct(item.changeRate)}</> : "—"}
            </div>
          </div>
          {investorType === "FOREIGN" && item.foreignShareRatio > 0 && (
            <div className="stat-cell" style={{ margin: 0 }}>
              <div className="stat-label">외국인 지분률</div>
              <div className="stat-value" style={{ fontSize: 20 }}>
                {item.foreignShareRatio.toFixed(2)}
              </div>
              <div className="stat-delta" style={{ fontSize: 11 }}>%</div>
            </div>
          )}
        </div>

        <div style={{
          padding: "14px var(--pad-card)",
          borderBottom: "1px solid var(--border)",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px",
          background: "var(--bg-alt)",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {labelTrade}대금
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
              {fmtAmount(item.netBuyAmount)}<span style={{ fontSize: 11, color: "var(--text-4)", marginLeft: 2 }}>억</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {labelTrade}량
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
              {fmtVolume(item.netBuyVolume)}<span style={{ fontSize: 11, color: "var(--text-4)", marginLeft: 2 }}>주</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px var(--pad-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>메모</span>
              <span style={{ fontSize: 11, color: "var(--text-4)", marginLeft: 8, fontFamily: "var(--font-mono)" }}>
                {dispDate(date)} · {memoMarket}
              </span>
              {isAuthed && memo && (
                <span style={{ marginLeft: 6, fontSize: 11, color: "var(--text-4)" }}>· 저장됨</span>
              )}
            </div>
            {isAuthed && memo && (
              <button className="btn sm danger" onClick={deleteMemo}>삭제</button>
            )}
          </div>
          {isAuthed ? (
            <>
              <textarea
                value={memoContent}
                onChange={e => setMemoContent(e.target.value)}
                placeholder={memoLoading ? "불러오는 중..." : "이 날의 투자 메모를 기록하세요..."}
                disabled={memoLoading}
                style={{ width: "100%", minHeight: 80, resize: "vertical" }}
              />
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
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
            <div style={{
              minHeight: 64, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8,
              border: "1px dashed var(--border)", borderRadius: "var(--radius)",
              color: "var(--text-4)", fontSize: 13,
            }}>
              <span>로그인이 필요한 기능입니다</span>
              <button className="btn sm" onClick={() => navigate("/login")}>로그인하기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ── */
export function NetBuyingList() {
  const navigate = useNavigate();
  const isAuthed = !!getToken();

  const [investorType, setInvestorType] = useState<InvestorType>("FOREIGN");
  const [tradeType, setTradeType] = useState<TradeType>("BUY");
  const [market, setMarket] = useState<MarketType>("KOSPI");

  const today = todayStr();
  const [endDate, setEndDate] = useState(today);
  const [startDate, setStartDate] = useState(() => nWeekdaysBefore(9, today));

  const dates = useMemo(() => getWeekdays(startDate, endDate), [startDate, endDate]);

  const [dataMap, setDataMap] = useState<Map<string, DateRecord>>(new Map());
  const [snapshotDates, setSnapshotDates] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const memoMarket = market === "ALL" ? "KOSPI" : market;
  const [memo, setMemo] = useState<InvestorMemo | null>(null);
  const [memoContent, setMemoContent] = useState("");
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoSaving, setMemoSaving] = useState(false);

  const summary = useMemo(() => calcRangeTotal(dates, dataMap), [dates, dataMap]);

  const fetchForDate = useCallback(async (date: string, iType: InvestorType, tType: TradeType, mkt: MarketType) => {
    if (iType === "INSTITUTION") {
      setDataMap(prev => new Map([...prev, [date, { items: [], loading: false, error: false }]]));
      return;
    }
    setDataMap(prev => new Map([...prev, [date, { items: [], loading: true, error: false }]]));
    try {
      const res = await apiClient.get("/investor/trade-top", {
        params: { date, investorType: iType, tradeType: tType, market: mkt },
      });
      setDataMap(prev => new Map([...prev, [date, { items: res.data.data ?? [], loading: false, error: false }]]));
    } catch {
      setDataMap(prev => new Map([...prev, [date, { items: [], loading: false, error: true }]]));
    }
  }, []);

  useEffect(() => {
    setDataMap(new Map());
    for (const d of dates) fetchForDate(d, investorType, tradeType, market);
  }, [dates, investorType, tradeType, market, fetchForDate]);

  useEffect(() => {
    if (investorType === "INSTITUTION") { setSnapshotDates(new Set()); return; }
    apiClient.get("/investor/snapshot/dates", { params: { investorType, tradeType, market } })
      .then(res => setSnapshotDates(new Set(res.data.data ?? [])))
      .catch(() => setSnapshotDates(new Set()));
  }, [investorType, tradeType, market]);

  const fetchMemo = useCallback(async () => {
    if (!isAuthed) return;
    setMemoLoading(true);
    try {
      const res = await apiClient.get("/investor/memo", { params: { date: today, market: memoMarket } });
      const m: InvestorMemo | null = res.data.data ?? null;
      setMemo(m);
      setMemoContent(m?.content ?? "");
    } catch {
      setMemo(null); setMemoContent("");
    } finally {
      setMemoLoading(false);
    }
  }, [today, memoMarket, isAuthed]);

  useEffect(() => { fetchMemo(); }, [fetchMemo]);

  async function saveMemo() {
    if (!isAuthed || !memoContent.trim()) return;
    setMemoSaving(true);
    try {
      const res = await apiClient.post("/investor/memo", { date: today, market: memoMarket, content: memoContent });
      setMemo(res.data.data);
    } finally {
      setMemoSaving(false);
    }
  }

  async function deleteMemo() {
    if (!isAuthed || !memo) return;
    try {
      await apiClient.delete(`/investor/memo/${memo.id}`);
      setMemo(null); setMemoContent("");
    } catch { /* silent */ }
  }

  function shiftWeek(delta: number) {
    const shift = delta < 0 ? nWeekdaysBefore : nWeekdaysAfter;
    setStartDate(shift(WEEK_SHIFT, startDate));
    setEndDate(shift(WEEK_SHIFT, endDate));
  }

  function resetToToday() {
    const end = today;
    const start = nWeekdaysBefore(dates.length - 1, end);
    setEndDate(end);
    setStartDate(start);
  }

  function dateStatusLabel(date: string): { text: string; color: string } {
    if (date === today) return { text: "실시간", color: "var(--accent)" };
    if (snapshotDates.has(date)) return { text: "저장됨", color: "var(--text-3)" };
    return { text: "미저장", color: "var(--text-4)" };
  }

  const labelTrade = tradeType === "BUY" ? "순매수" : "순매도";
  const labelMarket = market === "KOSPI" ? "코스피" : market === "KOSDAQ" ? "코스닥" : "전체";

  /* sticky 헤더 — 순위(왼쪽) / 합계(오른쪽) */
  const rankStickyHead: React.CSSProperties = {
    width: RANK_W, paddingLeft: 12, verticalAlign: "middle",
    borderBottom: "1px solid var(--border)",
    position: "sticky", left: 0, zIndex: 4, background: "var(--bg-alt)",
  };
  const rankStickyBody: React.CSSProperties = {
    paddingLeft: 12,
    position: "sticky", left: 0, zIndex: 3, background: "var(--bg-panel)",
    borderRight: "1px solid var(--border)",
  };

  /* sticky 합계 컬럼 — colSpan=3 헤더 (1, 2행) */
  const sumHead123Span: React.CSSProperties = {
    position: "sticky", right: 0, zIndex: 4,
    background: SUMMARY_BG, borderLeft: "2px solid var(--border-strong)",
    boxShadow: "-4px 0 6px -4px rgba(0,0,0,0.12)",
  };
  /* sticky 합계 컬럼 — 3행 (종목명/대금/수량) */
  const sumHeadName: React.CSSProperties = {
    position: "sticky", right: AMT_W + VOL_W, zIndex: 4,
    background: SUMMARY_BG, minWidth: NAME_W, width: NAME_W,
    borderLeft: "2px solid var(--border-strong)",
  };
  const sumHeadAmt: React.CSSProperties = {
    position: "sticky", right: VOL_W, zIndex: 4,
    background: SUMMARY_BG, minWidth: AMT_W, width: AMT_W,
  };
  const sumHeadVol: React.CSSProperties = {
    position: "sticky", right: 0, zIndex: 4,
    background: SUMMARY_BG, minWidth: VOL_W, width: VOL_W,
    boxShadow: "-4px 0 6px -4px rgba(0,0,0,0.12)",
  };
  /* sticky 합계 컬럼 — 바디 셀 */
  const sumBodyName: React.CSSProperties = {
    position: "sticky", right: AMT_W + VOL_W, zIndex: 2,
    background: SUMMARY_BG, width: NAME_W,
    borderLeft: "2px solid var(--border-strong)",
  };
  const sumBodyAmt: React.CSSProperties = {
    position: "sticky", right: VOL_W, zIndex: 2,
    background: SUMMARY_BG, width: AMT_W,
  };
  const sumBodyVol: React.CSSProperties = {
    position: "sticky", right: 0, zIndex: 2,
    background: SUMMARY_BG, width: VOL_W,
    boxShadow: "-4px 0 6px -4px rgba(0,0,0,0.12)",
  };

  return (
    <>
      {selectedCell && (
        <StockModal
          cell={selectedCell}
          investorType={investorType}
          tradeType={tradeType}
          market={market}
          onClose={() => setSelectedCell(null)}
        />
      )}

      <div className="stack">
        {/* 필터 카드 */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">순매수도 순위</div>
            <span className="tag">KRX 기준</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { label: "투자자", opts: INVESTOR_OPTS, val: investorType, set: setInvestorType as (v: string) => void },
                { label: "거래유형", opts: TRADE_OPTS, val: tradeType, set: setTradeType as (v: string) => void },
                { label: "시장", opts: MARKET_OPTS, val: market, set: setMarket as (v: string) => void },
              ].map(({ label, opts, val, set }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div className="date-nav" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  className="date-nav-btn"
                  onClick={() => shiftWeek(-1)}
                  title="1주 이전"
                >
                  ←
                </button>
                <input
                  type="date"
                  value={apiToInput(startDate)}
                  onChange={e => { if (e.target.value) setStartDate(e.target.value.replace(/-/g, "")); }}
                />
                <span style={{ color: "var(--text-4)", fontSize: 13 }}>~</span>
                <input
                  type="date"
                  value={apiToInput(endDate)}
                  onChange={e => { if (e.target.value) setEndDate(e.target.value.replace(/-/g, "")); }}
                />
                <button
                  className="date-nav-btn"
                  onClick={() => shiftWeek(1)}
                  title="1주 다음"
                >
                  →
                </button>
                <button className="btn sm" onClick={resetToToday}>오늘</button>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-4)", marginLeft: 4 }}>
                {dates.length}일 · 평일만 표시
              </span>
            </div>
          </div>
        </div>

        {/* 타임라인 테이블 */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {investorType === "INSTITUTION" && (
            <div style={{
              padding: "10px var(--pad-card)",
              background: "var(--accent-soft)",
              borderBottom: "1px solid var(--border)",
              fontSize: 12, color: "var(--text-3)",
            }}>
              <span style={{ fontWeight: 600, color: "var(--text)", marginRight: 6 }}>기관 데이터 준비 중</span>
              기관 투자자 데이터는 현재 지원되지 않습니다 — 외국인을 선택해주세요
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table
              className="t"
              style={{
                minWidth: `${RANK_W + dates.length * GROUP_W + GROUP_W}px`,
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th rowSpan={3} style={rankStickyHead}>순위</th>
                  {dates.map(d => {
                    const status = dateStatusLabel(d);
                    return (
                      <th
                        key={d}
                        colSpan={3}
                        style={{
                          textAlign: "center", whiteSpace: "nowrap",
                          borderLeft: "2px solid var(--border-strong)",
                          background: "var(--bg-alt)", color: "var(--text-3)",
                          fontWeight: 500, letterSpacing: "0.02em",
                        }}
                      >
                        {dispDate(d)}
                        <span style={{ display: "block", fontSize: 10, fontWeight: 400, marginTop: 2, color: status.color }}>
                          {status.text}
                        </span>
                      </th>
                    );
                  })}
                  <th colSpan={3} style={{ ...sumHead123Span, textAlign: "center", whiteSpace: "nowrap", color: "var(--text)", fontWeight: 700 }}>
                    합계
                    <span style={{ display: "block", fontSize: 10, fontWeight: 400, marginTop: 2, color: "var(--text-4)" }}>
                      {dates.length}일 누적
                    </span>
                  </th>
                </tr>
                <tr>
                  {dates.map(d => (
                    <th
                      key={d}
                      colSpan={3}
                      style={{
                        textAlign: "center", fontSize: 11, color: "var(--text-4)",
                        borderLeft: "2px solid var(--border-strong)",
                        background: "var(--bg-alt)", whiteSpace: "nowrap",
                      }}
                    >
                      {labelTrade}
                    </th>
                  ))}
                  <th colSpan={3} style={{ ...sumHead123Span, textAlign: "center", fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                    {labelTrade}
                  </th>
                </tr>
                <tr>
                  {dates.map(d => (
                    <Fragment key={d}>
                      <th style={{ borderLeft: "2px solid var(--border-strong)", background: "var(--bg-alt)", minWidth: NAME_W, width: NAME_W }}>
                        종목명
                      </th>
                      <th className="num" style={{ background: "var(--bg-alt)", minWidth: AMT_W, width: AMT_W }}>
                        대금(억)
                      </th>
                      <th className="num" style={{ background: "var(--bg-alt)", minWidth: VOL_W, width: VOL_W }}>
                        수량
                      </th>
                    </Fragment>
                  ))}
                  <th style={sumHeadName}>종목명</th>
                  <th className="num" style={sumHeadAmt}>대금(억)</th>
                  <th className="num" style={sumHeadVol}>수량</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 20 }, (_, ri) => (
                  <tr key={ri}>
                    <td className="rank" style={rankStickyBody}>{ri + 1}</td>

                    {dates.map(d => {
                      const record = dataMap.get(d) ?? { items: [], loading: true, error: false };
                      const item = record.items[ri];
                      const borderLeft = "2px solid var(--border-strong)";

                      if (record.loading) {
                        return (
                          <Fragment key={d}>
                            <td style={{ borderLeft }}><div className="sk short" style={{ margin: "0 4px" }} /></td>
                            <td className="num"><div className="sk short" style={{ margin: "0 4px" }} /></td>
                            <td className="num"><div className="sk short" style={{ margin: "0 4px" }} /></td>
                          </Fragment>
                        );
                      }

                      return (
                        <Fragment key={d}>
                          <td
                            style={{
                              borderLeft, fontWeight: 600, color: "var(--text)",
                              fontSize: 12, maxWidth: NAME_W, width: NAME_W,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              cursor: item ? "pointer" : "default",
                            }}
                            className={item ? "clickable" : ""}
                            onClick={() => { if (item) setSelectedCell({ item, date: d }); }}
                          >
                            {item?.stockName ?? <span style={{ color: "var(--text-4)", fontWeight: 400 }}>-</span>}
                          </td>
                          <td className="num" style={{ fontSize: 12, width: AMT_W }}>
                            {item ? fmtAmount(item.netBuyAmount) : <span style={{ color: "var(--text-4)" }}>-</span>}
                          </td>
                          <td className="num" style={{ fontSize: 12, width: VOL_W }}>
                            {item ? fmtVolume(item.netBuyVolume) : <span style={{ color: "var(--text-4)" }}>-</span>}
                          </td>
                        </Fragment>
                      );
                    })}

                    {/* 합계 컬럼 (오른쪽 고정) */}
                    {(() => {
                      const sItem = summary.items[ri];
                      if (summary.loading) {
                        return (
                          <>
                            <td style={sumBodyName}><div className="sk short" style={{ margin: "0 4px" }} /></td>
                            <td className="num" style={sumBodyAmt}><div className="sk short" style={{ margin: "0 4px" }} /></td>
                            <td className="num" style={sumBodyVol}><div className="sk short" style={{ margin: "0 4px" }} /></td>
                          </>
                        );
                      }
                      return (
                        <>
                          <td
                            style={{
                              ...sumBodyName,
                              fontWeight: 700, color: "var(--text)", fontSize: 12,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}
                          >
                            {sItem?.stockName ?? <span style={{ color: "var(--text-4)", fontWeight: 400 }}>-</span>}
                          </td>
                          <td className="num" style={{ ...sumBodyAmt, fontSize: 12, fontWeight: 600 }}>
                            {sItem ? fmtAmount(sItem.netBuyAmount) : <span style={{ color: "var(--text-4)" }}>-</span>}
                          </td>
                          <td className="num" style={{ ...sumBodyVol, fontSize: 12, fontWeight: 600 }}>
                            {sItem ? fmtVolume(sItem.netBuyVolume) : <span style={{ color: "var(--text-4)" }}>-</span>}
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 메모 — 오늘 날짜 기준 */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">메모</div>
              <div className="card-sub">
                {labelMarket} · {dispDate(today)}
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
                onChange={e => setMemoContent(e.target.value)}
                placeholder={memoLoading ? "불러오는 중..." : "오늘의 순매수 동향을 기록하세요..."}
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
            <div style={{
              minHeight: 100, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 10,
              border: "1px dashed var(--border)", borderRadius: "var(--radius)",
              color: "var(--text-4)", fontSize: 13,
            }}>
              <span>로그인이 필요한 기능입니다</span>
              <button className="btn sm" onClick={() => navigate("/login")}>로그인하기</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
