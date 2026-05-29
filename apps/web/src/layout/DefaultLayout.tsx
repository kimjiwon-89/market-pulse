import { Outlet } from "react-router-dom";
import styled from "styled-components";
import { Header } from "./Header";
import { Nav } from "./Nav";
import { BottomNav } from "./BottomNav";

const AppFrame = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const BodyFrame = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.page};
  padding-bottom: calc(${({ theme }) => theme.spacing.page} + ${({ theme }) => theme.layout.bottomNavHeight});
  background: ${({ theme }) => theme.color.bg};

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    padding: 16px;
    padding-bottom: calc(76px + env(safe-area-inset-bottom));
  }
`;

export function DefaultLayout() {
  return (
    <AppFrame>
      <Header />
      <BodyFrame>
        <Nav />
        <Main>
          <Outlet />
        </Main>
      </BodyFrame>
      <BottomNav />
    </AppFrame>
  );
}
