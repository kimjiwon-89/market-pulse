import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUsername, getToken, clearAuth } from "@/services/apiClient";
import { mockStocks } from "@/features/mock/marketMockData";
import type { StockMasterItem } from "@/types";

export function Header() {
  const username = getUsername();
  const isAuthed = !!getToken();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockMasterItem[]>([]);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    const lower = q.trim().toLowerCase();
    const items: StockMasterItem[] = mockStocks
      .filter((stock) => stock.name.toLowerCase().includes(lower) || stock.code.includes(lower))
      .slice(0, 10)
      .map((stock) => ({ code: stock.code, name: stock.name, market: stock.market === "ETF" ? "KOSPI" : stock.market }));
    setResults(items);
    setOpen(items.length > 0);
    setActiveIdx(-1);
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
    setProfileOpen(false);
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
      {/* 브랜드 영역 (데스크톱: 사이드바 너비 고정 + 우측 구분선) */}
      <div
        className="flex items-center h-full lg:w-[224px] lg:border-r border-[var(--border)]"
        style={{ flexShrink: 0, paddingLeft: 20, paddingRight: 20 }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "var(--accent)",
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span className="brand-mark">~</span>
          Market Pulse
        </Link>
      </div>

      {/* 검색 영역 — 모바일 숨김 */}
      <div
        ref={wrapperRef}
        className="hidden md:flex"
        style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: "0 24px", position: "relative" }}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
          <input
            type="text"
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder="종목명, 코드, 모델명 검색..."
            style={{
              width: "100%",
              height: 32,
              padding: "0 12px 0 32px",
              borderRadius: 8,
              border: "1px solid var(--border)",
                background: "var(--bg-input)",
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
      <div className="header-actions">
        {isAuthed ? (
          <>
            <button
              type="button"
              className="header-icon-action"
            >
              <span className="hidden md:inline">알림</span>
              <span className="header-badge">3</span>
            </button>
            <div className="header-profile-wrap">
              <button
                type="button"
                className="header-profile-button"
                onClick={() => setProfileOpen((current) => !current)}
                aria-label="내 프로필"
              >
                <span>{username?.slice(0, 1).toUpperCase() || "U"}</span>
              </button>
              {profileOpen && (
                <div className="header-profile-menu">
                  <button type="button" onClick={() => { setProfileOpen(false); navigate("/my"); }}>마이페이지</button>
                  <button type="button" onClick={() => { setProfileOpen(false); navigate("/my"); }}>관심 폴더</button>
                  <button type="button" onClick={handleLogout}>로그아웃</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "0 12px",
              height: 32,
              minHeight: 32,
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
