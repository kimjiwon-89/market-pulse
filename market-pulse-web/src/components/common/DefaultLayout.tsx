import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function DefaultLayout() {
  return (
    <div className="grid grid-rows-[auto_auto_1fr_auto] min-h-screen">
      <Header />
      <Nav />
      <main className="p-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
