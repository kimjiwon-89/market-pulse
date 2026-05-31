import { NavLink } from "react-router-dom";
import styled from "styled-components";

const BOTTOM_NAV_ITEMS = [
  { id: "market", to: "/market", label: "시장", end: false },
  { id: "quant", to: "/quant", label: "모델", end: false },
  { id: "home", to: "/", label: "홈", end: true },
  { id: "services", to: "/services", label: "서비스", end: false },
  { id: "my", to: "/my", label: "마이", end: false },
];

const Bar = styled.nav`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    position: fixed;
    z-index: 30;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    height: ${({ theme }) => theme.layout.bottomNavHeight};
    border-top: 1px solid ${({ theme }) => theme.color.border};
    background: ${({ theme }) => theme.color.panel};
  }
`;

const Item = styled(NavLink)`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 11px;
  text-decoration: none;

  &.active {
    color: ${({ theme }) => theme.color.accent};
    font-weight: 800;
  }
`;

export function BottomNav() {
  return (
    <Bar>
      {BOTTOM_NAV_ITEMS.map(({ id, to, label, end }) => (
        <Item key={id} to={to} end={end}>
          {label}
        </Item>
      ))}
    </Bar>
  );
}
