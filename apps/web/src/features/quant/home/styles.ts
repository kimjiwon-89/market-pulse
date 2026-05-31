import styled, { css } from "styled-components";
import { Link } from "react-router-dom";

export const HomeShell = styled.div`
  width: 100%;
`;

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sectionGap};
`;

export const DesktopOnly = styled.div`
  display: contents;

  @media (max-width: ${({ theme }) => theme.breakpoint.desktop}) {
    display: none;
  }
`;

export const MobileOnly = styled.div`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoint.desktop}) {
    display: contents;
  }
`;

export const HomeContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) ${({ theme }) => theme.layout.rightRailWidth};
  gap: ${({ theme }) => theme.spacing.sectionGap};

  @media (max-width: ${({ theme }) => theme.breakpoint.desktop}) {
    grid-template-columns: 1fr;
  }
`;

export const HomeTopGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) ${({ theme }) => theme.layout.rightRailWidth};
  gap: ${({ theme }) => theme.spacing.sectionGap};
  align-items: stretch;

  @media (max-width: ${({ theme }) => theme.breakpoint.desktop}) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.section<{ $soft?: boolean; $flush?: boolean }>`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  padding: ${({ $flush }) => ($flush ? "0" : "20px")};
  border: 1px solid ${({ $soft, theme }) => ($soft ? theme.color.softBorder : theme.color.border)};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ $soft, theme }) => ($soft ? theme.color.softPanel : theme.color.panel)};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    padding: ${({ $flush }) => ($flush ? "0" : "20px")};
  }
`;

export const HeroSplit = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.sectionGap};

  @media (max-width: ${({ theme }) => theme.breakpoint.desktop}) {
    grid-template-columns: 1fr;
  }
`;

export const HeroSectionStack = styled.div`
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sectionGap};
  padding: 20px;
`;

export const HeroPanel = styled.div<{ $market?: boolean }>`
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  flex-direction: column;
  gap: 14px;

  ${({ $market, theme }) => $market && css`
    padding-top: ${theme.spacing.sectionGap};
    border-top: 1px solid ${theme.color.divider};
  `}

  @media (max-width: ${({ theme }) => theme.breakpoint.desktop}) {
    ${({ $market, theme }) => $market && css`
      padding-top: ${theme.spacing.sectionGap};
      padding-left: 0;
      border-top: 1px solid ${theme.color.divider};
      border-left: 0;
    `}
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    gap: 8px;

    ${({ $market }) => $market && css`
      padding-top: 10px;
    `}
  }
`;

export const HeroCopy = styled.div`
  min-height: 74px;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    min-height: auto;
  }
`;

export const HeroTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.color.text};
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    font-size: 15px;
    line-height: 1.25;
  }
`;

export const HeroDescription = styled.p`
  margin: 10px 0 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 15px;
  line-height: 1.6;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    display: -webkit-box;
    margin-top: 5px;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    font-size: 11.5px;
    line-height: 1.35;
  }
`;

export const MarketTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.color.text};
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    font-size: 15px;
    line-height: 1.25;
  }
`;

const railStyles = css`
  display: grid;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0 0 4px;
    scroll-padding-inline: 0;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    overscroll-behavior-x: contain;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const MetricRail = styled.div`
  ${railStyles}
`;

export const MarketStatusRail = styled.div`
  ${railStyles}
`;

export const MetricCard = styled.div`
  height: 112px;
  min-height: 112px;
  overflow: hidden;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.panel};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    flex: 0 0 min(168px, 42vw);
    max-width: none;
    height: auto;
    min-height: 100px;
    padding: 12px;
    overflow: visible;
    scroll-snap-align: start;
  }
`;

export const MetricLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.color.text};
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    font-size: 12px;
  }
`;

export const InfoDot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border: 1px solid ${({ theme }) => theme.color.accent};
  border-radius: ${({ theme }) => theme.radius.circle};
  color: ${({ theme }) => theme.color.accent};
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
`;

export const MetricValue = styled.div<{ $tone?: "up" | "down" | "accent" }>`
  margin-top: 10px;
  color: ${({ $tone, theme }) => {
    if ($tone === "up") return theme.color.up;
    if ($tone === "down") return theme.color.down;
    if ($tone === "accent") return theme.color.accent;
    return theme.color.text;
  }};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 22px;
  font-weight: 600;
  line-height: 1;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    margin-top: 8px;
    font-size: 20px;
    line-height: 1.15;
  }
`;

export const MetricSub = styled.div`
  margin-top: 6px;
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 11.5px;
  line-height: 1.35;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.3;
  }
`;

export const DirectionText = styled.span<{ $direction: "up" | "down" | "flat" }>`
  color: ${({ $direction, theme }) => {
    if ($direction === "up") return theme.color.up;
    if ($direction === "down") return theme.color.down;
    return theme.color.textSubtle;
  }};
`;

export const MarketStatusCard = styled.div`
  height: 112px;
  min-height: 112px;
  overflow: hidden;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.panel};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    flex: 0 0 min(168px, 42vw);
    max-width: none;
    height: auto;
    min-height: 100px;
    padding: 12px;
    overflow: visible;
    scroll-snap-align: start;
  }
`;

export const MarketStatusLink = styled(Link)`
  display: block;
  height: 112px;
  min-height: 112px;
  overflow: hidden;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.panel};
  color: inherit;
  text-decoration: none;

  &:hover {
    border-color: ${({ theme }) => theme.color.accent};
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    flex: 0 0 min(168px, 42vw);
    max-width: none;
    height: auto;
    min-height: 100px;
    padding: 12px;
    overflow: visible;
    scroll-snap-align: start;
  }
`;

export const MarketStatusLabel = styled.span`
  display: block;
  color: ${({ theme }) => theme.color.text};
  font-size: 12px;
  font-weight: 700;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    font-size: 12px;
  }
`;

export const MarketStatusValue = styled.strong`
  display: block;
  margin-top: 10px;
  color: ${({ theme }) => theme.color.accent};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.1;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    margin-top: 8px;
    font-size: 20px;
    line-height: 1.15;
  }
`;

export const MarketStatusDetail = styled.small`
  display: block;
  margin-top: 6px;
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 11.5px;
  line-height: 1.5;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.3;
  }
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.color.text};
  font-size: 16px;
  font-weight: 600;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    font-size: 15px;
  }
`;

export const SmallButton = styled.button`
  height: 30px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.panel};
  color: ${({ theme }) => theme.color.text};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    height: 28px;
    padding: 0 10px;
    font-size: 11px;
  }
`;

export const DecisionSectionCard = styled(Card)`
  overflow: visible;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    max-height: 284px;
    overflow: hidden;
  }
`;

export const DesktopTableWrap = styled.div`
  display: block;
  overflow-x: auto;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    display: none;
  }
`;

export const DecisionEmptyState = styled.div`
  padding: 8px 20px 20px;

  p {
    margin-top: 0;
  }
`;

export const DecisionTable = styled.table`
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  font-size: 13px;

  th {
    height: 36px;
    padding: 0 12px;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    background: ${({ theme }) => theme.color.hover};
    color: ${({ theme }) => theme.color.textSubtle};
    font-size: 11.5px;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
  }

  td {
    height: 44px;
    padding: 0 12px;
    border-bottom: 1px solid ${({ theme }) => theme.color.divider};
    color: ${({ theme }) => theme.color.textMuted};
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

export const FirstDecisionHeader = styled.th`
  padding-left: 20px !important;
`;

export const FirstDecisionCell = styled.td`
  padding-left: 20px !important;
`;

export const DesktopStockCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const DesktopStockName = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.color.text};
  font-weight: 700;
`;

export const DecisionStockLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;

  &:hover ${DesktopStockName} {
    color: ${({ theme }) => theme.color.accent};
  }
`;

export const MonoSub = styled.div`
  color: ${({ theme }) => theme.color.textSubtle};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 12px;
`;

export const FavoriteCell = styled.td`
  width: 56px;
  padding-right: 20px !important;
  overflow: visible;
  text-align: right;
`;

export const MobileDecisionList = styled.div`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    display: flex;
    max-height: 220px;
    flex-direction: column;
    gap: 6px;
    overflow-y: auto;
    padding: 8px 10px 12px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const SignalSectionCard = styled(Card)`
  overflow: hidden;
`;

export const QuantSignalTabs = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: calc(100% - 40px);
  padding: 4px;
  margin: 0 20px 12px;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.softPanel};
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    max-width: calc(100% - 32px);
    margin-inline: 16px;
  }
`;

export const QuantSignalTabButton = styled.button<{ $active: boolean }>`
  min-width: 74px;
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ $active, theme }) => ($active ? theme.color.accent : "transparent")};
  color: ${({ $active, theme }) => ($active ? "#fff" : theme.color.textMuted)};
  font: inherit;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 2px;
  }
`;

export const QuantSignalList = styled.div`
  display: flex;
  max-height: calc(104px * 3 + 20px);
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 0 20px 20px;
  scrollbar-width: thin;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    max-height: calc(98px * 3 + 20px);
    padding: 0 20px 20px;
  }
`;

export const QuantSignalCard = styled.div`
  min-height: 104px;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.softPanel};

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    min-height: 98px;
    padding: 12px;
  }
`;

export const QuantSignalStock = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const QuantSignalName = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: ${({ theme }) => theme.color.text};
  font-size: 15px;
  font-weight: 800;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const QuantSignalMeta = styled.div`
  margin-top: 3px;
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 12px;
  line-height: 1.25;
`;

export const QuantSignalReasonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const QuantSignalReason = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 12px;
  font-weight: 700;
`;

export const QuantSignalEmpty = styled.div`
  min-height: 104px;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px dashed ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.softPanel};
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 13px;
  font-weight: 800;
`;

export const DecisionBadge = styled.span<{ $code: string }>`
  display: inline-flex;
  align-items: center;
  height: 17px;
  padding: 0 6px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.small};
  background: ${({ theme }) => theme.color.panel};
  color: ${({ $code, theme }) => {
    if ($code === "BUY") return theme.color.up;
    if ($code === "WARNING") return theme.color.warning;
    if ($code === "SELL") return theme.color.down;
    return theme.color.textSubtle;
  }};
  font-size: 9.5px;
  font-weight: 800;
  line-height: 1;
`;

export const ModelNameText = styled.span`
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 12.5px;
  line-height: 1.5;
`;

export const MobileDecisionItem = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 28px;
  grid-template-rows: auto auto;
  align-items: center;
  min-height: 46px;
  column-gap: 8px;
  padding: 7px 10px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.panel};
`;

export const MobileBadgeSlot = styled.div`
  grid-column: 1;
  grid-row: 1 / 3;
  align-self: center;
`;

export const MobileNameLine = styled.div`
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.color.text};
  font-size: 13px;
  font-weight: 700;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MobileDecisionStockLink = styled(Link)`
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.color.text};
  font-size: 13px;
  font-weight: 700;
  line-height: 1.15;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.color.accent};
  }
`;

export const MobileModelLine = styled.div`
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
  margin-top: 2px;
  overflow: hidden;
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 11px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MobileFavoriteSlot = styled.div`
  display: flex;
  grid-column: 3;
  grid-row: 1 / 3;
  align-items: center;
  justify-content: flex-end;

  button {
    width: 24px;
    height: 24px;
    font-size: 17px;
  }
`;

export const UtilityRail = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sectionGap};
`;

export const UtilityList = styled.div<{ $maxHeight?: string }>`
  display: flex;
  max-height: ${({ $maxHeight }) => $maxHeight};
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 0 20px 20px;
`;

export const UtilityButton = styled.button`
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.panel};
  color: ${({ theme }) => theme.color.text};
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  text-align: left;
`;

export const UtilityRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.panel};
  color: ${({ theme }) => theme.color.textMuted};
  cursor: pointer;
  font-size: 13px;
  text-align: left;

  strong {
    color: ${({ theme }) => theme.color.accent};
  }
`;

export const AdCard = styled(Card)`
  display: flex;
  min-height: 180px;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  border-color: ${({ theme }) => theme.color.borderStrong};
  border-style: dashed;
  background: ${({ theme }) => theme.color.softPanel};

  ${HomeTopGrid} > & {
    min-height: 100%;
  }
`;

export const AdSlotFrame = styled.div<{ $slot: "desktop_side_top" | "mobile_inline_top" }>`
  display: ${({ $slot }) => ($slot === "desktop_side_top" ? "contents" : "none")};

  @media (max-width: ${({ theme }) => theme.breakpoint.desktop}) {
    display: ${({ $slot }) => ($slot === "mobile_inline_top" ? "contents" : "none")};
  }

  ${AdCard} {
    min-height: ${({ $slot }) => ($slot === "desktop_side_top" ? "100%" : "120px")};
  }
`;

export const AdLabel = styled.div`
  width: fit-content;
  padding: 3px 8px;
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.panel};
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
`;

export const BodyCopy = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.color.textMuted};
  line-height: 1.7;
`;

export const IntroHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${({ theme }) => theme.color.text};
  font-size: 16px;
  font-weight: 600;
`;

export const IntroLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const BrandMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: ${({ theme }) => theme.color.accent};
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
`;
