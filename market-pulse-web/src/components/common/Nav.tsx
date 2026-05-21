import { NavLink } from "react-router-dom";
import { getRole } from "@/services/apiClient";

const NAV_ITEMS = [
  {
    id: "dashboard",
    to: "/",
    label: "대시보드",
    icon: "M3 12 12 4l9 8M5 11v9h5v-6h4v6h5v-9",
    end: true,
  },
  {
    id: "sector",
    to: "/index/0001",
    label: "업종 상세",
    icon: "M3 21h18M5 21V8l7-4 7 4v13M9 21v-7h6v7",
    end: false,
  },
  {
    id: "flow",
    to: "/net-buy",
    label: "순매수도",
    icon: "M3 17l6-6 4 4 8-8M14 7h7v7",
    end: false,
  },
  {
    id: "investor",
    to: "/investor",
    label: "투자자 동향",
    icon: "M3 3v18h18M7 14l4-4 4 3 5-7",
    end: false,
  },
  {
    id: "memo",
    to: "/memo",
    label: "메모",
    icon: "M9 3h6l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 3v5h6",
    end: false,
  },
  {
    id: "news",
    to: "/news",
    label: "뉴스",
    icon: "M4 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
    end: false,
  },
  {
    id: "lotto",
    to: "/lotto",
    label: "로또 연구소",
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-4 8a4 4 0 0 1 8 0H8z",
    end: false,
  },
  {
    id: "quant",
    to: "/quant",
    label: "MP_CORE",
    icon: "M3 3v18h18M7 16l4-8 4 4 4-6",
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
            color: isActive ? "var(--text)" : "var(--text-3)",
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
    </aside>
  );
}
