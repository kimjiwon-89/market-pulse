import type { QuantCandidateSignal, QuantCandidateStatus, QuantCandidateStatusFilter } from "@/types";

export type QuantTab =
  | "overview"
  | "candidates"
  | "signals"
  | "backtest"
  | "diagnostics"
  | "run-control";

export const CANDIDATE_STATUS_OPTIONS: Array<{
  value: QuantCandidateStatusFilter;
  label: string;
}> = [
  { value: "ALL", label: "전체" },
  { value: "HOLDING", label: "보유" },
  { value: "BUY_CANDIDATE", label: "매수 후보" },
  { value: "WATCHLIST", label: "관찰" },
  { value: "BLOCKED", label: "차단" },
  { value: "SELL_TRIM", label: "매도/축소" },
];

export const CANDIDATE_STATUS_LABEL: Record<QuantCandidateStatus, string> = {
  HOLDING: "보유",
  BUY_CANDIDATE: "매수 후보",
  WATCHLIST: "관찰",
  BLOCKED: "차단",
  SELL_TRIM: "매도/축소",
};

export function statusTone(status: QuantCandidateStatus): "up" | "down" | "flat" | "" {
  if (status === "BUY_CANDIDATE") return "up";
  if (status === "SELL_TRIM" || status === "BLOCKED") return "down";
  if (status === "WATCHLIST") return "flat";
  return "";
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const digits = value.replaceAll("-", "");
  if (digits.length !== 8) return value;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

export function toInputDate(value: string) {
  const digits = value.replaceAll("-", "");
  if (digits.length !== 8) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

export function fromInputDate(value: string) {
  return value.replaceAll("-", "");
}

export function formatPctRatio(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatScore(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toFixed(digits);
}

export function formatMoney(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 100_000_000) return `${sign}${Math.round(abs / 100_000_000).toLocaleString()}억`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000).toLocaleString()}만`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

export function apiMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }
  return fallback;
}

export type BeginnerDecisionState = "BUYABLE" | "WATCH" | "RISK" | "REDUCE_SELL";
export type BeginnerAction = "BUY_READY" | "WAIT" | "HOLD" | "REDUCE" | "SELL" | "DO_NOT_BUY";
export type BeginnerRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface BeginnerDecision {
  state: BeginnerDecisionState;
  action: BeginnerAction;
  title: string;
  shortAction: string;
  reasons: string[];
  riskLevel: BeginnerRiskLevel;
  riskText: string;
  noBuyConditions: string[];
}

export const BEGINNER_STATE_LABEL: Record<BeginnerDecisionState, string> = {
  BUYABLE: "매수 가능",
  WATCH: "관찰",
  RISK: "위험",
  REDUCE_SELL: "매도 축소",
};

export const BEGINNER_RISK_LABEL: Record<BeginnerRiskLevel, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
};

export function beginnerStateTone(state: BeginnerDecisionState): "up" | "down" | "flat" | "" {
  if (state === "BUYABLE") return "up";
  if (state === "RISK" || state === "REDUCE_SELL") return "down";
  return "flat";
}

function normalizeAction(action?: string | null) {
  return (action ?? "").toUpperCase();
}

function easyReason(text: string) {
  const normalized = text.replaceAll("_", " ").trim();
  if (!normalized) return "";
  if (normalized.length <= 28) return normalized;
  return `${normalized.slice(0, 28)}...`;
}

function uniqNonEmpty(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export function mapBeginnerDecision(candidate: QuantCandidateSignal): BeginnerDecision {
  const action = normalizeAction(candidate.nextAction);
  const blockers = candidate.blockers ?? [];
  const riskFlags = candidate.riskFlags ?? [];
  const triggerConditions = candidate.triggerConditions ?? [];
  const reasonChips = candidate.reasonChips ?? [];
  const weightGap = (candidate.targetWeight ?? 0) - (candidate.currentWeight ?? 0);
  const hasRisk = candidate.candidateStatus === "BLOCKED" || blockers.length > 0 || riskFlags.length > 0;
  const isSell = candidate.candidateStatus === "SELL_TRIM" || action.includes("SELL");
  const isTrim = action.includes("TRIM");
  const isHolding = candidate.candidateStatus === "HOLDING";
  const isScheduledBuy =
    candidate.candidateStatus === "BUY_CANDIDATE" &&
    candidate.rebalanceStatus === "SCHEDULED" &&
    blockers.length === 0;

  if (hasRisk) {
    const noBuyConditions = uniqNonEmpty([
      ...blockers.map((item) => `차단 조건: ${easyReason(item)}`),
      ...riskFlags.map((item) => `위험 경고: ${easyReason(item)}`),
      "위험 조건이 풀릴 때까지 신규 매수 보류",
    ]);
    return {
      state: "RISK",
      action: "DO_NOT_BUY",
      title: "위험 신호 있음",
      shortAction: "오늘은 사지 않음",
      reasons: uniqNonEmpty([
        ...noBuyConditions,
        ...reasonChips.slice(0, 1).map(easyReason),
      ]).slice(0, 3),
      riskLevel: "HIGH",
      riskText: "차단 조건 또는 위험 경고가 있습니다.",
      noBuyConditions,
    };
  }

  if (isSell || isTrim) {
    const sellAction = isSell ? "SELL" : "REDUCE";
    return {
      state: "REDUCE_SELL",
      action: sellAction,
      title: isSell ? "매도 검토" : "비중 줄이기",
      shortAction: isSell ? "보유 중이면 매도 검토" : "보유 중이면 비중 축소 검토",
      reasons: uniqNonEmpty([
        weightGap < -0.01 ? "현재 비중이 목표보다 높습니다." : "",
        ...reasonChips.slice(0, 2).map(easyReason),
        ...triggerConditions.slice(0, 1).map(easyReason),
      ]).slice(0, 3),
      riskLevel: "MEDIUM",
      riskText: "축소 또는 매도 판단이 필요한 구간입니다.",
      noBuyConditions: ["신규 매수보다 보유 비중 조정이 우선입니다."],
    };
  }

  if (isHolding && Math.abs(weightGap) <= 0.01) {
    return {
      state: "WATCH",
      action: "HOLD",
      title: "보유 유지",
      shortAction: "보유 중이면 유지",
      reasons: uniqNonEmpty([
        "현재 비중이 목표 비중과 가깝습니다.",
        ...reasonChips.slice(0, 2).map(easyReason),
      ]).slice(0, 3),
      riskLevel: "LOW",
      riskText: "큰 조정 신호는 없습니다.",
      noBuyConditions: ["새 매수보다 현재 보유 상태를 유지합니다."],
    };
  }

  if (isScheduledBuy) {
    return {
      state: "BUYABLE",
      action: "BUY_READY",
      title: "지금 매수 가능",
      shortAction: "리밸런싱일에 매수 검토",
      reasons: uniqNonEmpty([
        "매수 후보이고 예정일이 잡혀 있습니다.",
        ...reasonChips.slice(0, 2).map(easyReason),
        ...triggerConditions.slice(0, 1).map(easyReason),
      ]).slice(0, 3),
      riskLevel: "LOW",
      riskText: "현재 차단 조건은 없습니다.",
      noBuyConditions: ["예정일 전에는 체결보다 조건 확인이 우선입니다."],
    };
  }

  return {
    state: "WATCH",
    action: isHolding ? "HOLD" : "WAIT",
    title: isHolding ? "보유 유지" : "기다리기",
    shortAction: isHolding ? "보유 중이면 유지" : "오늘은 관찰",
    reasons: uniqNonEmpty([
      candidate.candidateStatus === "BUY_CANDIDATE" ? "아직 매수 예정 상태가 아닙니다." : "",
      ...reasonChips.slice(0, 2).map(easyReason),
      ...triggerConditions.slice(0, 1).map(easyReason),
    ]).slice(0, 3),
    riskLevel: "MEDIUM",
    riskText: "확인할 조건이 남아 있습니다.",
    noBuyConditions: uniqNonEmpty([
      candidate.rebalanceStatus !== "SCHEDULED" ? "리밸런싱 예정이 아직 없습니다." : "",
      candidate.targetWeight <= 0 ? "목표 비중이 0입니다." : "",
      "조건 충족 전에는 신규 매수를 보류합니다.",
    ]),
  };
}
