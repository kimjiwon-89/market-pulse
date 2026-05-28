import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatWon, mockInvestorFlows, mockNews, mockStocks } from "@/features/mock/marketMockData";
import { quantDecisions } from "@/features/quant/quantMockData";

export function StockDetail() {
  const { code } = useParams();
  const stock = mockStocks.find((item) => item.code === code) ?? mockStocks[0];
  const decision = quantDecisions.find((item) => item.assetCode === stock.code);
  const chart = [92, 94, 93, 97, 99, 96, 101].map((value, index) => ({ day: `${index + 1}`, value: value * (stock.price / 100) }));

  return (
    <div className="stack max-w-[1100px] mx-auto">
      <div className="card">
        <Link className="card-link" to="/market">← 시장 보기</Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between" style={{ marginTop: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{stock.name}</h1>
            <p className="card-sub mono" style={{ marginTop: 6 }}>{stock.code} · {stock.market} · {stock.sector}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className={stock.changeRate >= 0 ? "num-lg up" : "num-lg down"}>{formatWon(stock.price)}</div>
            <div className={stock.changeRate >= 0 ? "stat-delta up" : "stat-delta down"}>{stock.change.toLocaleString("ko-KR")} ({stock.changeRate}%)</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="stack">
          <div className="card">
            <div className="card-title">가격 흐름</div>
            <div style={{ height: 280, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <XAxis dataKey="day" />
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Tooltip formatter={(value) => formatWon(Number(value))} />
                  <Line dataKey="value" stroke={stock.changeRate >= 0 ? "var(--up)" : "var(--down)"} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-title">수급 흐름</div>
            <div style={{ height: 220, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockInvestorFlows.map((flow) => ({ name: flow.investor, value: flow.netBuyAmount / 100000000 }))}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--down)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="card-title">퀀트 모델 판단</div>
            {decision ? (
              <>
                <div className="tag" style={{ marginTop: 14 }}>{decision.decisionLabel}</div>
                <p style={{ color: "var(--text-2)", lineHeight: 1.7 }}>{decision.reasonBullets.join(", ")}</p>
                <p className="card-sub">조심할 점: {decision.cautionBullets.join(", ")}</p>
              </>
            ) : (
              <p className="card-sub" style={{ marginTop: 14 }}>오늘 표시된 모델 판단이 없습니다.</p>
            )}
          </div>
          <div className="card">
            <div className="card-title">기본 정보</div>
            <div className="stack" style={{ marginTop: 14, gap: 8 }}>
              <div>시가총액 <strong>{stock.marketCap}</strong></div>
              <div>업종 <strong>{stock.sector}</strong></div>
              <div>시장 <strong>{stock.market}</strong></div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">관련 뉴스</div>
            <div className="news-list" style={{ marginTop: 8 }}>
              {mockNews.slice(0, 2).map((news) => <div key={news.id} className="news-item"><div className="news-title">{news.title}</div></div>)}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
