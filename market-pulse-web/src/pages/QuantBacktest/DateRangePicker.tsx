type Props = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
};

function toInput(value: string) {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function toBasic(value: string) {
  return value.replaceAll("-", "");
}

function yearsAgo(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10).replaceAll("-", "");
}

function today() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

export function DateRangePicker({ from, to, onChange }: Props) {
  const presets = [
    { label: "최근 1년", from: yearsAgo(1) },
    { label: "최근 3년", from: yearsAgo(3) },
    { label: "최근 5년", from: yearsAgo(5) },
    { label: "전체", from: "20100104" },
  ];

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">기간</div>
        <div className="chips">
          {presets.map(preset => (
            <button key={preset.label} className="chip" onClick={() => onChange(preset.from, today())}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <input className="input" type="date" value={toInput(from)} onChange={e => onChange(toBasic(e.target.value), to)} />
        <input className="input" type="date" value={toInput(to)} onChange={e => onChange(from, toBasic(e.target.value))} />
      </div>
    </div>
  );
}
