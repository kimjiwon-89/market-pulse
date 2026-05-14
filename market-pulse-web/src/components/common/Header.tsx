import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="px-6 py-4 border-b border-slate-100">
      <h1 className="text-xl font-bold">
        <Link to="/" className="no-underline text-slate-900">
          Market Pulse
        </Link>
      </h1>
    </header>
  );
}
