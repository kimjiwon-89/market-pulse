import { Link, useParams } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { mockIndices, mockStocks } from "@/features/mock/marketMockData";

export function IndexDetail() {
  const { id } = useParams();
  const index = mockIndices.find((item) => item.code === id) ?? mockIndices[0];

  return (
    <div className="stack max-w-[1000px] mx-auto">
      <div className="card">
        <Link className="card-link" to="/market">← 시장 보기</Link>
        <h1 style={{ margin: "14px 0 0", fontSize: 24, fontWeight: 800 }}>{index.name}</h1>
        <div className={index.changeRate >= 0 ? "num-lg up" : "num-lg down"} style={{ marginTop: 12 }}>
          {index.value.toLocaleString("ko-KR")} · {index.changeRate}%
        </div>
      </div>
      <div className="card">
        <div className="card-title">흐름</div>
        <div style={{ height: 280, marginTop: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={index.trend.map((value, day) => ({ day: `${day + 1}`, value }))}>
              <XAxis dataKey="day" />
              <YAxis domain={["dataMin - 20", "dataMax + 20"]} />
              <Tooltip />
              <Line dataKey="value" stroke={index.changeRate >= 0 ? "var(--up)" : "var(--down)"} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <div className="card-title">관련 주요 종목</div>
        <table className="t" style={{ marginTop: 12 }}>
          <tbody>
            {mockStocks.slice(0, 4).map((stock) => (
              <tr key={stock.code}><td>{stock.name}</td><td>{stock.sector}</td><td className={stock.changeRate >= 0 ? "num up" : "num down"}>{stock.changeRate}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
