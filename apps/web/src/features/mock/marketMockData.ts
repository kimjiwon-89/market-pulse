export interface MockStock {
  code: string;
  name: string;
  market: "KOSPI" | "KOSDAQ" | "ETF";
  price: number;
  change: number;
  changeRate: number;
  sector: string;
  marketCap: string;
}

export interface MockIndex {
  code: string;
  name: string;
  value: number;
  change: number;
  changeRate: number;
  trend: number[];
}

export interface MockInvestorFlow {
  rank: number;
  stockCode: string;
  stockName: string;
  investor: "외국인" | "기관" | "개인";
  netBuyAmount: number;
  changeRate: number;
}

export const mockIndices: MockIndex[] = [
  { code: "0001", name: "KOSPI", value: 8046.81, change: -181.89, changeRate: -2.21, trend: [8240, 8210, 8170, 8130, 8070, 8010, 8046] },
  { code: "1001", name: "KOSDAQ", value: 1085.0, change: -48.13, changeRate: -4.25, trend: [1130, 1120, 1108, 1095, 1075, 1070, 1085] },
  { code: "2001", name: "KOSPI200", value: 1271.17, change: -27.69, changeRate: -2.13, trend: [1300, 1292, 1284, 1276, 1265, 1260, 1271] },
];

export const mockStocks: MockStock[] = [
  { code: "000660", name: "SK하이닉스", market: "KOSPI", price: 2237000, change: -6000, changeRate: -0.26, sector: "반도체", marketCap: "162조" },
  { code: "005930", name: "삼성전자", market: "KOSPI", price: 295250, change: -11750, changeRate: -3.82, sector: "반도체", marketCap: "176조" },
  { code: "005380", name: "현대차", market: "KOSPI", price: 674000, change: -7000, changeRate: -1.02, sector: "자동차", marketCap: "142조" },
  { code: "035720", name: "카카오", market: "KOSPI", price: 48300, change: 650, changeRate: 1.36, sector: "인터넷", marketCap: "21조" },
  { code: "102780", name: "KODEX 반도체", market: "ETF", price: 20950, change: -1880, changeRate: -8.23, sector: "ETF", marketCap: "1.8조" },
];

export const mockInvestorFlows: MockInvestorFlow[] = [
  { rank: 1, stockCode: "000660", stockName: "SK하이닉스", investor: "외국인", netBuyAmount: 65700000000, changeRate: -0.26 },
  { rank: 2, stockCode: "005930", stockName: "삼성전자", investor: "기관", netBuyAmount: 44300000000, changeRate: -3.82 },
  { rank: 3, stockCode: "005380", stockName: "현대차", investor: "외국인", netBuyAmount: 8000000000, changeRate: -1.02 },
  { rank: 4, stockCode: "035720", stockName: "카카오", investor: "개인", netBuyAmount: 6200000000, changeRate: 1.36 },
];

export const mockNews = [
  { id: "n1", title: "오늘 시장 현황, 반도체 수급 개선 흐름 확인", source: "Market Pulse", date: "2026.05.28", summary: "지수 약세 속에서도 일부 업종으로 수급이 모이고 있습니다." },
  { id: "n2", title: "환율·금리 변동성 확대, 위험 관리 필요", source: "데일리마켓", date: "2026.05.28", summary: "단기 변동성이 커진 종목은 추격보다 관찰이 우선이라는 분석입니다." },
  { id: "n3", title: "외국인 반도체 매수세 둔화, 종목별 차별화 확대", source: "증시노트", date: "2026.05.28", summary: "업종 전체보다 실적 확인이 가능한 종목으로 관심이 이동하고 있습니다." },
  { id: "n4", title: "코스닥 변동성 확대, 거래대금 상위 종목 점검", source: "마켓워치", date: "2026.05.28", summary: "낙폭이 큰 종목보다 수급이 유지되는 종목을 우선 확인해야 합니다." },
  { id: "n5", title: "기관 매수세, 대형 반도체와 자동차 일부로 집중", source: "투자노트", date: "2026.05.28", summary: "업종별 온도 차가 커지며 모델별 종목 선별이 중요해지고 있습니다." },
  { id: "n6", title: "장중 환율 반등, 수출주 변동성 확대 가능성", source: "데일리마켓", date: "2026.05.28", summary: "환율 변화가 큰 구간에서는 단기 가격 흔들림을 함께 확인해야 합니다." },
  { id: "n7", title: "ETF 거래대금 증가, 지수형보다 업종형 관심 확대", source: "증시노트", date: "2026.05.28", summary: "시장 전체보다 특정 업종을 따라가는 자금 흐름이 강해지고 있습니다." },
];

export const mockMemos = [
  { id: 1, title: "반도체 관심", content: "SK하이닉스는 여러 모델에서 동시에 신호. 단기 변동성 확인.", createdAt: "2026.05.28 14:20" },
  { id: 2, title: "지수 체크", content: "KOSPI 조정 구간. 신규 매수보다 리포트 확인.", createdAt: "2026.05.28 13:10" },
];

export const mockLottoRounds = [
  { round: 1173, numbers: [3, 11, 18, 24, 32, 41], bonus: 7 },
  { round: 1172, numbers: [5, 9, 17, 26, 34, 42], bonus: 12 },
];

export function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatAmount(value: number) {
  if (Math.abs(value) >= 100000000) return `${Math.round(value / 100000000).toLocaleString("ko-KR")}억원`;
  return `${value.toLocaleString("ko-KR")}원`;
}
