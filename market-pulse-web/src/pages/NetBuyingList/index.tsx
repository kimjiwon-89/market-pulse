import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, getToken } from "@/services/apiClient";
import { dirCls, triangle, fmtPct, fmtAmount, fmtAmountNum, fmtVolume, fmtVolumeNum } from "@/utils/format";
import { useIsMobile } from "@/hooks";
import { LiveBadge } from "@/components/common/LiveBadge";

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


function getMondayOf(dateStr: string): Date {
  const d = toDate(dateStr);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function getThisWeekBounds(todayStr: string): { start: string; end: string } {
  const mon = getMondayOf(todayStr);
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  const friStr = fromDate(fri);
  return { start: fromDate(mon), end: todayStr <= friStr ? todayStr : friStr };
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

/* sticky 컬럼 폭 — 데스크톱 */
const RANK_W = 44;
const NAME_W = 110;
const AMT_W = 78;
const VOL_W = 68;
const GROUP_W = NAME_W + AMT_W + VOL_W; // 256

/* 모바일용 컬럼 폭 (375px 화면 기준 1개 그룹 온전히 표시: 375-32-44-110=189 → 226 목표) */
const M_NAME_W = 100;
const M_AMT_W = 70;
const M_VOL_W = 56;
const M_GROUP_W = M_NAME_W + M_AMT_W + M_VOL_W; // 226

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
  const isMobile = useIsMobile();
  const nameW = isMobile ? M_NAME_W : NAME_W;
  const amtW = isMobile ? M_AMT_W : AMT_W;
  const volW = isMobile ? M_VOL_W : VOL_W;
  const groupW = isMobile ? M_GROUP_W : GROUP_W;

  const [investorType, setInvestorType] = useState<InvestorType>("FOREIGN");
  const [tradeType, setTradeType] = useState<TradeType>("BUY");
  const [market, setMarket] = useState<MarketType>("KOSPI");

  const today = todayStr();
  const [endDate, setEndDate] = useState(() => getThisWeekBounds(today).end);
  const [startDate, setStartDate] = useState(() => getThisWeekBounds(today).start);

  const dates = useMemo(() => getWeekdays(startDate, endDate), [startDate, endDate]);

  const [dataMap, setDataMap] = useState<Map<string, DateRecord>>(new Map());
  const [snapshotDates, setSnapshotDates] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const memoMarket = market === "ALL" ? "KOSPI" : market;
  const [memo, setMemo] = useState<InvestorMemo | null>(null);
  const [memoContent, setMemoContent] = useState("");
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoSaving, setMemoSaving] = useState(false);

  const allLoaded = useMemo(
    () => dates.every(d => { const r = dataMap.get(d); return r && !r.loading; }),
    [dates, dataMap],
  );

  const visibleDates = useMemo(() => {
    if (!allLoaded) return dates;
    return dates.filter(d => {
      if (d === today) return true;
      const record = dataMap.get(d);
      if (!record || record.error) return true;
      return record.items.length > 0;
    });
  }, [dates, dataMap, today, allLoaded]);

  const summary = useMemo(() => calcRangeTotal(visibleDates, dataMap), [visibleDates, dataMap]);

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
    const mon = getMondayOf(startDate);
    mon.setDate(mon.getDate() + delta * 7);
    const fri = new Date(mon);
    fri.setDate(mon.getDate() + 4);
    setStartDate(fromDate(mon));
    setEndDate(fromDate(fri));
  }

  function resetToToday() {
    const { start, end } = getThisWeekBounds(today);
    setStartDate(start);
    setEndDate(end);
  }

  function dateStatusLabel(date: string): { text: string; color: string } | null {
    if (date === today) return null;
    if (snapshotDates.has(date)) return { text: "저장됨", color: "var(--text-3)" };
    return { text: "미저장", color: "var(--text-4)" };
  }

  const labelTrade = tradeType === "BUY" ? "순매수" : "순매도";
  const labelMarket = market === "KOSPI" ? "코스피" : market === "KOSDAQ" ? "코스닥" : "전체";
  const tradeColor = tradeType === "BUY" ? "var(--up)" : "var(--down)";

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

  /* 모바일: 합계 = 종목명만 / 데스크톱: 합계 = 종목명+대금+수량 */
  const sumColSpan = isMobile ? 1 : 3;
  const sumNameRight = isMobile ? 0 : amtW + volW;

  /* sticky 합계 헤더 — 1·2행 */
  const sumHead123Span: React.CSSProperties = {
    position: "sticky", right: 0, zIndex: 4,
    background: SUMMARY_BG, borderLeft: "2px solid var(--border-strong)",
    boxShadow: "-4px 0 6px -4px rgba(0,0,0,0.12)",
  };
  /* sticky 합계 헤더 — 3행 (종목명) */
  const sumHeadName: React.CSSProperties = {
    position: "sticky", right: sumNameRight, zIndex: 4,
    background: SUMMARY_BG, minWidth: nameW, width: nameW,
    borderLeft: "2px solid var(--border-strong)",
  };
  const sumHeadAmt: React.CSSProperties = {
    position: "sticky", right: volW, zIndex: 4,
    background: SUMMARY_BG, minWidth: amtW, width: amtW,
  };
  const sumHeadVol: React.CSSProperties = {
    position: "sticky", right: 0, zIndex: 4,
    background: SUMMARY_BG, minWidth: volW, width: volW,
    boxShadow: "-4px 0 6px -4px rgba(0,0,0,0.12)",
  };
  /* sticky 합계 바디 셀 */
  const sumBodyName: React.CSSProperties = {
    position: "sticky", right: sumNameRight, zIndex: 2,
    background: SUMMARY_BG, width: nameW,
    borderLeft: "2px solid var(--border-strong)",
    boxShadow: isMobile ? "-4px 0 6px -4px rgba(0,0,0,0.12)" : undefined,
  };
  const sumBodyAmt: React.CSSProperties = {
    position: "sticky", right: volW, zIndex: 2,
    background: SUMMARY_BG, width: amtW,
  };
  const sumBodyVol: React.CSSProperties = {
    position: "sticky", right: 0, zIndex: 2,
    background: SUMMARY_BG, width: volW,
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
          <div className="flex flex-col gap-4">
            {/* 필터 칩 그룹 — 모바일: 가로 스크롤 */}
            <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[
                { label: "투자자", opts: INVESTOR_OPTS, val: investorType, set: setInvestorType as (v: string) => void },
                { label: "거래유형", opts: TRADE_OPTS, val: tradeType, set: setTradeType as (v: string) => void },
                { label: "시장", opts: MARKET_OPTS, val: market, set: setMarket as (v: string) => void },
              ].map(({ label, opts, val, set }) => (
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

            {/* 날짜 선택기 — 모바일: 2행, 데스크톱: 1행 */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              {/* 날짜 입력 행 */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={apiToInput(startDate)}
                  onChange={e => { if (e.target.value) setStartDate(e.target.value.replace(/-/g, "")); }}
                  className="flex-1 md:flex-none"
                />
                <span style={{ color: "var(--text-4)", fontSize: 13 }}>~</span>
                <input
                  type="date"
                  value={apiToInput(endDate)}
                  onChange={e => { if (e.target.value) setEndDate(e.target.value.replace(/-/g, "")); }}
                  className="flex-1 md:flex-none"
                />
              </div>
              {/* 이전/다음/오늘 버튼 행 */}
              <div className="flex items-center gap-2">
                <button className="btn sm flex-1 md:flex-none" onClick={() => shiftWeek(-1)}>← 이전주</button>
                <button className="btn sm flex-1 md:flex-none" onClick={resetToToday}>오늘</button>
                <button className="btn sm flex-1 md:flex-none" onClick={() => shiftWeek(1)}>다음주 →</button>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-4)" }}>
                {visibleDates.length}일 · 거래일만 표시
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
                minWidth: `${RANK_W + visibleDates.length * groupW + (isMobile ? nameW : groupW)}px`,
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th rowSpan={3} style={rankStickyHead}>순위</th>
                  {visibleDates.map(d => {
                    const isToday = d === today;
                    const status = dateStatusLabel(d);
                    return (
                      <th
                        key={d}
                        colSpan={3}
                        style={{
                          textAlign: "center", whiteSpace: "nowrap",
                          borderLeft: "2px solid var(--border-strong)",
                          background: isToday ? "var(--accent-soft)" : "var(--bg-alt)",
                          color: isToday ? "var(--accent)" : "var(--text-3)",
                          fontWeight: isToday ? 700 : 500,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {isToday ? "오늘" : dispDate(d)}
                        <span style={{ display: "block", fontSize: 10, fontWeight: 400, marginTop: 2 }}>
                          {status === null
                            ? <LiveBadge size={10} />
                            : <span style={{ color: status.color }}>{status.text}</span>
                          }
                        </span>
                      </th>
                    );
                  })}
                  <th colSpan={sumColSpan} style={{ ...sumHead123Span, textAlign: "center", whiteSpace: "nowrap", color: "var(--text)", fontWeight: 700 }}>
                    합계
                    <span style={{ display: "block", fontSize: 10, fontWeight: 400, marginTop: 2, color: "var(--text-4)" }}>
                      {visibleDates.length}일 누적
                    </span>
                  </th>
                </tr>
                <tr>
                  {visibleDates.map(d => (
                    <th
                      key={d}
                      colSpan={3}
                      style={{
                        textAlign: "center", fontSize: 11, color: "var(--text-4)",
                        borderLeft: "2px solid var(--border-strong)",
                        background: d === today ? "var(--accent-soft)" : "var(--bg-alt)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {labelTrade}
                    </th>
                  ))}
                  <th colSpan={sumColSpan} style={{ ...sumHead123Span, textAlign: "center", fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                    {labelTrade}
                  </th>
                </tr>
                <tr>
                  {visibleDates.map(d => (
                    <Fragment key={d}>
                      <th style={{ borderLeft: "2px solid var(--border-strong)", background: d === today ? "var(--accent-soft)" : "var(--bg-alt)", minWidth: nameW, width: nameW }}>
                        종목명
                      </th>
                      <th className="num" style={{ background: d === today ? "var(--accent-soft)" : "var(--bg-alt)", minWidth: amtW, width: amtW }}>
                        대금(억)
                      </th>
                      <th className="num" style={{ background: d === today ? "var(--accent-soft)" : "var(--bg-alt)", minWidth: volW, width: volW }}>
                        수량(만주)
                      </th>
                    </Fragment>
                  ))}
                  <th style={sumHeadName}>종목명</th>
                  {!isMobile && <th className="num" style={sumHeadAmt}>대금(억)</th>}
                  {!isMobile && <th className="num" style={sumHeadVol}>수량</th>}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 20 }, (_, ri) => (
                  <tr key={ri}>
                    <td className="rank" style={rankStickyBody}>{ri + 1}</td>

                    {visibleDates.map(d => {
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
                              fontSize: 12, maxWidth: nameW, width: nameW,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              cursor: item ? "pointer" : "default",
                            }}
                            className={item ? "clickable" : ""}
                            onClick={() => { if (item) setSelectedCell({ item, date: d }); }}
                          >
                            {item?.stockName ?? <span style={{ color: "var(--text-4)", fontWeight: 400 }}>-</span>}
                          </td>
                          <td className="num" style={{ fontSize: 12, width: amtW, color: item ? tradeColor : undefined }}>
                            {item ? fmtAmountNum(item.netBuyAmount) : <span style={{ color: "var(--text-4)" }}>-</span>}
                          </td>
                          <td className="num" style={{ fontSize: 12, width: volW, color: item ? tradeColor : undefined }}>
                            {item ? fmtVolumeNum(item.netBuyVolume) : <span style={{ color: "var(--text-4)" }}>-</span>}
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
                            {!isMobile && <td className="num" style={sumBodyAmt}><div className="sk short" style={{ margin: "0 4px" }} /></td>}
                            {!isMobile && <td className="num" style={sumBodyVol}><div className="sk short" style={{ margin: "0 4px" }} /></td>}
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
                          {!isMobile && (
                            <td className="num" style={{ ...sumBodyAmt, fontSize: 12, fontWeight: 600, color: sItem ? tradeColor : undefined }}>
                              {sItem ? fmtAmountNum(sItem.netBuyAmount) : <span style={{ color: "var(--text-4)" }}>-</span>}
                            </td>
                          )}
                          {!isMobile && (
                            <td className="num" style={{ ...sumBodyVol, fontSize: 12, fontWeight: 600, color: sItem ? tradeColor : undefined }}>
                              {sItem ? fmtVolumeNum(sItem.netBuyVolume) : <span style={{ color: "var(--text-4)" }}>-</span>}
                            </td>
                          )}
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
