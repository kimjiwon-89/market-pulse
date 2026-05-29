import type { StockBadgeTone } from "./quantTypes";
import styled from "styled-components";

const toneMap: Record<StockBadgeTone, string> = {
  red: "#dc2f45",
  blue: "#2f77df",
  navy: "#315f93",
  purple: "#6548c7",
  black: "#18181b",
};

interface StockInitialBadgeProps {
  text: string;
  tone: StockBadgeTone;
  size?: number;
}

export function StockInitialBadge({ text, tone, size = 32 }: StockInitialBadgeProps) {
  return (
    <Badge
      aria-hidden="true"
      $color={toneMap[tone]}
      $size={size}
    >
      {text}
    </Badge>
  );
}

const Badge = styled.span<{ $color: string; $size: number }>`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ $color }) => $color};
  color: #ffffff;
  font-size: ${({ $size }) => ($size <= 32 ? 11 : 12)}px;
  font-weight: 800;
  letter-spacing: 0;
`;
