import React from "react";
import Header from "../components/header/Header";
import Nav from "../components/nav/Nav";
import Footer from "../components/footer/Footer";
import { Outlet } from "react-router-dom";
import { styled } from "styled-components";
import BuyingList from "../../features/buyingList/BuyingList";

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: 1fr 0.5fr 7.5fr 1fr;
  grid-template-columns: 1fr;
`;

function DefaultLayout() {
  return (
    <Wrapper>
      <Header></Header>
      <Nav></Nav>
      <main>
        <Outlet />
        <BuyingList />
      </main>
      <Footer></Footer>
    </Wrapper>
  );
}

export default DefaultLayout;
