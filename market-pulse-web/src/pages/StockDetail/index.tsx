import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import type {
  StockChartItem,
  StockDetail as StockDetailType,
  StockDisclosure,
  StockInvestor,
  StockMinuteCandle,
  StockOrderbook,
  StockReport,
} from "@/types";
import { dirCls, triangle, fmtNum, fmtPct, fmtAmount } from "@/utils/format";
import { useIsMobile } from "@/hooks";
import { DisclosurePanel } from "./components/DisclosurePanel";
import { OrderbookPanel } from "./components/OrderbookPanel";
import { ReportPanel } from "./components/ReportPanel";
import { StockCandleChart, type ChartPeriod } from "./components/StockCandleChart";
import { StockTerminalTabs, type StockTerminalTab } from "./components/StockTerminalTabs";

function chartPeriodToDailyPeriod(period: ChartPeriod): "1M" | "3M" | "1Y" {
  return period === "1D" ? "3M" : period;
}

export function StockDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<StockTerminalTab>("chart");
  const [period, setPeriod] = useState<ChartPeriod>("3M");
  const [detail, setDetail] = useState<StockDetailType | null>(null);
  const [chart, setChart] = useState<StockChartItem[]>([]);
  const [minuteChart, setMinuteChart] = useState<StockMinuteCandle[]>([]);
  const [investor, setInvestor] = useState<StockInvestor | null>(null);
  const [orderbook, setOrderbook] = useState<StockOrderbook | null>(null);
  const [disclosures, setDisclosures] = useState<StockDisclosure[]>([]);
  const [reports, setReports] = useState<StockReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [orderbookLoading, setOrderbookLoading] = useState(false);
  const [disclosureLoading, setDisclosureLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
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

  const loadChart = useCallback((p: ChartPeriod) => {
    if (!code) return;
    setChartLoading(true);
    const request = p === "1D"
      ? apiClient.get(`/stock/minute-chart`, { params: { code, includePast: true } })
      : apiClient.get(`/stock/chart`, { params: { code, period: chartPeriodToDailyPeriod(p) } });

    request
      .then(r => {
        const items = r.data.data ?? [];
        if (p === "1D") {
          setMinuteChart(items);
        } else {
          setChart([...items].reverse());
        }
      })
      .catch(() => {
        if (p === "1D") setMinuteChart([]);
      })
      .finally(() => setChartLoading(false));
  }, [code]);

  useEffect(() => { loadChart(period); }, [loadChart, period]);

  useEffect(() => {
    if (!code || activeTab !== "chart") return;
    setOrderbookLoading(true);
    apiClient.get(`/stock/orderbook`, { params: { code } })
      .then(r => setOrderbook(r.data.data))
      .catch(() => setOrderbook(null))
      .finally(() => setOrderbookLoading(false));
  }, [activeTab, code]);

  useEffect(() => {
    if (!code || activeTab !== "disclosure") return;
    setDisclosureLoading(true);
    setReportLoading(true);
    apiClient.get(`/stock/disclosures`, { params: { code } })
      .then(r => setDisclosures(r.data.data ?? []))
      .catch(() => setDisclosures([]))
      .finally(() => setDisclosureLoading(false));
    apiClient.get(`/stock/reports`, { params: { code } })
      .then(r => setReports(r.data.data ?? []))
      .catch(() => setReports([]))
      .finally(() => setReportLoading(false));
  }, [activeTab, code]);

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
        <button className="btn" onClick={() => navigate(-1)}>뒤로</button>
      </div>
    );
  }

  const dir = dirCls(detail.changeRate);

  return (
    <div className="stack" style={{ padding: "var(--pad-pg)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <button className="btn ghost" style={{ fontSize: 13 }} onClick={() => navigate(-1)}>
          뒤로
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{detail.name}</h1>
        <span style={{ fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          {detail.code}
        </span>
      </div>

      <div className="card">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-cell">
            <div className="stat-label">현재가</div>
            <div className={`stat-value ${dir}`}>{fmtNum(detail.currentPrice)}</div>
            <div className={`stat-delta ${dir}`}>
              {triangle(detail.changeRate)} {fmtNum(Math.abs(detail.prdyVrss))} ({fmtPct(detail.changeRate)})
            </div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">거래량</div>
            <div className="stat-value">{fmtNum(detail.volume, { compact: true })}</div>
            <div className="stat-delta" style={{ color: "var(--text-3)" }}>{fmtAmount(detail.tradingValue)} 거래대금</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">시가총액</div>
            <div className="stat-value">{fmtNum(detail.marketCap * 1e8, { compact: true })}</div>
            <div className="stat-delta" style={{ color: "var(--text-3)" }}>{detail.marketCap.toLocaleString()}억</div>
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

      <StockTerminalTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "chart" && (
        <>
          <StockCandleChart
            detail={detail}
            period={period}
            chart={chart}
            minuteChart={minuteChart}
            loading={chartLoading}
            isMobile={isMobile}
            onPeriodChange={setPeriod}
          />
          <OrderbookPanel orderbook={orderbook} loading={orderbookLoading} />
        </>
      )}

      {activeTab === "info" && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">시세 정보</div>
          </div>
          <table className="t">
            <tbody>
              <tr><td style={{ color: "var(--text-3)" }}>시가</td><td className="num">{fmtNum(detail.openPrice)}</td></tr>
              <tr><td style={{ color: "var(--text-3)" }}>고가</td><td className="num up">{fmtNum(detail.highPrice)}</td></tr>
              <tr><td style={{ color: "var(--text-3)" }}>저가</td><td className="num down">{fmtNum(detail.lowPrice)}</td></tr>
              <tr><td style={{ color: "var(--text-3)" }}>52주 최고</td><td className="num">{fmtNum(detail.weekHigh)}</td></tr>
              <tr><td style={{ color: "var(--text-3)" }}>52주 최저</td><td className="num">{fmtNum(detail.weekLow)}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "disclosure" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DisclosurePanel disclosures={disclosures} loading={disclosureLoading} />
          <ReportPanel reports={reports} loading={reportLoading} />
        </div>
      )}

      {activeTab === "trading" && (
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
                  { label: "기관", net: investor.institutionNet, buy: investor.institutionBuy, sell: investor.institutionSell },
                  { label: "개인", net: investor.individualNet, buy: investor.individualBuy, sell: investor.individualSell },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="ticker">{row.label}</td>
                    <td className={`num ${dirCls(row.net)}`}>{fmtAmount(row.net)}</td>
                    <td className="num" style={{ color: "var(--text-3)" }}>{fmtAmount(row.buy)}</td>
                    <td className="num" style={{ color: "var(--text-3)" }}>{fmtAmount(row.sell)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "var(--text-3)", fontSize: 13 }}>투자자 데이터 없음</p>
          )}
        </div>
      )}
    </div>
  );
}
