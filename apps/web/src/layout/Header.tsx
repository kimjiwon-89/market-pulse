import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { mockStocks } from "@/features/mock/marketMockData";
import { clearAuth, getToken, getUsername } from "@/services/apiClient";
import type { StockMasterItem } from "@/types";

const Shell = styled.header`
  position: sticky;
  top: 0;
  z-index: 30;
  height: ${({ theme }) => theme.layout.headerHeight};
  display: flex;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.panel};

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    padding: 0 16px;
  }
`;

const BrandArea = styled.div`
  width: ${({ theme }) => theme.layout.sidebarWidth};
  height: 100%;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 20px;
  border-right: 1px solid ${({ theme }) => theme.color.border};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    width: auto;
    border-right: 0;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    min-width: 0;
    padding: 0;
  }
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: ${({ theme }) => theme.color.accent};
  font-size: 20px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
`;

const BrandLogo = styled.img`
  display: inline-flex;
  width: 28px;
  height: 28px;
  object-fit: contain;
`;

const SearchArea = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 24px;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    display: none;
  }
`;

const SearchBox = styled.div`
  position: relative;
  width: min(100%, 380px);
`;

const SearchInput = styled.input`
  width: 100%;
  height: 32px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.input};
  color: ${({ theme }) => theme.color.text};
  font: inherit;
  font-size: 13px;
  outline: 0;
`;

const Results = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  left: 0;
  z-index: 100;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.panel};
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
`;

const ResultItem = styled.button<{ $active: boolean }>`
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  padding: 9px 12px;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.color.divider};
  background: ${({ $active, theme }) => ($active ? theme.color.hover : "transparent")};
  color: ${({ theme }) => theme.color.text};
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:last-child {
    border-bottom: 0;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  flex-shrink: 0;
  padding-right: 24px;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    margin-left: auto;
    padding-right: 0;
  }
`;

const TextAction = styled.button`
  position: relative;
  height: 32px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.color.text};
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
`;

const Badge = styled.span`
  position: absolute;
  top: 2px;
  right: -8px;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.up};
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  line-height: 15px;
`;

const ProfileWrap = styled.div`
  position: relative;
`;

const ProfileButton = styled.button`
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: ${({ theme }) => theme.color.hover};
  color: ${({ theme }) => theme.color.textMuted};
  font: inherit;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
`;

const Menu = styled.div`
  position: absolute;
  top: 40px;
  right: 0;
  z-index: 80;
  width: 126px;
  padding: 6px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.panel};
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
`;

const MenuButton = styled.button`
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.small};
  background: transparent;
  color: ${({ theme }) => theme.color.textMuted};
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.accentSoft};
    color: ${({ theme }) => theme.color.accent};
  }
`;

const LoginButton = styled.button`
  height: 32px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.color.accent};
  border-radius: ${({ theme }) => theme.radius.small};
  background: ${({ theme }) => theme.color.accent};
  color: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
`;

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
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const lower = q.trim().toLowerCase();
    const items: StockMasterItem[] = mockStocks
      .filter((stock) => stock.name.toLowerCase().includes(lower) || stock.code.includes(lower))
      .slice(0, 10)
      .map((stock) => ({ code: stock.code, name: stock.name, market: stock.market === "ETF" ? "KOSPI" : stock.market }));
    setResults(items);
    setOpen(items.length > 0);
    setActiveIdx(-1);
  }, []);

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
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

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      selectItem(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
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
    <Shell>
      <BrandArea>
        <Brand to="/">
          <BrandLogo src="/logo.png" alt="" aria-hidden="true" />
          Market Pulse
        </Brand>
      </BrandArea>
      <SearchArea ref={wrapperRef}>
        <SearchBox>
          <SearchInput
            type="text"
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder="종목명, 코드, 모델명 검색..."
          />
          {open && (
            <Results>
              {results.map((item, idx) => (
                <ResultItem key={item.code} type="button" $active={idx === activeIdx} onMouseDown={() => selectItem(item)}>
                  <span>{item.name}</span>
                  <span>{item.code}</span>
                </ResultItem>
              ))}
            </Results>
          )}
        </SearchBox>
      </SearchArea>
      <Actions>
        {isAuthed ? (
          <>
            <TextAction type="button">
              알림
              <Badge>3</Badge>
            </TextAction>
            <ProfileWrap>
              <ProfileButton type="button" onClick={() => setProfileOpen((current) => !current)} aria-label="내 프로필">
                {username?.slice(0, 1).toUpperCase() || "U"}
              </ProfileButton>
              {profileOpen && (
                <Menu>
                  <MenuButton type="button" onClick={() => { setProfileOpen(false); navigate("/my"); }}>마이페이지</MenuButton>
                  <MenuButton type="button" onClick={() => { setProfileOpen(false); navigate("/my"); }}>관심 폴더</MenuButton>
                  <MenuButton type="button" onClick={handleLogout}>로그아웃</MenuButton>
                </Menu>
              )}
            </ProfileWrap>
          </>
        ) : (
          <LoginButton type="button" onClick={() => navigate("/login")}>로그인</LoginButton>
        )}
      </Actions>
    </Shell>
  );
}
