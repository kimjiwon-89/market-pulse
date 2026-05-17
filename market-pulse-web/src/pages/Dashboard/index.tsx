import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { apiClient } from "@/services/apiClient";
import { dirCls, triangle, fmtPct, fmtAmount } from "@/utils/format";
import { LiveBadge } from "@/components/common/LiveBadge";

/* ── 타입 ── */
interface IndexInfo {
  code: string;
  name: string;
  value: number;
  change: number;
  pct: number;
  hist: number[];
}

interface SectorRow {
  code: string;
  name: string;
  price: number;
  pct: number;
  vol: string;
  hist: number[];
}

interface NewsItem {
  id: string | number;
  title: string;
  summary?: string;
  date: string;
  source?: string;
  time?: string;
}

interface TradeTopItem {
  rank: number;
  stockCode: string;
  stockName: string;
  netBuyAmount: number;
  netBuyVolume: number;
}


/* ── 스파크라인 ── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const pts = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={28}>
      <LineChart data={pts} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={1.5} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── 유틸 ── */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

type FlowInvestor = "FOREIGN" | "INSTITUTION";
type FlowTrade = "BUY" | "SELL";
type FlowMarket = "KOSPI" | "KOSDAQ" | "ALL";

/* ════════════════════════════════════════════
   Dashboard
════════════════════════════════════════════ */
export function Dashboard() {
  const navigate = useNavigate();

  /* ── 지수 ── */
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [indicesLoading, setIndicesLoading] = useState(true);

  /* ── 업종 ── */
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);

  /* ── 뉴스 ── */
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  /* ── FlowDirCard ── */
  const [flowInvestor, setFlowInvestor] = useState<FlowInvestor>("FOREIGN");
  const [flowTrade, setFlowTrade] = useState<FlowTrade>("BUY");
  const [flowMarket, setFlowMarket] = useState<FlowMarket>("KOSPI");
  const [flowItems, setFlowItems] = useState<TradeTopItem[]>([]);
  const [flowLoading, setFlowLoading] = useState(true);

  /* ── 투자자 동향 ── */
  interface MarketFlowItem { name: string; net: number; buy: number; sell: number; }
  const [marketFlow, setMarketFlow] = useState<MarketFlowItem[]>([]);
  const [marketFlowLoading, setMarketFlowLoading] = useState(true);


  /* ── 데이터 페칭 ── */
  useEffect(() => {
    // 지수: KOSPI, KOSDAQ, KOSPI200
    Promise.all(
      ["0001", "1001", "2001"].map(code =>
        apiClient.get("/index/inquire-daily-indexchartprice", { params: { indexCode: code } })
      )
    ).then(results => {
      setIndices(results.map(r => {
        const resp = r.data.data;
        const o1 = resp?.output1;
        return {
          code: o1?.bstp_cls_code ?? "",
          name: o1?.hts_kor_isnm ?? "",
          value: parseFloat(o1?.bstp_nmix_prpr ?? "0") || 0,
          change: parseFloat(o1?.bstp_nmix_prdy_vrss ?? "0") || 0,
          pct: parseFloat(o1?.bstp_nmix_prdy_ctrt ?? "0") || 0,
          hist: (resp?.output2 ?? []).map((d: any) => parseFloat(d.bstp_nmix_prpr ?? "0") || 0).reverse(),
        };
      }));
    }).catch(() => {
      setIndices([]);
    }).finally(() => setIndicesLoading(false));

    // 업종 상위 6개 (등락률 기준)
    apiClient.get("/index/top-sectors")
      .then(r => {
        const raw = Array.isArray(r.data.data) ? r.data.data : [];
        setSectors(raw.map((s: any) => ({
          code: s.code,
          name: s.name,
          price: parseFloat(s.price) || 0,
          pct: parseFloat(s.changeRate) || 0,
          vol: s.volume,
          hist: Array.isArray(s.history) ? s.history : [],
        })));
      })
      .catch(() => setSectors([]))
      .finally(() => setSectorsLoading(false));

    // 뉴스
    apiClient.get("/news/inquire-daily-news", { params: { limit: 15 } })
      .then(r => {
        const raw: any[] = Array.isArray(r.data.data) ? r.data.data : [];
        setNews(raw.map(n => ({
          id: n.cntt_usiq_srno ?? Math.random(),
          title: n.hts_pbnt_titl_cntt ?? "",
          date: n.data_dt ? `${n.data_dt.slice(0, 4)}-${n.data_dt.slice(4, 6)}-${n.data_dt.slice(6, 8)}` : "",
          source: n.dorg ?? "",
          time: n.data_tm ? `${n.data_tm.slice(0, 2)}:${n.data_tm.slice(2, 4)}` : "",
        })));
      })
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));



    // 투자자 동향 (외국인/기관/개인 순매수 합계)
    apiClient.get("/investor/market-flow", { params: { market: "KOSPI" } })
      .then(r => setMarketFlow(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setMarketFlow([]))
      .finally(() => setMarketFlowLoading(false));
  }, []);

  // FlowDirCard: 필터 변경마다 재조회
  useEffect(() => {
    setFlowLoading(true);
    apiClient.get("/investor/trade-top", {
      params: {
        market: flowMarket === "ALL" ? undefined : flowMarket,
        investorType: flowInvestor,
        tradeType: flowTrade,
        date: todayStr(),
      },
    })
      .then(r => setFlowItems(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setFlowItems([]))
      .finally(() => setFlowLoading(false));
  }, [flowInvestor, flowTrade, flowMarket]);

  /* ── 렌더 ── */
  const INDEX_CODES = [
    { code: "0001", name: "KOSPI" },
    { code: "1001", name: "KOSDAQ" },
    { code: "2001", name: "KOSPI200" },
  ];

  return (
    <div className="stack">
      {/* ── 1행: 지수+업종 (왼쪽) + 뉴스 (오른쪽/모바일 하단) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* 왼쪽: 지수 카드 + 업종 테이블 */}
        <div className="stack">
          {/* 지수 카드 */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">시장 지수</div>
              <LiveBadge />
            </div>
            {indicesLoading ? (
              <div className="grid-3">
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="sk short" />
                    <div className="sk" style={{ height: 28 }} />
                    <div className="sk short" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid-3">
                {(indices.length > 0 ? indices : INDEX_CODES.map(c => ({
                  code: c.code, name: c.name, value: 0, change: 0, pct: 0, hist: []
                }))).map((idx, i) => (
                  <div key={idx.code ?? i} className="stat-cell" style={{ cursor: "pointer" }} onClick={() => navigate(`/index/${idx.code}`)}>
                    <div className="stat-label">{idx.name ?? INDEX_CODES[i]?.name}</div>
                    <div className={`stat-value ${dirCls(idx.pct)}`}>
                      {idx.value ? idx.value.toLocaleString() : "—"}
                    </div>
                    <div className={`stat-delta ${dirCls(idx.pct)}`}>
                      {idx.pct !== 0 && `${triangle(idx.pct)} ${fmtPct(idx.pct)}`}
                    </div>
                    {idx.hist?.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <Sparkline data={idx.hist} color={`var(--${dirCls(idx.pct)})`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 업종 테이블 카드 */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="card-head" style={{ padding: "var(--pad-card)", paddingBottom: 16 }}>
              <div className="card-title">업종 현황</div>
              <button className="btn ghost sm" onClick={() => navigate("/index/0001")}>전체 보기</button>
            </div>
            {sectorsLoading ? (
              <div style={{ padding: "0 var(--pad-card) var(--pad-card)", display: "flex", flexDirection: "column", gap: 8 }}>
                {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="sk" style={{ height: "var(--row-h)" }} />)}
              </div>
            ) : sectors.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-4)", fontSize: 13 }}>
                업종 데이터를 불러올 수 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="t" style={{ minWidth: 480 }}>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: "var(--pad-card)" }}>업종명</th>
                      <th className="num">현재가</th>
                      <th className="num">등락률</th>
                      <th className="num">거래대금</th>
                      <th className="num" style={{ paddingRight: "var(--pad-card)", width: 80 }}>5일추이</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectors.map(s => (
                      <tr key={s.code} className="clickable" onClick={() => navigate(`/index/${s.code}`)}>
                        <td className="ticker" style={{ paddingLeft: "var(--pad-card)" }}>{s.name}</td>
                        <td className="num mono">{s.price.toLocaleString()}</td>
                        <td className={`num pct ${dirCls(s.pct)}`}>{triangle(s.pct)} {fmtPct(s.pct)}</td>
                        <td className="num">{s.vol}</td>
                        <td style={{ paddingRight: "var(--pad-card)" }}>
                          {s.hist?.length > 0 && <Sparkline data={s.hist} color={`var(--${dirCls(s.pct)})`} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 뉴스 카드 — 데스크톱: 왼쪽 컬럼 높이 채우기, 모바일: 일반 카드 */}
        <div className="lg:relative lg:min-h-0">
          <div className="card flex flex-col lg:absolute lg:inset-0">
            <div className="card-head">
              <div className="card-title">최신 뉴스</div>
              <button className="btn ghost sm" onClick={() => navigate("/news")}>더 보기</button>
            </div>
            {newsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="sk" />
                    <div className="sk short" />
                  </div>
                ))}
              </div>
            ) : news.length === 0 ? (
              <div style={{ color: "var(--text-4)", fontSize: 13, padding: "16px 0" }}>
                뉴스를 불러올 수 없습니다
              </div>
            ) : (
              <div className="news-list flex-1 min-h-0 overflow-y-auto max-h-64 lg:max-h-none">
                {news.map(item => (
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
      </div>

      {/* ── 2행: FlowDirCard + 투자자 동향 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* 왼쪽: FlowDirCard */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">순매수도 동향</div>
            <button className="btn ghost sm" onClick={() => navigate("/investor")}>상세 보기</button>
          </div>

          {/* 필터 탭 — 모바일에서 가로 스크롤 */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: "none" }}>
            <div className="seg-tabs flex-shrink-0" role="tablist">
              {(["FOREIGN", "INSTITUTION"] as FlowInvestor[]).map(v => (
                <button key={v} role="tab" aria-selected={flowInvestor === v} onClick={() => setFlowInvestor(v)}>
                  {v === "FOREIGN" ? "외국인" : "기관"}
                </button>
              ))}
            </div>
            <div className="seg-tabs flex-shrink-0" role="tablist">
              {(["BUY", "SELL"] as FlowTrade[]).map(v => (
                <button key={v} role="tab" aria-selected={flowTrade === v} onClick={() => setFlowTrade(v)}>
                  {v === "BUY" ? "순매수" : "순매도"}
                </button>
              ))}
            </div>
            <div className="seg-tabs flex-shrink-0" role="tablist">
              {(["KOSPI", "KOSDAQ", "ALL"] as FlowMarket[]).map(v => (
                <button key={v} role="tab" aria-selected={flowMarket === v} onClick={() => setFlowMarket(v)}>
                  {v === "ALL" ? "전체" : v}
                </button>
              ))}
            </div>
          </div>

          {/* 상위 5위 */}
          {flowLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[0, 1, 2, 3, 4].map(i => <div key={i} className="sk" style={{ height: "var(--row-h)" }} />)}
            </div>
          ) : (
            <table className="t">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>순위</th>
                  <th>종목명</th>
                  <th className="num">순매수대금</th>
                  <th className="num">순매수량</th>
                </tr>
              </thead>
              <tbody>
                {flowItems.slice(0, 5).map(item => (
                  <tr key={item.stockCode} className="clickable" onClick={() => navigate("/investor")}>
                    <td className="rank">{item.rank}</td>
                    <td className="ticker">{item.stockName}</td>
                    <td className="num">{fmtAmount(item.netBuyAmount)}</td>
                    <td className="num" style={{ color: "var(--text-3)", fontSize: 12 }}>
                      {item.netBuyVolume.toLocaleString()}주
                    </td>
                  </tr>
                ))}
                {flowItems.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-4)", padding: 24 }}>
                      데이터가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 오른쪽: 투자자 동향 */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">투자자 동향</div>
            <span className="tag">코스피</span>
          </div>

          {marketFlowLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="sk short" style={{ width: 40 }} />
                  <div className="sk" style={{ flex: 1, height: 8 }} />
                  <div className="sk short" style={{ width: 56 }} />
                </div>
              ))}
            </div>
          ) : marketFlow.length === 0 ? (
            <div style={{ color: "var(--text-4)", fontSize: 13, padding: "16px 0" }}>
              투자자 데이터를 불러올 수 없습니다
            </div>
          ) : (() => {
            const maxAmt = Math.max(...marketFlow.map(inv => Math.max(Math.abs(inv.buy), Math.abs(inv.sell)))) || 1;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {marketFlow.map(inv => (
                  <div key={inv.name} className="bi-bar">
                    <span style={{ width: 40, fontSize: 12, color: "var(--text-2)", flexShrink: 0 }}>{inv.name}</span>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 4 }}>
                      <div className="bar-track">
                        <div className="bar-fill-up" style={{ width: `${(Math.abs(inv.buy) / maxAmt) * 50}%` }} />
                        <div className="bar-fill-down" style={{ width: `${(Math.abs(inv.sell) / maxAmt) * 50}%` }} />
                      </div>
                    </div>
                    <span className={`mono ${dirCls(inv.net)}`} style={{ width: 64, textAlign: "right", fontSize: 12, flexShrink: 0 }}>
                      {fmtAmount(inv.net)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
