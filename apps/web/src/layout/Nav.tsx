import { Link, useLocation } from "react-router-dom";
import styled, { css } from "styled-components";
import { quantAsOf } from "@/features/quant/quantMockData";
import { getRole } from "@/services/apiClient";

const NAV_ITEMS = [
  { id: "home", to: "/", label: "홈", end: true },
  { id: "today", to: "/quant/today", label: "오늘의 종목", end: false },
  { id: "quant", to: "/quant", label: "모델 목록", end: false },
  { id: "reports", to: "/reports", label: "리포트", end: false },
  { id: "market", to: "/market", label: "시장 보기", end: false },
  { id: "services", to: "/services", label: "더보기", end: false },
];

const ADMIN_ITEM = { id: "admin", to: "/admin", label: "관리자", end: false };

const Sidebar = styled.aside`
  width: ${({ theme }) => theme.layout.sidebarWidth};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
  position: sticky;
  top: ${({ theme }) => theme.layout.headerHeight};
  padding: 12px 8px;
  border-right: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.panel};
  overflow-y: auto;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    display: none;
  }
`;

const Item = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 12px;
  border-radius: ${({ theme }) => theme.radius.control};
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 13px;
  text-decoration: none;

  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.color.accentSoft};
      color: ${theme.color.accent};
      font-weight: 700;
    `}

  &:hover {
    background: ${({ theme }) => theme.color.hover};
  }
`;

const Status = styled.div`
  margin-top: auto;
  padding: 16px 14px;
  border-top: 1px solid ${({ theme }) => theme.color.divider};
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 12px;

  strong {
    display: block;
    margin-top: 4px;
    color: ${({ theme }) => theme.color.textMuted};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    font-weight: 500;
  }
`;

export function Nav() {
  const role = getRole();
  const location = useLocation();
  const items = role === "ADMIN" ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  function isActive(to: string, end: boolean) {
    if (end) return location.pathname === to;
    if (to === "/quant") return location.pathname === "/quant" || /^\/quant\/(?!today$).+/.test(location.pathname);
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  return (
    <Sidebar>
      {items.map(({ id, to, label, end }) => (
        <Item
          key={id}
          to={to}
          $active={isActive(to, end)}
          className={isActive(to, end) ? "active" : undefined}
          aria-current={isActive(to, end) ? "page" : undefined}
        >
          {label}
        </Item>
      ))}
      <Status>
        <div>데이터 기준</div>
        <strong>{quantAsOf}</strong>
      </Status>
    </Sidebar>
  );
}
