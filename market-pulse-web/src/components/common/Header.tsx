import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUsername, getToken, clearAuth, apiClient } from "@/services/apiClient";
import type { StockMasterItem } from "@/types";

export function Header() {
  const username = getUsername();
  const isAuthed = !!getToken();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockMasterItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    try {
      const res = await apiClient.get("/stock/search", { params: { q, limit: 10 } });
      const items: StockMasterItem[] = res.data.data ?? [];
      setResults(items);
      setOpen(items.length > 0);
      setActiveIdx(-1);
    } catch {
      setResults([]); setOpen(false);
    }
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 200);
  }

  function selectItem(item: StockMasterItem) {
    setQuery("");
    setResults([]);
    setOpen(false);
    navigate(`/stock/${item.code}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIdx >= 0) { selectItem(results[activeIdx]); }
    else if (e.key === "Escape") { setOpen(false); setActiveIdx(-1); }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      {/* 검색 영역 */}
      <div
        ref={wrapperRef}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", position: "relative" }}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
          <input
            type="text"
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder="종목명 또는 코드 검색..."
            style={{
              width: "100%",
              height: 32,
              padding: "0 12px 0 32px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text)",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {/* 돋보기 아이콘 */}
          <svg
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }}
            width={14} height={14} viewBox="0 0 16 16" fill="none"
          >
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          {/* 드롭다운 */}
          {open && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: "var(--bg-panel)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                zIndex: 100,
                overflow: "hidden",
              }}
            >
              {results.map((item, idx) => (
                <div
                  key={item.code}
                  onMouseDown={() => selectItem(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    gap: 10,
                    cursor: "pointer",
                    background: idx === activeIdx ? "var(--bg-hover, rgba(255,255,255,0.05))" : "transparent",
                    borderBottom: idx < results.length - 1 ? "1px solid var(--divider)" : "none",
                  }}
                >
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{item.name}</span>
                  <span style={{ fontSize: 11, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>{item.code}</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: item.market === "KOSPI" ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)",
                      color: item.market === "KOSPI" ? "#60a5fa" : "#34d399",
                      fontWeight: 600,
                    }}
                  >
                    {item.market}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 우측 영역 */}
      <div
        style={{
          flexShrink: 0,
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
