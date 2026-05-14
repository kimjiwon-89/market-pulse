import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/apiClient";
import type { TradeTopItem, InvestorMemo } from "@/types";
import { dirCls, triangle, fmtPct, fmtAmount, fmtVolume } from "@/utils/format";

type Market = "KOSPI" | "KOSDAQ";
type InvestorType = "FOREIGN" | "INSTITUTION";
type TradeType = "BUY" | "SELL";

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

function apiToInput(s: string): string {
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function inputToApi(s: string): string {
  return s.replace(/-/g, "");
}

export function InvestorTrend() {
  const [market, setMarket] = useState<Market>("KOSPI");
  const [investorType, setInvestorType] = useState<InvestorType>("FOREIGN");
  const [tradeType, setTradeType] = useState<TradeType>("BUY");
  const [date, setDate] = useState(todayStr);

  const [items, setItems] = useState<TradeTopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [memo, setMemo] = useState<InvestorMemo | null>(null);
  const [memoContent, setMemoContent] = useState("");
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoSaving, setMemoSaving] = useState(false);

  const fetchTradeTop = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/investor/trade-top", {
        params: { market, investorType, tradeType, date },
      });
      setItems(res.data.data ?? []);
    } catch {
      setError("데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [market, investorType, tradeType, date]);

  const fetchMemo = useCallback(async () => {
    setMemoLoading(true);
    try {
      const res = await apiClient.get("/investor/memo", {
        params: { date, market },
      });
      const m: InvestorMemo | null = res.data.data ?? null;
      setMemo(m);
      setMemoContent(m?.content ?? "");
    } catch {
      setMemo(null);
      setMemoContent("");
    } finally {
      setMemoLoading(false);
    }
  }, [date, market]);

  useEffect(() => { fetchTradeTop(); }, [fetchTradeTop]);
  useEffect(() => { fetchMemo(); }, [fetchMemo]);

  async function saveMemo() {
    if (!memoContent.trim()) return;
    setMemoSaving(true);
    try {
      const res = await apiClient.post("/investor/memo", {
        date,
        market,
        content: memoContent,
      });
      setMemo(res.data.data);
    } finally {
      setMemoSaving(false);
    }
  }

  async function deleteMemo() {
    if (!memo) return;
    try {
      await apiClient.delete(`/investor/memo/${memo.id}`);
      setMemo(null);
      setMemoContent("");
    } catch {
      /* silent */
    }
  }

  const labelMarket = market === "KOSPI" ? "코스피" : "코스닥";
  const labelInvestor = investorType === "FOREIGN" ? "외국인" : "기관";
  const labelTrade = tradeType === "BUY" ? "순매수" : "순매도";
  const displayDate = `${date.slice(0, 4)}.${date.slice(4, 6)}.${date.slice(6, 8)}`;

  return (
    <div className="stack">
      {/* 필터 카드 */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">투자자 매매동향</div>
          <span className="tag">KRX 기준</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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

          <div className="seg-tabs" role="tablist">
            {(
              [
                ["FOREIGN", "외국인"],
                ["INSTITUTION", "기관"],
              ] as [InvestorType, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                role="tab"
                aria-selected={investorType === v}
                onClick={() => setInvestorType(v)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="seg-tabs" role="tablist">
            {(
              [
                ["BUY", "순매수"],
                ["SELL", "순매도"],
              ] as [TradeType, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                role="tab"
                aria-selected={tradeType === v}
                onClick={() => setTradeType(v)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="date-nav">
            <button
              className="date-nav-btn"
              onClick={() => setDate((d) => shiftDay(d, -1))}
              title="하루 전"
            >
              ←
            </button>
            <input
              type="date"
              value={apiToInput(date)}
              onChange={(e) => {
                if (e.target.value) setDate(inputToApi(e.target.value));
              }}
            />
            <button
              className="date-nav-btn"
              onClick={() => setDate((d) => shiftDay(d, 1))}
              title="하루 후"
            >
              →
            </button>
            <button className="btn sm" onClick={() => setDate(todayStr())}>
              오늘
            </button>
          </div>
        </div>
      </div>

      {/* 순위 테이블 카드 */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          className="card-head"
          style={{ padding: "var(--pad-card)", paddingBottom: 16 }}
        >
          <div className="card-title">
            {labelMarket} {labelInvestor} {labelTrade} 상위 20
          </div>
          <span className="tag">{displayDate}</span>
        </div>

        {loading ? (
          <div
            style={{
              padding: "0 var(--pad-card) var(--pad-card)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="sk" style={{ height: "var(--row-h)" }} />
            ))}
          </div>
        ) : error ? (
          <div className="error-block">
            <div className="error-title">{error}</div>
            <div className="error-msg">
              백엔드 서버 연결을 확인하거나 잠시 후 다시 시도하세요
            </div>
            <button className="btn sm" onClick={fetchTradeTop}>
              재시도
            </button>
          </div>
        ) : (
          <table className="t">
            <thead>
              <tr>
                <th style={{ width: 44, paddingLeft: "var(--pad-card)" }}>순위</th>
                <th>종목명</th>
                <th className="num">현재가</th>
                <th className="num">등락률</th>
                <th className="num">순매수대금</th>
                <th className="num" style={{ paddingRight: "var(--pad-card)" }}>
                  순매수량
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      color: "var(--text-4)",
                      padding: 48,
                    }}
                  >
                    데이터가 없습니다
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.stockCode} className="clickable">
                    <td
                      className="rank"
                      style={{ paddingLeft: "var(--pad-card)" }}
                    >
                      {item.rank}
                    </td>
                    <td className="ticker">
                      {item.stockName}
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: "var(--text-4)",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 400,
                        }}
                      >
                        {item.stockCode}
                      </span>
                    </td>
                    <td className="num mono">
                      {item.currentPrice.toLocaleString()}
                    </td>
                    <td className={`num pct ${dirCls(item.changeRate)}`}>
                      {triangle(item.changeRate)} {fmtPct(item.changeRate)}
                    </td>
                    <td className="num">{fmtAmount(item.netBuyAmount)}</td>
                    <td
                      className="num"
                      style={{ paddingRight: "var(--pad-card)" }}
                    >
                      {fmtVolume(item.netBuyVolume)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 메모 카드 */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">메모</div>
            <div className="card-sub">
              {labelMarket} · {displayDate}
              {memo && (
                <span
                  style={{
                    marginLeft: 8,
                    color: "var(--text-4)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                  }}
                >
                  저장됨
                </span>
              )}
            </div>
          </div>
          {memo && (
            <button className="btn sm danger" onClick={deleteMemo}>
              삭제
            </button>
          )}
        </div>
        <textarea
          value={memoContent}
          onChange={(e) => setMemoContent(e.target.value)}
          placeholder={
            memoLoading
              ? "불러오는 중..."
              : "이 날의 투자 동향을 기록하세요..."
          }
          disabled={memoLoading}
          style={{ width: "100%", minHeight: 120 }}
        />
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="btn primary"
            onClick={saveMemo}
            disabled={memoSaving || !memoContent.trim()}
          >
            {memoSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
