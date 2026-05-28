import { NavLink } from "react-router-dom";

const BOTTOM_NAV_ITEMS = [
  {
    id: "market",
    to: "/market",
    label: "시장",
    icon: "M3 21h18M5 21V8l7-4 7 4v13M9 21v-7h6v7",
    end: false,
  },
  {
    id: "quant",
    to: "/quant",
    label: "모델",
    icon: "M3 3v18h18M7 16l4-8 4 4 4-6",
    end: false,
  },
  {
    id: "home",
    to: "/",
    label: "홈",
    icon: "M3 12 12 4l9 8M5 11v9h5v-6h4v6h5v-9",
    end: true,
  },
  {
    id: "services",
    to: "/services",
    label: "서비스",
    icon: "M12 2l2.7 8.2H23l-7 5.1 2.7 8.2-7-5.1-7 5.1 2.7-8.2-7-5.1h8.3z",
    end: false,
  },
  {
    id: "my",
    to: "/my",
    label: "마이",
    icon: "M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20c0-4 3.6-7 8-7s8 3 8 7",
    end: false,
  },
];

export function BottomNav() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex"
      style={{
        height: 56,
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {BOTTOM_NAV_ITEMS.map(({ id, to, label, icon, end }) => (
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
