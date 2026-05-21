import { useState } from "react";
import { apiClient } from "@/services/apiClient";
import { apiMessage, fromInputDate } from "./quantTypes";

type Props = {
  selectedDate: string;
  onDone: () => void;
};

type RunAction = "features" | "signals" | "backtest";

export function RunControlPanel({ selectedDate, onDone }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [initialCash, setInitialCash] = useState(10_000_000);
  const [running, setRunning] = useState<RunAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (action: RunAction) => {
    setRunning(action);
    setMessage(null);
    try {
      if (action === "features") {
        await apiClient.post("/quant/core/features", null, { params: { from: fromInputDate(from), to: fromInputDate(to) } });
      }
      if (action === "signals") {
        await apiClient.post("/quant/core/signals/generate", null, { params: { date: selectedDate, limit: 20 } });
      }
      if (action === "backtest") {
        await apiClient.post("/quant/core/backtests", {
          from: fromInputDate(from),
          to: fromInputDate(to),
          initialCash,
        });
      }
      setMessage("실행 요청이 완료되었습니다.");
      onDone();
    } catch (error) {
      setMessage(apiMessage(error, "실행 요청에 실패했습니다."));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Run Control</div>
          <div className="card-sub">ADMIN 전용 실행 API</div>
        </div>
        <span className="tag">MP_CORE</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="시작일" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="종료일" />
        <input
          type="number"
          min={1}
          step={1000000}
          value={initialCash}
          onChange={(event) => setInitialCash(Number(event.target.value))}
          aria-label="초기 자금"
        />
        <button className="btn" type="button" disabled={!from || !to || running !== null} onClick={() => run("features")}>
          {running === "features" ? "실행 중" : "Feature 생성"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn" type="button" disabled={running !== null} onClick={() => run("signals")}>
          {running === "signals" ? "실행 중" : "Signal 생성"}
        </button>
        <button className="btn" type="button" disabled={!from || !to || running !== null} onClick={() => run("backtest")}>
          {running === "backtest" ? "실행 중" : "Backtest 실행"}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-[var(--text-3)]">{message}</p>}
    </div>
  );
}
