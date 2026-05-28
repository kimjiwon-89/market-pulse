import { useNavigate } from "react-router-dom";
import { getToken } from "@/services/apiClient";
import { mockMemos } from "@/features/mock/marketMockData";

export function MemoList() {
  const navigate = useNavigate();
  const authed = !!getToken();

  if (!authed) {
    return (
      <div className="error-block">
        <div className="error-title">메모는 로그인 후 사용할 수 있습니다</div>
        <div className="error-msg">메모는 계정에 연결되는 개인 기능입니다.</div>
        <button className="btn primary" onClick={() => navigate("/login")}>로그인하기</button>
      </div>
    );
  }

  return (
    <div className="stack max-w-[900px] mx-auto">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>내 메모</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-2)" }}>관심 종목과 리포트에 남긴 메모를 모아봅니다.</p>
      </div>
      <div className="card">
        <div className="memo-list">
          {mockMemos.map((memo) => (
            <div key={memo.id} className="memo-item">
              <div className="memo-date">{memo.createdAt}</div>
              <div style={{ fontWeight: 700 }}>{memo.title}</div>
              <div className="memo-preview">{memo.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
