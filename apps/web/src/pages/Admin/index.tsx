export function Admin() {
  return (
    <div className="stack max-w-[1100px] mx-auto">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>관리자</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>
          데이터 수집, 모델 실행, 캐시, 검증 기록은 일반 사용자 화면에서 분리합니다.
        </p>
      </div>
      <div className="grid-3">
        {[
          ["데이터 수집", "장중 시세, 지수, 수급 데이터 수집 상태"],
          ["모델 실행", "일별 모델 계산과 리포트 생성"],
          ["검증 기록", "백테스트, evidence, 관리자용 성과 점검"],
        ].map(([title, desc]) => (
          <div key={title} className="card">
            <div className="card-title" style={{ fontSize: 16 }}>{title}</div>
            <p style={{ color: "var(--text-2)", margin: "10px 0 0" }}>{desc}</p>
            <span className="tag" style={{ marginTop: 16 }}>목데이터</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">운영 체크리스트</div>
        <table className="t" style={{ marginTop: 12 }}>
          <tbody>
            <tr><td>모델 신호 생성</td><td><span className="tag">정상</span></td></tr>
            <tr><td>리포트 생성</td><td><span className="tag">정상</span></td></tr>
            <tr><td>캐시 갱신</td><td><span className="tag">대기</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
