import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { apiClient } from "@/services/apiClient";
import type { StockDetail, StockChartItem, StockInvestor } from "@/types";
import { dirCls, triangle, fmtNum, fmtPct, fmtAmount } from "@/utils/format";

type Period = "1M" | "3M" | "1Y";

function fmtDate8(s: string): string {
  if (s.length !== 8) return s;
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6)}`;
}

function chartColor(detail: StockDetail | null): string {
  if (!detail) return "var(--flat)";
  return detail.changeRate > 0 ? "var(--up)" : detail.changeRate < 0 ? "var(--down)" : "var(--flat)";
}

export function StockDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<Period>("3M");
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [chart, setChart] = useState<StockChartItem[]>([]);
  const [investor, setInvestor] = useState<StockInvestor | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(null);

    Promise.all([
      apiClient.get(`/stock/detail`, { params: { code } }),
      apiClient.get(`/stock/investor`, { params: { code } }),
    ])
      .then(([detailRes, investorRes]) => {
        setDetail(detailRes.data.data);
        setInvestor(investorRes.data.data);
      })
      .catch(() => setError("데이터를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [code]);

  const loadChart = useCallback((p: Period) => {
    if (!code) return;
    setChartLoading(true);
    apiClient
      .get(`/stock/chart`, { params: { code, period: p } })
      .then(r => {
        const items: StockChartItem[] = r.data.data ?? [];
        setChart([...items].reverse());
      })
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [code]);

  useEffect(() => { loadChart(period); }, [loadChart, period]);

  if (loading) {
    return (
      <div className="stack" style={{ padding: "var(--pad-pg)" }}>
        <div className="sk" style={{ width: 200, height: 28 }} />
        <div className="sk tall" />
        <div className="sk tall" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="stack" style={{ padding: "var(--pad-pg)", alignItems: "center", paddingTop: 80 }}>
        <p style={{ color: "var(--text-3)" }}>{error ?? "종목을 찾을 수 없습니다."}</p>
        <button className="btn" onClick={() => navigate(-1)}>← 돌아가기</button>
      </div>
    );
  }

  const dir = dirCls(detail.changeRate);
  const color = chartColor(detail);

  return (
    <div className="stack" style={{ padding: "var(--pad-pg)" }}>

      {/* 종목 헤더 */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <button
          className="btn ghost"
          style={{ fontSize: 13 }}
          onClick={() => navigate(-1)}
        >
          ← 뒤로
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{detail.name}</h1>
        <span style={{ fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          {detail.code}
        </span>
      </div>

      {/* KPI stat-grid */}
      <div className="card">
        <div className="stat-grid">
          <div className="stat-cell">
            <div className="stat-label">현재가</div>
            <div className={`stat-value ${dir}`}>
              {fmtNum(detail.currentPrice)}
            </div>
            <div className={`stat-delta ${dir}`}>
              {triangle(detail.changeRate)}&nbsp;
              {fmtNum(Math.abs(detail.prdyVrss))} ({fmtPct(detail.changeRate)})
            </div>
          </div>

          <div className="stat-cell">
            <div className="stat-label">거래량</div>
            <div className="stat-value">
              {fmtNum(detail.volume, { compact: true })}
            </div>
            <div className="stat-delta" style={{ color: "var(--text-3)" }}>
              {fmtAmount(detail.tradingValue)} 거래대금
            </div>
          </div>

          <div className="stat-cell">
            <div className="stat-label">시가총액</div>
            <div className="stat-value">
              {fmtNum(detail.marketCap * 1e8, { compact: true })}
            </div>
            <div className="stat-delta" style={{ color: "var(--text-3)" }}>
              {detail.marketCap.toLocaleString()}억
            </div>
          </div>

          <div className="stat-cell">
            <div className="stat-label">PER / PBR</div>
            <div className="stat-value" style={{ fontSize: "var(--num-md)" }}>
              {detail.per > 0 ? detail.per.toFixed(2) : "N/A"}
            </div>
            <div className="stat-delta" style={{ color: "var(--text-3)" }}>
              PBR {detail.pbr > 0 ? detail.pbr.toFixed(2) : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* 차트 카드 */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">주가 차트</div>
          <div className="chips">
            {(["1M", "3M", "1Y"] as Period[]).map(p => (
              <button
                key={p}
                className="chip"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {chartLoading ? (
          <div className="sk tall" style={{ height: 220 }} />
        ) : chart.length === 0 ? (
          <p style={{ color: "var(--text-3)", textAlign: "center", padding: "40px 0" }}>
            차트 데이터 없음
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={d => `${d.slice(4, 6)}/${d.slice(6)}`}
                tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "var(--text-3)", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
                width={60}
                tickFormatter={v => fmtNum(v, { compact: true })}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12,
                }}
                formatter={(val: number) => [fmtNum(val), "종가"]}
                labelFormatter={label => fmtDate8(label)}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={1.5}
                fill="url(#stockGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 하단 2열 */}
      <div className="grid-2">

        {/* 시세 정보 */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">시세 정보</div>
          </div>
          <table className="t">
            <tbody>
              <tr>
                <td style={{ color: "var(--text-3)" }}>시가</td>
                <td className="num">{fmtNum(detail.openPrice)}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-3)" }}>고가</td>
                <td className={`num up`}>{fmtNum(detail.highPrice)}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-3)" }}>저가</td>
                <td className={`num down`}>{fmtNum(detail.lowPrice)}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-3)" }}>52주 최고</td>
                <td className="num">{fmtNum(detail.weekHigh)}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-3)" }}>52주 최저</td>
                <td className="num">{fmtNum(detail.weekLow)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 투자자 동향 */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">투자자 동향</div>
            <span className="tag" style={{ fontSize: 11 }}>순매수 기준</span>
          </div>
          {investor ? (
            <table className="t">
              <thead>
                <tr>
                  <th>구분</th>
                  <th className="num">순매수대금</th>
                  <th className="num">매수</th>
                  <th className="num">매도</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "외국인", net: investor.foreignNet, buy: investor.foreignBuy, sell: investor.foreignSell },
                  { label: "기관",   net: investor.institutionNet, buy: investor.institutionBuy, sell: investor.institutionSell },
                  { label: "개인",   net: investor.individualNet, buy: investor.individualBuy, sell: investor.individualSell },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="ticker">{row.label}</td>
                    <td className={`num ${dirCls(row.net)}`}>
                      {fmtAmount(row.net)}
                    </td>
                    <td className="num" style={{ color: "var(--text-3)" }}>
                      {fmtAmount(row.buy)}
                    </td>
                    <td className="num" style={{ color: "var(--text-3)" }}>
                      {fmtAmount(row.sell)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "var(--text-3)", fontSize: 13 }}>투자자 데이터 없음</p>
          )}
        </div>

      </div>
    </div>
  );
}
