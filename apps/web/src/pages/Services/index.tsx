import { useNavigate } from "react-router-dom";

export function Services() {
  const navigate = useNavigate();

  return (
    <div className="stack max-w-[900px] mx-auto">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>서비스</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>
          투자 판단 흐름과 분리된 부가 서비스를 모았습니다.
        </p>
      </div>
      <div className="grid-2">
        <button className="card linklike" type="button" onClick={() => navigate("/lotto")} style={{ textAlign: "left" }}>
          <div className="card-title" style={{ fontSize: 18 }}>로또</div>
          <p style={{ margin: "10px 0 0", color: "var(--text-2)" }}>통계 전략 기반 번호 분석과 내 조합 저장을 제공합니다.</p>
          <div className="card-sub" style={{ marginTop: 18 }}>내 조합 저장은 로그인 필요</div>
        </button>
        <button className="card linklike" type="button" onClick={() => navigate("/tarot")} style={{ textAlign: "left" }}>
          <div className="card-title" style={{ fontSize: 18 }}>타로</div>
          <p style={{ margin: "10px 0 0", color: "var(--text-2)" }}>타로 서비스는 별도 화면으로 연결될 예정입니다.</p>
          <div className="card-sub" style={{ marginTop: 18 }}>목데이터 단계</div>
        </button>
      </div>
    </div>
  );
}
