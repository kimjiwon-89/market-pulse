import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const StyledLink = styled(Link)`
  text-decoration: none;
  color: black;
`;

function Header() {
  return (
    <>
      <h1>
        <StyledLink to="/">Header</StyledLink>
      </h1>
    </>
  );
}

export default Header;
