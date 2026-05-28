import { formatAmount, mockInvestorFlows } from "@/features/mock/marketMockData";

export function InvestorTrend() {
  return (
    <div className="stack max-w-[1000px] mx-auto">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>투자자 동향</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>외국인, 기관, 개인의 주요 순매수 흐름을 목데이터로 보여줍니다.</p>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="t">
          <thead><tr><th style={{ paddingLeft: 20 }}>순위</th><th>종목</th><th>투자자</th><th className="num">순매수</th><th className="num" style={{ paddingRight: 20 }}>등락률</th></tr></thead>
          <tbody>
            {mockInvestorFlows.map((flow) => (
              <tr key={`${flow.rank}-${flow.stockCode}`}>
                <td style={{ paddingLeft: 20 }}>{flow.rank}</td>
                <td>{flow.stockName}</td>
                <td>{flow.investor}</td>
                <td className="num">{formatAmount(flow.netBuyAmount)}</td>
                <td className={flow.changeRate >= 0 ? "num up" : "num down"} style={{ paddingRight: 20 }}>{flow.changeRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
