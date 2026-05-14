import { Link, useNavigate } from "react-router-dom";
import { getUsername, getToken, clearAuth } from "@/services/apiClient";

export function Header() {
  const username = getUsername();
  const isAuthed = !!getToken();
  const navigate = useNavigate();

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        height: "var(--header-h)",
        background: "var(--bg-panel)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      {/* 브랜드 영역 (사이드바 너비와 동일) */}
      <div
        style={{
          width: "var(--sidebar-w)",
          flexShrink: 0,
          paddingLeft: 20,
          paddingRight: 20,
          borderRight: "1px solid var(--border)",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "var(--text)",
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          Market Pulse
        </Link>
      </div>

      {/* 우측 영역 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: 24,
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            color: "var(--text-4)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "nowrap",
          }}
        >
          KRX 기준
        </span>
        <span className="tag">실시간</span>

        {isAuthed ? (
          <>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-3)",
                fontFamily: "var(--font-mono)",
                marginLeft: 4,
              }}
            >
              {username}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: "0 10px",
                height: 26,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-3)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              로그아웃
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "0 12px",
              height: 26,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--accent)",
              color: "var(--accent-fg)",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
