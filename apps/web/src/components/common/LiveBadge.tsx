import styled from "styled-components";

interface LiveBadgeProps {
  size?: number;
}

const LiveWrap = styled.span<{ $size: number }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.color.up};
  font-size: ${({ $size }) => $size}px;
  font-weight: 700;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: ${({ theme }) => theme.color.up};
`;

export function LiveBadge({ size = 11 }: LiveBadgeProps) {
  return (
    <LiveWrap $size={size}>
      <Dot />
      실시간
    </LiveWrap>
  );
}
