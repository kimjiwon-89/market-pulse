export type QuantDecisionLabel = "살펴볼 종목" | "기다릴 종목" | "조심할 종목";
export type QuantDecisionCode = "BUY" | "SELL" | "WARNING" | "SIDE";
export type QuantModelLabel = "상승장 모델" | "횡보장 모델" | "하락장 모델" | "여러 모델";
export type StockBadgeTone = "red" | "blue" | "navy" | "purple" | "black";

export interface QuantKpi {
  id: string;
  label: string;
  value: string;
  hint: string;
  delta?: string;
  direction?: "up" | "down" | "flat";
}

export interface QuantDecision {
  assetCode: string;
  assetName: string;
  market: "KOSPI" | "KOSDAQ" | "ETF";
  badgeText: string;
  badgeTone: StockBadgeTone;
  modelNames: string[];
  modelLabel: QuantModelLabel;
  decisionLabel: QuantDecisionLabel;
  decisionCode: QuantDecisionCode;
  reasonBullets: string[];
  cautionBullets: string[];
}

export interface QuantModelSummary {
  code: string;
  name: string;
  plainName: string;
  description: string;
  marketMode: QuantModelLabel;
  status: "정상 운영" | "관찰 중" | "관리자 점검";
  signalStrength: "낮음" | "보통" | "높음";
  focus: string[];
  todayCount: number;
}

export interface QuantReportSummary {
  id: string;
  title: string;
  modelCode: string;
  modelName: string;
  publishedAt: string;
  summary: string;
  keywords: string[];
}
