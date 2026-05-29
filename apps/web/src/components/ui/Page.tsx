import { Link } from "react-router-dom";
import styled, { css } from "styled-components";

export const PageShell = styled.div<{ $width?: string }>`
  width: 100%;
  max-width: ${({ $width }) => $width ?? "1120px"};
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sectionGap};
`;

export const Stack = styled.div<{ $gap?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap, theme }) => $gap ?? theme.spacing.sectionGap};
`;

export const Inline = styled.div<{ $align?: string; $justify?: string; $gap?: string; $wrap?: boolean }>`
  display: flex;
  align-items: ${({ $align }) => $align ?? "center"};
  justify-content: ${({ $justify }) => $justify ?? "flex-start"};
  gap: ${({ $gap }) => $gap ?? "12px"};
  flex-wrap: ${({ $wrap }) => ($wrap ? "wrap" : "nowrap")};
`;

export const Grid = styled.div<{ $columns?: string; $gap?: string }>`
  display: grid;
  grid-template-columns: ${({ $columns }) => $columns ?? "repeat(3, minmax(0, 1fr))"};
  gap: ${({ $gap, theme }) => $gap ?? theme.spacing.sectionGap};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.section<{ $soft?: boolean; $pad?: string }>`
  background: ${({ $soft, theme }) => ($soft ? theme.color.softPanel : theme.color.panel)};
  border: 1px solid ${({ $soft, theme }) => ($soft ? theme.color.softBorder : theme.color.border)};
  border-radius: ${({ theme }) => theme.radius.card};
  padding: ${({ $pad, theme }) => $pad ?? theme.spacing.card};
`;

export const PageHeaderCard = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 58px;
  padding: 14px 18px;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    align-items: flex-start;
    padding: 14px 16px;
  }
`;

export const PageHeaderMeta = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
`;

export const ClickCard = styled.button`
  display: block;
  width: 100%;
  min-height: 100%;
  padding: ${({ theme }) => theme.spacing.card};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.panel};
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.color.accentBorder};
    background: ${({ theme }) => theme.color.accentSoft};
  }
`;

export const CardLink = styled(Link)`
  display: block;
  min-height: 100%;
  padding: ${({ theme }) => theme.spacing.card};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.panel};
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.color.accentBorder};
    background: ${({ theme }) => theme.color.accentSoft};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    flex-direction: column;
  }
`;

export const PageTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.color.text};
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.color.text};
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
`;

export const SubText = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 13px;
  line-height: 1.7;
`;

export const MutedText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 12px;
  line-height: 1.6;
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
`;

export const ValueText = styled.div<{ $tone?: "up" | "down" | "warning" | "flat" }>`
  margin-top: 10px;
  color: ${({ $tone, theme }) => {
    if ($tone === "up") return theme.color.up;
    if ($tone === "down") return theme.color.down;
    if ($tone === "warning") return theme.color.warning;
    return theme.color.text;
  }};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Chip = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.color.accent : theme.color.border)};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ $active, theme }) => ($active ? theme.color.accent : theme.color.hover)};
  color: ${({ $active, theme }) => ($active ? "#fff" : theme.color.textMuted)};
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  white-space: nowrap;
`;

export const Badge = styled.span<{ $tone?: "up" | "down" | "warning" | "accent" | "flat" }>`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: ${({ theme }) => theme.radius.small};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.hover};
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;

  ${({ $tone, theme }) =>
    $tone === "up" &&
    css`
      background: ${theme.color.hover};
      color: ${theme.color.up};
      border-color: ${theme.color.border};
    `}

  ${({ $tone, theme }) =>
    $tone === "down" &&
    css`
      background: ${theme.color.hover};
      color: ${theme.color.down};
      border-color: ${theme.color.border};
    `}

  ${({ $tone, theme }) =>
    $tone === "warning" &&
    css`
      background: ${theme.color.hover};
      color: ${theme.color.warning};
      border-color: ${theme.color.border};
    `}

  ${({ $tone, theme }) =>
    $tone === "accent" &&
    css`
      background: ${theme.color.accentSoft};
      color: ${theme.color.accent};
      border-color: ${theme.color.accentBorder};
    `}
`;

export const Button = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid ${({ $primary, theme }) => ($primary ? theme.color.accent : theme.color.border)};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ $primary, theme }) => ($primary ? theme.color.accent : theme.color.panel)};
  color: ${({ $primary, theme }) => ($primary ? "#fff" : theme.color.text)};
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: ${({ $primary, theme }) => ($primary ? theme.color.accent : theme.color.hover)};
  }
`;

export const TextLink = styled(Link)`
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 12px;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.color.accent};
  }
`;

export const TableCard = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

export const TableScroll = styled.div`
  overflow-x: auto;
`;

export const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    height: 38px;
    padding: 0 14px;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    background: ${({ theme }) => theme.color.hover};
    color: ${({ theme }) => theme.color.textSubtle};
    font-size: 11px;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
  }

  td {
    min-height: 46px;
    padding: 12px 14px;
    border-bottom: 1px solid ${({ theme }) => theme.color.divider};
    color: ${({ theme }) => theme.color.textMuted};
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  .num {
    text-align: right;
    font-family: ${({ theme }) => theme.font.mono};
  }
`;

export const RowButton = styled.tr`
  cursor: pointer;

  &:hover td {
    background: ${({ theme }) => theme.color.hover};
  }
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ListItem = styled.div`
  padding: 14px 0;
  border-bottom: 1px solid ${({ theme }) => theme.color.divider};

  &:last-child {
    border-bottom: 0;
  }
`;

export const Split = styled.div<{ $right?: string }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) ${({ $right }) => $right ?? "320px"};
  gap: ${({ theme }) => theme.spacing.sectionGap};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
  }
`;

export const Gate = styled.div`
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
`;

export const ChartBox = styled.div<{ $height?: string }>`
  height: ${({ $height }) => $height ?? "260px"};
  margin-top: 16px;
`;
