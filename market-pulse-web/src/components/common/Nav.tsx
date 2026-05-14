import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "대시보드" },
  { to: "/investor", label: "투자자 동향" },
  { to: "/net-buy", label: "순매수 순위" },
];

export function Nav() {
  return (
    <nav className="flex gap-2 px-6 py-2 border-b border-slate-100">
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${
              isActive
                ? "bg-blue-50 text-blue-600"
                : "text-slate-500 hover:bg-slate-50"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
