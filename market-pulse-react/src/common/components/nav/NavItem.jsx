import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const StyledLink = styled(Link)`
  text-decoration: none;
  color: black;
  width: 100%;
  height: 100%;
  text-align: center;
`;

function NavItem({ url, children }) {
  return (
    <>
      <StyledLink to={url}>{children}</StyledLink>
    </>
  );
}

export default NavItem;
