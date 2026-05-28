import { fromInputDate, toInputDate } from "./quantTypes";

type Props = {
  selectedDate: string;
  onChange: (date: string) => void;
  latestSignalDate?: string;
};

export function QuantDateSelector({ selectedDate, onChange, latestSignalDate }: Props) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="m-0 text-xl font-bold">MP_CORE 퀀트 대시보드</h1>
        <p className="m-0 mt-1 text-sm text-[var(--text-3)]">
          단일 코어 모델의 후보, 비중, 리스크, 백테스트 근거를 확인합니다.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          aria-label="신호 기준일"
          type="date"
          value={toInputDate(selectedDate)}
          onChange={(event) => onChange(fromInputDate(event.target.value))}
        />
        {latestSignalDate && (
          <button className="btn sm" type="button" onClick={() => onChange(latestSignalDate)}>
            최신 신호
          </button>
        )}
      </div>
    </div>
  );
}
