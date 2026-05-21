import type { QuantCandidateStatus, QuantCandidateStatusFilter } from "@/types";

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
