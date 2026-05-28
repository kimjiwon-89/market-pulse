import { formatAmount, mockInvestorFlows } from "@/features/mock/marketMockData";

export function NetBuyingList() {
  return (
    <div className="stack max-w-[1000px] mx-auto">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>순매수도</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>날짜별 수급 비교 화면의 목데이터 버전입니다.</p>
      </div>
      <div className="grid-2">
        {["외국인", "기관"].map((investor) => (
          <div key={investor} className="card">
            <div className="card-title">{investor} 순매수</div>
            <div className="stack" style={{ marginTop: 14, gap: 10 }}>
              {mockInvestorFlows.filter((flow) => flow.investor === investor || investor === "외국인").slice(0, 4).map((flow) => (
                <div key={`${investor}-${flow.stockCode}`} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span>{flow.stockName}</span>
                  <span className="mono">{formatAmount(flow.netBuyAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
