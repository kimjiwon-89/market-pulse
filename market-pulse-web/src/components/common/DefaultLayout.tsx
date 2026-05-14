import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Nav } from "./Nav";

export function DefaultLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Nav />
        <main
          style={{
            flex: 1,
            padding: "var(--pad-pg)",
            background: "var(--bg)",
            minWidth: 0,
            overflowY: "auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
