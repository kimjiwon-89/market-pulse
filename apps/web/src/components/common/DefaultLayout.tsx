import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Nav } from "./Nav";
import { BottomNav } from "./BottomNav";

export function DefaultLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Nav />
        <main
          className="flex-1 min-w-0 overflow-y-auto pb-24 lg:pb-0"
          style={{
            paddingTop: "var(--pad-pg)",
            paddingLeft: "var(--pad-pg)",
            paddingRight: "var(--pad-pg)",
            background: "var(--bg)",
          }}
        >
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
