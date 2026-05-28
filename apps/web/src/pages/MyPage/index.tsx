import { useNavigate } from "react-router-dom";
import { clearAuth, getRole, getToken, getUsername } from "@/services/apiClient";

export function MyPage() {
  const navigate = useNavigate();
  const token = getToken();
  const username = getUsername();
  const role = getRole();

  if (!token) {
    return (
      <div className="error-block">
        <div className="error-title">로그인이 필요한 기능입니다</div>
        <div className="error-msg">관심 종목, 메모, 알림, 저장 리포트는 계정에 저장됩니다.</div>
        <button className="btn primary" type="button" onClick={() => navigate("/login")}>로그인하기</button>
      </div>
    );
  }

  function handleLogout() {
    clearAuth();
    navigate("/", { replace: true });
  }

  return (
    <div className="stack max-w-[900px] mx-auto">
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>마이</h1>
            <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>{username} · {role ?? "USER"}</p>
          </div>
          <button className="btn" type="button" onClick={handleLogout}>로그아웃</button>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">관심 종목</div>
          <p className="card-sub" style={{ marginTop: 10 }}>홈에서 저장한 종목이 여기에 표시됩니다.</p>
        </div>
        <div className="card">
          <div className="card-title">내 메모</div>
          <p className="card-sub" style={{ marginTop: 10 }}>종목과 리포트에 연결된 메모를 모아봅니다.</p>
        </div>
        <div className="card">
          <div className="card-title">알림 설정</div>
          <p className="card-sub" style={{ marginTop: 10 }}>모델 신호, 리포트, 관심 종목 알림을 설정합니다.</p>
        </div>
        <div className="card">
          <div className="card-title">저장한 리포트</div>
          <p className="card-sub" style={{ marginTop: 10 }}>나중에 볼 리포트를 저장합니다.</p>
        </div>
      </div>
      {role === "ADMIN" && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">관리자</div>
            <button className="btn sm" type="button" onClick={() => navigate("/admin")}>관리자 화면</button>
          </div>
          <p style={{ color: "var(--text-3)", margin: 0 }}>검증 기록, 백테스트, 데이터 수집, 캐시 관리는 관리자 전용입니다.</p>
        </div>
      )}
    </div>
  );
}
