import { NavLink } from "react-router-dom";
import { getRole } from "@/services/apiClient";

const BOTTOM_NAV_ITEMS = [
  {
    id: "dashboard",
    to: "/",
    label: "대시보드",
    icon: "M3 12 12 4l9 8M5 11v9h5v-6h4v6h5v-9",
    end: true,
  },
  {
    id: "flow",
    to: "/net-buy",
    label: "순매수도",
    icon: "M3 17l6-6 4 4 8-8M14 7h7v7",
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
    id: "lotto",
    to: "/lotto",
    label: "로또",
    icon: "M12 2l2.7 8.2H23l-7 5.1 2.7 8.2-7-5.1-7 5.1 2.7-8.2-7-5.1h8.3z",
    end: false,
  },
  {
    id: "quant",
    to: "/quant",
    label: "Models",
    icon: "M3 3v18h18M7 16l4-8 4 4 4-6",
    end: false,
  },
  {
    id: "reports",
    to: "/reports",
    label: "Report",
    icon: "M6 3h9l3 3v15H6V3zM14 3v4h4M9 12h6M9 16h6",
    end: false,
  },
];

const ADMIN_BOTTOM_ITEM = {
  id: "admin",
  to: "/admin",
  label: "관리자",
  icon: "M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20c0-4 3.6-7 8-7s8 3 8 7",
  end: false,
};

export function BottomNav() {
  const role = getRole();
  const items = role === "ADMIN" ? [...BOTTOM_NAV_ITEMS, ADMIN_BOTTOM_ITEM] : BOTTOM_NAV_ITEMS;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex"
      style={{
        height: 56,
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {items.map(({ id, to, label, icon, end }) => (
        <NavLink
          key={id}
          to={to}
          end={end}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0"
          style={({ isActive }) => ({
            textDecoration: "none",
            color: isActive ? "var(--accent)" : "var(--text-3)",
            fontSize: 10,
            fontWeight: isActive ? 600 : 400,
            transition: "color 0.15s",
          })}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="currentColor"
          >
            <path d={icon} />
          </svg>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", padding: "0 2px" }}>
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
