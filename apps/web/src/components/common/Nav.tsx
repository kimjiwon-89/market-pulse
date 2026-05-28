import { NavLink } from "react-router-dom";
import { quantAsOf } from "@/features/quant/quantMockData";
import { getRole } from "@/services/apiClient";

const NAV_ITEMS = [
  {
    id: "home",
    to: "/",
    label: "홈",
    icon: "M3 12 12 4l9 8M5 11v9h5v-6h4v6h5v-9",
    end: true,
  },
  {
    id: "today",
    to: "/quant/today",
    label: "오늘의 종목",
    icon: "M4 6h16M4 12h16M4 18h10",
    end: false,
  },
  {
    id: "quant",
    to: "/quant",
    label: "모델 목록",
    icon: "M3 3v18h18M7 16l4-8 4 4 4-6",
    end: false,
  },
  {
    id: "reports",
    to: "/reports",
    label: "리포트",
    icon: "M6 3h9l3 3v15H6V3zM14 3v4h4M9 12h6M9 16h6",
    end: false,
  },
  {
    id: "market",
    to: "/market",
    label: "시장 보기",
    icon: "M3 21h18M5 21V8l7-4 7 4v13M9 21v-7h6v7",
    end: false,
  },
  {
    id: "services",
    to: "/services",
    label: "더보기",
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-4 8a4 4 0 0 1 8 0H8z",
    end: false,
  },
];

const ADMIN_ITEM = {
  id: "admin",
  to: "/admin",
  label: "관리자",
  icon: "M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20c0-4 3.6-7 8-7s8 3 8 7",
  end: false,
};

export function Nav() {
  const role = getRole();
  const items = role === "ADMIN" ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <aside
      className="hidden lg:flex flex-col"
      style={{
        width: "var(--sidebar-w)",
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--bg-panel)",
        position: "sticky",
        top: "var(--header-h)",
        height: "calc(100vh - var(--header-h))",
        overflowY: "auto",
        padding: "12px 8px",
        gap: 2,
      }}
    >
      {items.map(({ id, to, label, icon, end }) => (
        <NavLink
          key={id}
          to={to}
          end={end}
          aria-current="page"
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 12px",
            height: 38,
            borderRadius: "var(--radius)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? "var(--accent)" : "var(--text-3)",
            background: isActive ? "var(--accent-soft)" : "transparent",
            transition: "background 0.15s, color 0.15s",
          })}
          className={({ isActive }) => (isActive ? "" : "nav-item-inactive")}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
            stroke="currentColor"
          >
            <path d={icon} />
          </svg>
          <span style={{ whiteSpace: "nowrap" }}>{label}</span>
        </NavLink>
      ))}
      <div className="nav-side-status">
        <div>데이터 기준</div>
        <strong>{quantAsOf}</strong>
      </div>
    </aside>
  );
}
