import type { QuantCandidateSignal, QuantCandidateStatusFilter } from "@/types";
import { CANDIDATE_STATUS_LABEL, CANDIDATE_STATUS_OPTIONS } from "./quantTypes";

type Props = {
  value: QuantCandidateStatusFilter;
  candidates: QuantCandidateSignal[];
  onChange: (status: QuantCandidateStatusFilter) => void;
};

export function CandidateStatusTabs({ value, candidates, onChange }: Props) {
  const count = (status: QuantCandidateStatusFilter) => (
    status === "ALL" ? candidates.length : candidates.filter((item) => item.candidateStatus === status).length
  );

  return (
    <div className="chips overflow-x-auto pb-1">
      {CANDIDATE_STATUS_OPTIONS.map((option) => (
        <button
          key={option.value}
          className="chip"
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.value === "ALL" ? option.label : CANDIDATE_STATUS_LABEL[option.value]} {count(option.value)}
        </button>
      ))}
    </div>
  );
}
