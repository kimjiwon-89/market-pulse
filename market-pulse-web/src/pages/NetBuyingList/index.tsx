import { useState, useEffect, useCallback, Fragment } from "react";
import { apiClient } from "@/services/apiClient";
import { fmtAmount, fmtVolume } from "@/utils/format";

type InvestorType = "FOREIGN" | "INSTITUTION" | "ALL";
type TradeType = "BUY" | "SELL";
type MarketType = "KOSPI" | "KOSDAQ" | "ALL";

interface NetBuyItem {
  rank: number;
  stockCode: string;
  stockName: string;
  netBuyAmount: number;
  netBuyVolume: number;
}

interface DateRecord {
  items: NetBuyItem[];
  loading: boolean;
  error: boolean;
}

type ColGroup =
  | { type: "date"; date: string; record: DateRecord }
  | { type: "weekly"; items: NetBuyItem[]; loading: boolean };

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDay(apiDate: string, delta: number): string {
  const d = new Date(
    parseInt(apiDate.slice(0, 4)),
    parseInt(apiDate.slice(4, 6)) - 1,
    parseInt(apiDate.slice(6, 8))
  );
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function dispDate(s: string) {
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

function apiToInput(s: string) {
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function calcWeekly(chunk: { record: DateRecord }[]): NetBuyItem[] {
  const map = new Map<string, { name: string; amt: number; vol: number }>();
  for (const { record } of chunk) {
    for (const item of record.items) {
      const e = map.get(item.stockCode);
      if (e) { e.amt += item.netBuyAmount; e.vol += item.netBuyVolume; }
      else map.set(item.stockCode, { name: item.stockName, amt: item.netBuyAmount, vol: item.netBuyVolume });
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1].amt - a[1].amt)
    .slice(0, 20)
    .map(([code, v], i) => ({
      rank: i + 1, stockCode: code, stockName: v.name,
      netBuyAmount: v.amt, netBuyVolume: v.vol,
    }));
}

function buildGroups(sorted: string[], dataMap: Map<string, DateRecord>): ColGroup[] {
  const groups: ColGroup[] = [];
  let chunk: { date: string; record: DateRecord }[] = [];
  for (const d of sorted) {
    const record = dataMap.get(d) ?? { items: [], loading: true, error: false };
    chunk.push({ date: d, record });
    groups.push({ type: "date", date: d, record });
    if (chunk.length === 5) {
      const allLoaded = chunk.every(c => !c.record.loading && !c.record.error);
      groups.push({
        type: "weekly",
        items: allLoaded ? calcWeekly(chunk) : [],
        loading: chunk.some(c => c.record.loading),
      });
      chunk = [];
    }
  }
  return groups;
}

const INVESTOR_OPTS: [InvestorType, string][] = [["FOREIGN", "외국인"], ["INSTITUTION", "기관"], ["ALL", "전체"]];
const TRADE_OPTS: [TradeType, string][] = [["BUY", "순매수"], ["SELL", "순매도"]];
const MARKET_OPTS: [MarketType, string][] = [["KOSPI", "코스피"], ["KOSDAQ", "코스닥"], ["ALL", "전체"]];

export function NetBuyingList() {
  const [investorType, setInvestorType] = useState<InvestorType>("FOREIGN");
  const [tradeType, setTradeType] = useState<TradeType>("BUY");
  const [market, setMarket] = useState<MarketType>("KOSPI");
  const [dates, setDates] = useState<string[]>(() => [todayStr()]);
  const [dataMap, setDataMap] = useState<Map<string, DateRecord>>(new Map());

  const datesKey = [...dates].sort().join(",");

  const fetchForDate = useCallback(async (date: string) => {
    setDataMap(prev => new Map([...prev, [date, { items: [], loading: true, error: false }]]));
    try {
      const res = await apiClient.get("/stock/foreign-trade", {
        params: { date, investorType, tradeType, market },
      });
      setDataMap(prev => new Map([...prev, [date, { items: res.data.data ?? [], loading: false, error: false }]]));
    } catch {
      setDataMap(prev => new Map([...prev, [date, { items: [], loading: false, error: true }]]));
    }
  }, [investorType, tradeType, market]);

  useEffect(() => {
    const sorted = datesKey ? datesKey.split(",") : [];
    setDataMap(new Map());
    for (const d of sorted) fetchForDate(d);
  }, [datesKey, fetchForDate]);

  function addDate() {
    const earliest = [...dates].sort()[0];
    const candidate = shiftDay(earliest, -1);
    setDates(prev => prev.includes(candidate) ? prev : [...prev, candidate]);
  }

  function removeDate(d: string) {
    if (dates.length <= 1) return;
    setDates(prev => prev.filter(x => x !== d));
  }

  function updateDate(old: string, next: string) {
    if (!next || dates.includes(next)) return;
    setDates(prev => prev.map(d => d === old ? next : d));
    setDataMap(prev => { const m = new Map(prev); m.delete(old); return m; });
  }

  const isMulti = dates.length > 1;
  const sortedDates = [...dates].sort();
  const groups = buildGroups(sortedDates, dataMap);

  const labelTrade = tradeType === "BUY" ? "순매수" : "순매도";
  const labelMarket = market === "KOSPI" ? "코스피" : market === "KOSDAQ" ? "코스닥" : "전체";
  const labelInvestor = investorType === "FOREIGN" ? "외국인" : investorType === "INSTITUTION" ? "기관" : "전체";

  const singleDate = dates[0];
  const singleRecord: DateRecord = dataMap.get(singleDate) ?? { items: [], loading: true, error: false };

  return (
    <div className="stack">
      {/* 필터 카드 */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">순매수도 순위</div>
          <span className="tag">KRX 기준</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 필터 칩 그룹 */}
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

          {/* 날짜 영역 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {isMulti ? (
              sortedDates.map(d => (
                <div
                  key={d}
                  style={{
                    display: "flex", alignItems: "center", gap: 2,
                    background: "var(--bg-alt)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)", padding: "2px 4px",
                  }}
                >
                  <input
                    type="date"
                    value={apiToInput(d)}
                    onChange={e => updateDate(d, e.target.value.replace(/-/g, ""))}
                    style={{ height: 26, fontSize: 12, padding: "0 4px", border: "none", background: "transparent", color: "var(--text)" }}
                  />
                  <button
                    onClick={() => removeDate(d)}
                    style={{
                      width: 18, height: 18, border: "none", background: "none",
                      cursor: "pointer", color: "var(--text-4)", fontSize: 13, padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="date-nav">
                <button className="date-nav-btn" onClick={() => setDates([shiftDay(singleDate, -1)])}>←</button>
                <input
                  type="date"
                  value={apiToInput(singleDate)}
                  onChange={e => { if (e.target.value) setDates([e.target.value.replace(/-/g, "")]); }}
                />
                <button className="date-nav-btn" onClick={() => setDates([shiftDay(singleDate, 1)])}>→</button>
                <button className="btn sm" onClick={() => setDates([todayStr()])}>오늘</button>
              </div>
            )}
            <button className="btn sm" onClick={addDate}>+ 날짜 추가</button>
          </div>
        </div>
      </div>

      {/* 테이블 카드 */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {!isMulti ? (
          /* ── 단일 날짜: 심플 테이블 ── */
          <>
            <div className="card-head" style={{ padding: "var(--pad-card)", paddingBottom: 16 }}>
              <div className="card-title">{labelMarket} {labelInvestor} {labelTrade} 상위 20</div>
              <span className="tag">{dispDate(singleDate)}</span>
            </div>
            {singleRecord.loading ? (
              <div style={{ padding: "0 var(--pad-card) var(--pad-card)", display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="sk" style={{ height: "var(--row-h)" }} />)}
              </div>
            ) : singleRecord.error ? (
              <div className="error-block">
                <div className="error-title">데이터를 불러올 수 없습니다</div>
                <div className="error-msg">백엔드 서버 연결을 확인하세요</div>
                <button className="btn sm" onClick={() => fetchForDate(singleDate)}>재시도</button>
              </div>
            ) : (
              <table className="t">
                <thead>
                  <tr>
                    <th style={{ width: 44, paddingLeft: "var(--pad-card)" }}>순위</th>
                    <th>종목명</th>
                    <th className="num">{labelTrade}대금(억)</th>
                    <th className="num" style={{ paddingRight: "var(--pad-card)" }}>{labelTrade}량(주)</th>
                  </tr>
                </thead>
                <tbody>
                  {singleRecord.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--text-4)", padding: 48 }}>
                        데이터가 없습니다
                      </td>
                    </tr>
                  ) : (
                    singleRecord.items.map(item => (
                      <tr key={item.stockCode} className="clickable">
                        <td className="rank" style={{ paddingLeft: "var(--pad-card)" }}>{item.rank}</td>
                        <td className="ticker">
                          {item.stockName}
                          <span style={{ marginLeft: 6, fontSize: 11, color: "var(--text-4)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>
                            {item.stockCode}
                          </span>
                        </td>
                        <td className="num">{fmtAmount(item.netBuyAmount)}</td>
                        <td className="num" style={{ paddingRight: "var(--pad-card)" }}>{fmtVolume(item.netBuyVolume)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </>
        ) : (
          /* ── 복수 날짜: 시계열 테이블 ── */
          <div style={{ overflowX: "auto" }}>
            <table className="t" style={{ minWidth: `${44 + groups.length * 256}px` }}>
              <thead>
                {/* Row 1: 날짜 / 주간합계 */}
                <tr>
                  <th
                    rowSpan={3}
                    style={{ width: 44, paddingLeft: 12, verticalAlign: "middle", borderBottom: "1px solid var(--border)" }}
                  >
                    순위
                  </th>
                  {groups.map((g, i) => (
                    <th
                      key={i}
                      colSpan={3}
                      style={{
                        textAlign: "center",
                        borderLeft: "2px solid var(--border-strong)",
                        background: g.type === "weekly" ? "var(--accent-soft)" : "var(--bg-alt)",
                        color: g.type === "weekly" ? "var(--text)" : "var(--text-3)",
                        fontWeight: g.type === "weekly" ? 700 : 500,
                        letterSpacing: g.type === "weekly" ? 0 : "0.02em",
                      }}
                    >
                      {g.type === "weekly" ? "주간합계" : dispDate(g.date)}
                    </th>
                  ))}
                </tr>
                {/* Row 2: 거래유형 반복 */}
                <tr>
                  {groups.map((g, i) => (
                    <th
                      key={i}
                      colSpan={3}
                      style={{
                        textAlign: "center",
                        fontSize: 11,
                        color: "var(--text-4)",
                        borderLeft: "2px solid var(--border-strong)",
                        background: g.type === "weekly" ? "var(--accent-soft)" : "var(--bg-alt)",
                      }}
                    >
                      {labelTrade}
                    </th>
                  ))}
                </tr>
                {/* Row 3: 컬럼명 */}
                <tr>
                  {groups.map((g, i) => (
                    <Fragment key={i}>
                      <th style={{ borderLeft: "2px solid var(--border-strong)", background: g.type === "weekly" ? "var(--accent-soft)" : "var(--bg-alt)", minWidth: 110 }}>
                        종목명
                      </th>
                      <th className="num" style={{ background: g.type === "weekly" ? "var(--accent-soft)" : "var(--bg-alt)", minWidth: 78 }}>
                        대금(억)
                      </th>
                      <th className="num" style={{ background: g.type === "weekly" ? "var(--accent-soft)" : "var(--bg-alt)", minWidth: 68 }}>
                        수량
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 20 }, (_, ri) => (
                  <tr key={ri} className="clickable">
                    <td className="rank" style={{ paddingLeft: 12 }}>{ri + 1}</td>
                    {groups.map((g, ci) => {
                      const isWeekly = g.type === "weekly";
                      const items = isWeekly ? g.items : g.record.items;
                      const isLoading = isWeekly ? g.loading : g.record.loading;
                      const bg = isWeekly ? "var(--accent-soft)" : undefined;
                      const borderLeft = "2px solid var(--border-strong)";
                      const item = items[ri];

                      if (isLoading) {
                        return (
                          <Fragment key={ci}>
                            <td style={{ borderLeft, background: bg }}><div className="sk short" style={{ margin: "0 4px" }} /></td>
                            <td className="num" style={{ background: bg }}><div className="sk short" style={{ margin: "0 4px" }} /></td>
                            <td className="num" style={{ background: bg }}><div className="sk short" style={{ margin: "0 4px" }} /></td>
                          </Fragment>
                        );
                      }

                      return (
                        <Fragment key={ci}>
                          <td
                            style={{
                              borderLeft, background: bg,
                              fontWeight: 600, color: "var(--text)",
                              fontSize: 12, maxWidth: 110,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}
                          >
                            {item?.stockName ?? <span style={{ color: "var(--text-4)", fontWeight: 400 }}>-</span>}
                          </td>
                          <td className="num" style={{ background: bg, fontSize: 12 }}>
                            {item ? fmtAmount(item.netBuyAmount) : <span style={{ color: "var(--text-4)" }}>-</span>}
                          </td>
                          <td className="num" style={{ background: bg, fontSize: 12 }}>
                            {item ? fmtVolume(item.netBuyVolume) : <span style={{ color: "var(--text-4)" }}>-</span>}
                          </td>
                        </Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
