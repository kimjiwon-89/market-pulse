export function TarotPage() {
  return (
    <div className="stack max-w-[900px] mx-auto">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>타로</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>타로 서비스 화면의 목데이터 버전입니다.</p>
      </div>
      <div className="grid-3">
        {["현재", "흐름", "조언"].map((card, index) => (
          <div key={card} className="card" style={{ minHeight: 180 }}>
            <div className="card-title">{card}</div>
            <div style={{ marginTop: 28, fontSize: 42, fontWeight: 800, color: "var(--text-4)" }}>{index + 1}</div>
            <p style={{ color: "var(--text-2)" }}>오늘의 선택을 차분히 점검해보세요.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
