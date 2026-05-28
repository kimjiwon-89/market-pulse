import { useNavigate } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { formatAmount, formatWon, mockIndices, mockInvestorFlows, mockNews, mockStocks } from "@/features/mock/marketMockData";

function MiniLine({ data, positive }: { data: number[]; positive: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={34}>
      <LineChart data={data.map((value, index) => ({ value, index }))}>
        <Line type="monotone" dataKey="value" dot={false} stroke={positive ? "var(--up)" : "var(--down)"} strokeWidth={1.5} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="stack max-w-[1200px] mx-auto">
      <section className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>시장 보기</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>
          지수, 주요 종목, 수급, 뉴스를 한 번에 확인하는 시장 보조 화면입니다.
        </p>
      </section>

      <section className="grid-3">
        {mockIndices.map((item) => (
          <button key={item.code} className="card linklike" type="button" onClick={() => navigate(`/index/${item.code}`)}>
            <div className="card-title">{item.name}</div>
            <div className={item.changeRate >= 0 ? "num-md up" : "num-md down"} style={{ marginTop: 12 }}>{item.value.toLocaleString("ko-KR")}</div>
            <div className={item.changeRate >= 0 ? "stat-delta up" : "stat-delta down"}>{item.change.toLocaleString("ko-KR")} ({item.changeRate}%)</div>
            <div style={{ marginTop: 12 }}><MiniLine data={item.trend} positive={item.changeRate >= 0} /></div>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="card-head" style={{ padding: 20, margin: 0 }}>
            <div className="card-title">주요 종목</div>
            <button className="btn sm" onClick={() => navigate("/quant/today")}>오늘의 종목 보기</button>
          </div>
          <table className="t">
            <thead>
              <tr><th style={{ paddingLeft: 20 }}>종목</th><th>업종</th><th className="num">현재가</th><th className="num" style={{ paddingRight: 20 }}>등락률</th></tr>
            </thead>
            <tbody>
              {mockStocks.map((stock) => (
                <tr key={stock.code} className="clickable" onClick={() => navigate(`/stock/${stock.code}`)}>
                  <td style={{ paddingLeft: 20 }}><strong>{stock.name}</strong><div className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{stock.code}</div></td>
                  <td>{stock.sector}</td>
                  <td className="num">{formatWon(stock.price)}</td>
                  <td className={stock.changeRate >= 0 ? "num up" : "num down"} style={{ paddingRight: 20 }}>{stock.changeRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-title">수급 TOP</div>
            <div className="stack" style={{ marginTop: 14, gap: 10 }}>
              {mockInvestorFlows.slice(0, 4).map((flow) => (
                <div key={flow.stockCode} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{flow.rank}. {flow.stockName}</span>
                  <span className="mono">{formatAmount(flow.netBuyAmount)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-title">오늘의 뉴스</div>
            <div className="news-list" style={{ marginTop: 8 }}>
              {mockNews.map((news) => (
                <div key={news.id} className="news-item">
                  <div className="news-title">{news.title}</div>
                  <div className="news-meta">{news.source} · {news.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
