import { useState } from "react";
import styled from "styled-components";

interface StockLogoProps {
  code: string;
  name: string;
  size?: number;
}

export function StockLogo({ code, name, size = 44 }: StockLogoProps) {
  const [hasImage, setHasImage] = useState(true);
  const logoSrc = `/stock-logos/${encodeURIComponent(code)}.svg`;

  return (
    <LogoFrame $size={size}>
      {hasImage ? (
        <LogoImage
          src={logoSrc}
          aria-label={`${name} 로고`}
          onError={() => setHasImage(false)}
        />
      ) : (
        <LogoFallback>{name.slice(0, 1)}</LogoFallback>
      )}
    </LogoFrame>
  );
}

const LogoFrame = styled.div<{ $size: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 ${({ $size }) => $size}px;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  overflow: hidden;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.hover};
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const LogoFallback = styled.span`
  color: ${({ theme }) => theme.color.accent};
  font-size: 18px;
  font-weight: 900;
`;
