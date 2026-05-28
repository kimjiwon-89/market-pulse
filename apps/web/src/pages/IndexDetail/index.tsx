import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiClient } from "@/services/apiClient";
import { dirCls, triangle, fmtPct } from "@/utils/format";

interface ChartPoint {
  date: string;
  value: number;
}

interface IndexDetail {
  code: string;
  name: string;
  value: number;
  change: number;
  pct: number;
  volume: number;
  amount: string;
  high52: number;
  low52: number;
  chartData: ChartPoint[];
}

type Period = "1M" | "3M" | "1Y";

function fmtDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function periodToDateParams(period: Period) {
  const today = new Date();
  const start = new Date(today);
  if (period === "1M") start.setMonth(start.getMonth() - 1);
  else if (period === "3M") start.setMonth(start.getMonth() - 3);
  else start.setFullYear(start.getFullYear() - 1);
  return { fid_input_date_1: fmtDate(start), fid_input_date_2: fmtDate(today) };
}

const SECTORS = [
  { code: "0001", name: "KOSPI" },
  { code: "1001", name: "KOSDAQ" },
  { code: "2001", name: "KOSPI200" },
  { code: "0028", name: "전기전자" },
  { code: "0016", name: "음식료품" },
  { code: "0006", name: "화학" },
  { code: "0009", name: "철강금속" },
  { code: "0015", name: "건설업" },
];

export function IndexDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("1M");
  const [detail, setDetail] = useState<IndexDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    const { fid_input_date_1, fid_input_date_2 } = periodToDateParams(period);
    apiClient
      .get("/index/inquire-daily-indexchartprice", {
        params: { indexCode: id, fid_input_date_1, fid_input_date_2 },
      })
      .then(r => {
        const resp = r.data.data;
        const o1 = resp?.output1;
        const raw2: any[] = resp?.output2 ?? [];
        const prices = raw2.map((d: any) => parseFloat(d.bstp_nmix_prpr ?? "0") || 0).filter(v => v > 0);
        setDetail({
          code: o1?.bstp_cls_code ?? "",
          name: o1?.hts_kor_isnm ?? "",
          value: parseFloat(o1?.bstp_nmix_prpr ?? "0") || 0,
          change: parseFloat(o1?.bstp_nmix_prdy_vrss ?? "0") || 0,
          pct: parseFloat(o1?.bstp_nmix_prdy_ctrt ?? "0") || 0,
          volume: parseInt(o1?.acml_vol ?? "0") || 0,
          amount: o1?.acml_tr_pbmn ?? "0",
          high52: prices.length ? Math.max(...prices) : parseFloat(o1?.bstp_nmix_hgpr ?? "0") || 0,
          low52: prices.length ? Math.min(...prices) : parseFloat(o1?.bstp_nmix_lwpr ?? "0") || 0,
          chartData: raw2.map((d: any) => ({
            date: d.stck_bsop_date ?? "",
            value: parseFloat(d.bstp_nmix_prpr ?? "0") || 0,
          })).reverse(),
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, period]);

  const color = detail ? `var(--${dirCls(detail.pct)})` : "var(--text-3)";

  return (
    <div className="stack">
      {/* 업종 선택 칩 — 모바일: 가로 스크롤 */}
      <div className="card" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {SECTORS.map(s => (
            <button
              key={s.code}
              className="chip flex-shrink-0"
              aria-pressed={id === s.code}
              onClick={() => navigate(`/index/${s.code}`)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="sk" style={{ width: "30%", height: 20 }} />
          <div className="sk" style={{ height: 180 }} />
        </div>
      ) : error || !detail ? (
        <div className="card">
          <div className="error-block">
            <div className="error-title">데이터를 불러올 수 없습니다</div>
            <div className="error-msg">잠시 후 다시 시도해 주세요</div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI — 모바일: 2×2, 데스크톱: 4열 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "지수", value: detail.value.toLocaleString(), cls: dirCls(detail.pct) },
              { label: "등락률", value: `${triangle(detail.pct)} ${fmtPct(detail.pct)}`, cls: dirCls(detail.pct) },
              { label: `${period} 최고`, value: detail.high52?.toLocaleString() ?? "—", cls: "flat" },
              { label: `${period} 최저`, value: detail.low52?.toLocaleString() ?? "—", cls: "flat" },
            ].map(kpi => (
              <div key={kpi.label} className="card stat-cell">
                <div className="stat-label">{kpi.label}</div>
                <div className={`stat-value ${kpi.cls}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* 차트 카드 */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">{detail.name} 차트</div>
              <div className="chips">
                {(["1M", "3M", "1Y"] as Period[]).map(p => (
                  <button key={p} className="chip" aria-pressed={period === p} onClick={() => setPeriod(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {detail.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={detail.chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--text-4)", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={v => `${v.slice(4, 6)}/${v.slice(6, 8)}`}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-4)", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    tickFormatter={v => v.toLocaleString()}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-panel)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                    }}
                    labelStyle={{ color: "var(--text-3)" }}
                    formatter={(v: number | undefined) => [(v ?? 0).toLocaleString(), detail.name]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.5}
                    fill="url(#areaGrad)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)", fontSize: 13 }}>
                차트 데이터가 없습니다
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
