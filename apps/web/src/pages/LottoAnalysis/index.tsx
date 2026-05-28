import { useNavigate } from "react-router-dom";
import { getToken } from "@/services/apiClient";
import { mockLottoRounds } from "@/features/mock/marketMockData";

const strategies = [
  { name: "모멘텀", desc: "최근 자주 나온 번호와 흐름이 좋은 번호" },
  { name: "잠수함", desc: "오랫동안 나오지 않은 번호" },
  { name: "패턴", desc: "번호대와 끝자리 균형" },
];

export function LottoAnalysis() {
  const navigate = useNavigate();

  function saveCombo() {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    navigate("/my");
  }

  return (
    <div className="stack max-w-[1000px] mx-auto">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>로또</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>통계 전략 기반 번호 분석 화면입니다. 내 조합 저장은 로그인 후 가능합니다.</p>
      </div>
      <div className="grid-3">
        {strategies.map((strategy) => (
          <div key={strategy.name} className="card">
            <div className="card-title" style={{ fontSize: 16 }}>{strategy.name}</div>
            <p style={{ color: "var(--text-2)", margin: "10px 0 0" }}>{strategy.desc}</p>
            <div className="chips" style={{ marginTop: 16 }}>
              {[3, 11, 18, 24, 32, 41].slice(0, 4).map((num) => <span key={num} className="chip">{num}</span>)}
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-head">
          <div className="card-title">최근 회차</div>
          <button className="btn sm" onClick={saveCombo}>내 조합 저장</button>
        </div>
        <div className="stack" style={{ gap: 12 }}>
          {mockLottoRounds.map((round) => (
            <div key={round.round} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <strong>{round.round}회</strong>
              <div className="chips">
                {round.numbers.map((num) => <span key={num} className="chip">{num}</span>)}
                <span className="chip">+ {round.bonus}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
