import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { Card, Inline, Mono, PageHeaderCard, PageShell, PageTitle, SubText } from "@/components/ui/Page";
import { getInvestorTradeTop, getLastFridayBasicDate } from "@/features/market/api";
import type { InvestorTradeTopItem, InvestorTradeType, InvestorType } from "@/features/market/api";

type MarketFilter = "ALL" | "KOSPI" | "KOSDAQ";

interface DateRecord {
  items: InvestorTradeTopItem[];
  loading: boolean;
  error: boolean;
}

interface SummaryItem extends InvestorTradeTopItem {
  amount: number;
  volume: number;
}

export function NetBuyingList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDate = normalizeBasicDate(searchParams.get("date")) ?? getLastFridayBasicDate();
  const initialRange = useMemo(() => getWeekBounds(initialDate), [initialDate]);
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [investorType, setInvestorType] = useState<InvestorType>(normalizeInvestor(searchParams.get("investorType")));
  const [tradeType, setTradeType] = useState<InvestorTradeType>(normalizeTrade(searchParams.get("tradeType")));
  const [market, setMarket] = useState<MarketFilter>(normalizeMarket(searchParams.get("market")));
  const [records, setRecords] = useState<Map<string, DateRecord>>(new Map());
  const visibleDates = useMemo(() => getWeekdays(startDate, endDate), [startDate, endDate]);
  const titleLabel = `${investorLabel(investorType)} ${tradeLabel(tradeType)}`;
  const rangeLabel = `${formatDisplayDate(startDate)} ~ ${formatDisplayDate(endDate)}`;

  useEffect(() => {
    let active = true;
    const nextRecords = new Map<string, DateRecord>();
    visibleDates.forEach((date) => {
      nextRecords.set(date, { items: [], loading: true, error: false });
    });
    setRecords(nextRecords);

    Promise.all(
      visibleDates.map(async (date) => {
        try {
          const items = await getInvestorTradeTop({ date, investorType, tradeType, market, limit: 20 });
          return [date, { items, loading: false, error: false }] as [string, DateRecord];
        } catch {
          return [date, { items: [], loading: false, error: true }] as [string, DateRecord];
        }
      }),
    ).then((entries) => {
      if (!active) return;
      setRecords(new Map(entries));
    });

    return () => {
      active = false;
    };
  }, [visibleDates, investorType, tradeType, market]);

  const summaryItems = useMemo(() => calcRangeTotal(records, visibleDates), [records, visibleDates]);
  const hasLoading = visibleDates.some((date) => records.get(date)?.loading);
  const hasError = visibleDates.some((date) => records.get(date)?.error);

  const updateQuery = (next: {
    start?: string;
    end?: string;
    investorType?: InvestorType;
    tradeType?: InvestorTradeType;
    market?: MarketFilter;
  }) => {
    const nextEnd = next.end ?? endDate;
    setSearchParams({
      date: nextEnd,
      investorType: next.investorType ?? investorType,
      tradeType: next.tradeType ?? tradeType,
      market: next.market ?? market,
    });
  };

  const applyRange = (start: string, end: string) => {
    const normalizedStart = normalizeBasicDate(start) ?? startDate;
    const normalizedEnd = normalizeBasicDate(end) ?? endDate;
    if (normalizedStart > normalizedEnd) {
      setStartDate(normalizedEnd);
      setEndDate(normalizedStart);
      updateQuery({ start: normalizedEnd, end: normalizedStart });
      return;
    }
    setStartDate(normalizedStart);
    setEndDate(normalizedEnd);
    updateQuery({ start: normalizedStart, end: normalizedEnd });
  };

  const moveWeek = (offset: number) => {
    const base = addDays(toDate(startDate), offset * 7);
    const next = getWeekBounds(formatBasicDate(base));
    applyRange(next.start, next.end);
  };

  const applyTodayWeek = () => {
    const next = getWeekBounds(getLastFridayBasicDate());
    applyRange(next.start, next.end);
  };

  const applyInvestor = (value: InvestorType) => {
    setInvestorType(value);
    updateQuery({ investorType: value });
  };

  const applyTrade = (value: InvestorTradeType) => {
    setTradeType(value);
    updateQuery({ tradeType: value });
  };

  const applyMarket = (value: MarketFilter) => {
    setMarket(value);
    updateQuery({ market: value });
  };

  return (
    <PageShell $width="1180px">
      <PageHeaderCard>
        <div>
          <PageTitle>순매수도</PageTitle>
          <SubText>{rangeLabel} · {titleLabel} · {marketLabel(market)}</SubText>
        </div>
      </PageHeaderCard>

      <FilterCard>
        <ControlRow>
          <DateControl>
            <label htmlFor="net-buy-start">시작일</label>
            <DateInput
              id="net-buy-start"
              type="date"
              value={toInputDate(startDate)}
              onChange={(event) => applyRange(fromInputDate(event.currentTarget.value), endDate)}
            />
          </DateControl>
          <DateControl>
            <label htmlFor="net-buy-end">종료일</label>
            <DateInput
              id="net-buy-end"
              type="date"
              value={toInputDate(endDate)}
              onChange={(event) => applyRange(startDate, fromInputDate(event.currentTarget.value))}
            />
          </DateControl>
          <Inline $gap="6px" $wrap>
            <SmallButton type="button" onClick={() => moveWeek(-1)}>이전주</SmallButton>
            <SmallButton type="button" onClick={applyTodayWeek}>오늘</SmallButton>
            <SmallButton type="button" onClick={() => moveWeek(1)}>다음주</SmallButton>
          </Inline>
        </ControlRow>

        <ControlRow>
          <FilterGroup aria-label="투자자 필터">
            <FilterButton type="button" $active={investorType === "FOREIGN"} onClick={() => applyInvestor("FOREIGN")}>외국인</FilterButton>
            <FilterButton type="button" $active={investorType === "INSTITUTION"} onClick={() => applyInvestor("INSTITUTION")}>기관</FilterButton>
            <FilterButton type="button" $active={investorType === "ALL"} onClick={() => applyInvestor("ALL")}>전체</FilterButton>
          </FilterGroup>
          <FilterGroup aria-label="매매 필터">
            <FilterButton type="button" $active={tradeType === "BUY"} onClick={() => applyTrade("BUY")}>순매수</FilterButton>
            <FilterButton type="button" $active={tradeType === "SELL"} onClick={() => applyTrade("SELL")}>순매도</FilterButton>
          </FilterGroup>
          <FilterGroup aria-label="시장 필터">
            <FilterButton type="button" $active={market === "ALL"} onClick={() => applyMarket("ALL")}>전체</FilterButton>
            <FilterButton type="button" $active={market === "KOSPI"} onClick={() => applyMarket("KOSPI")}>KOSPI</FilterButton>
            <FilterButton type="button" $active={market === "KOSDAQ"} onClick={() => applyMarket("KOSDAQ")}>KOSDAQ</FilterButton>
          </FilterGroup>
        </ControlRow>
      </FilterCard>

      <MatrixCard>
        <TableMeta>
          <strong>{titleLabel} TOP20</strong>
          <span>{hasLoading ? "데이터 조회 중" : hasError ? "일부 날짜 조회 실패" : `${visibleDates.length}거래일 조회`}</span>
        </TableMeta>
        <MatrixScroll>
          <MatrixTable>
            <thead>
              <tr>
                <StickyHead rowSpan={3}>순위</StickyHead>
                {visibleDates.map((date) => (
                  <DateHead key={date} colSpan={3}>{formatDisplayDate(date)}</DateHead>
                ))}
                <SummaryHead colSpan={3}>합계</SummaryHead>
              </tr>
              <tr>
                {visibleDates.map((date) => (
                  <DateHead key={`${date}-type`} colSpan={3}>{tradeLabel(tradeType)}</DateHead>
                ))}
                <SummaryHead colSpan={3}>기간 합산</SummaryHead>
              </tr>
              <tr>
                {visibleDates.map((date) => (
                  <HeaderSet key={`${date}-fields`} />
                ))}
                <SummaryFieldHead>종목명</SummaryFieldHead>
                <SummaryFieldHead>대금(억)</SummaryFieldHead>
                <SummaryFieldHead>수량(만주)</SummaryFieldHead>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }, (_, index) => {
                const summary = summaryItems[index];
                return (
                  <tr key={index}>
                    <StickyCell><RankText>{index + 1}</RankText></StickyCell>
                    {visibleDates.map((date) => (
                      <StockCells
                        key={`${date}-${index}`}
                        item={records.get(date)?.items[index]}
                        loading={records.get(date)?.loading ?? false}
                        error={records.get(date)?.error ?? false}
                      />
                    ))}
                    <SummaryCell>
                      {summary ? <StockName item={summary} /> : <MutedDash>-</MutedDash>}
                    </SummaryCell>
                    <SummaryNumber>{summary ? formatAmountEok(summary.amount) : "-"}</SummaryNumber>
                    <SummaryNumber>{summary ? formatVolumeMan(summary.volume) : "-"}</SummaryNumber>
                  </tr>
                );
              })}
            </tbody>
          </MatrixTable>
        </MatrixScroll>
      </MatrixCard>
    </PageShell>
  );
}

function HeaderSet() {
  return (
    <>
      <th>종목명</th>
      <th>대금(억)</th>
      <th>수량(만주)</th>
    </>
  );
}

function StockCells({ item, loading, error }: { item?: InvestorTradeTopItem; loading: boolean; error: boolean }) {
  if (loading) {
    return (
      <>
        <td><MutedDash>조회중</MutedDash></td>
        <NumberCell>-</NumberCell>
        <NumberCell>-</NumberCell>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <td><MutedDash>-</MutedDash></td>
        <NumberCell>-</NumberCell>
        <NumberCell>-</NumberCell>
      </>
    );
  }

  return (
    <>
      <td><StockName item={item} /></td>
      <NumberCell>{formatAmountEok(item.amount)}</NumberCell>
      <NumberCell>{formatVolumeMan(item.volume)}</NumberCell>
    </>
  );
}

function StockName({ item }: { item: Pick<InvestorTradeTopItem, "code" | "name" | "changeRate"> }) {
  return (
    <NameBlock>
      <strong>{item.name}</strong>
      <span>
        <Mono>{item.code}</Mono>
        <ChangeRate $tone={item.changeRate > 0 ? "up" : item.changeRate < 0 ? "down" : "flat"}>
          {formatChangeRate(item.changeRate)}
        </ChangeRate>
      </span>
    </NameBlock>
  );
}

function calcRangeTotal(records: Map<string, DateRecord>, dates: string[]): SummaryItem[] {
  const byCode = new Map<string, SummaryItem>();
  dates.forEach((date) => {
    const record = records.get(date);
    record?.items.forEach((item) => {
      const current = byCode.get(item.code);
      if (current) {
        current.amount += item.amount;
        current.volume += item.volume;
        current.currentPrice = item.currentPrice;
        current.changeRate = item.changeRate;
        return;
      }
      byCode.set(item.code, { ...item });
    });
  });

  return [...byCode.values()]
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 20)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function normalizeInvestor(value: string | null): InvestorType {
  if (value === "INSTITUTION" || value === "ALL") return value;
  return "FOREIGN";
}

function normalizeTrade(value: string | null): InvestorTradeType {
  return value === "SELL" ? "SELL" : "BUY";
}

function normalizeMarket(value: string | null): MarketFilter {
  if (value === "KOSPI" || value === "KOSDAQ") return value;
  return "ALL";
}

function investorLabel(value: InvestorType) {
  if (value === "INSTITUTION") return "기관";
  if (value === "ALL") return "전체";
  return "외국인";
}

function tradeLabel(value: InvestorTradeType) {
  return value === "SELL" ? "순매도" : "순매수";
}

function marketLabel(value: MarketFilter) {
  if (value === "KOSPI") return "KOSPI";
  if (value === "KOSDAQ") return "KOSDAQ";
  return "전체 시장";
}

function normalizeBasicDate(value: string | null) {
  if (!value) return undefined;
  const basic = value.replace(/-/g, "");
  return /^\d{8}$/.test(basic) ? basic : undefined;
}

function getWeekBounds(value: string) {
  const date = toDate(value);
  const day = date.getDay();
  const monday = addDays(date, day === 0 ? -6 : 1 - day);
  const friday = addDays(monday, 4);
  return {
    start: formatBasicDate(monday),
    end: formatBasicDate(friday),
  };
}

function getWeekdays(start: string, end: string) {
  const dates: string[] = [];
  let cursor = toDate(start);
  const last = toDate(end);
  while (cursor <= last) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) {
      dates.push(formatBasicDate(cursor));
    }
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function toDate(value: string) {
  return new Date(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)));
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatBasicDate(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function toInputDate(value: string) {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function fromInputDate(value: string) {
  return value.replace(/-/g, "");
}

function formatDisplayDate(value: string) {
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

function formatAmountEok(value: number) {
  const eok = value / 100000000;
  return eok >= 100 ? Math.round(eok).toLocaleString("ko-KR") : eok.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

function formatVolumeMan(value: number) {
  return (value / 10000).toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

function formatChangeRate(value: number) {
  if (!Number.isFinite(value)) return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

const FilterCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const DateControl = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;

  label {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    font-weight: 800;
  }
`;

const DateInput = styled.input`
  height: 34px;
  min-width: 142px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.small};
  background: ${({ theme }) => theme.color.softPanel};
  color: ${({ theme }) => theme.color.text};
  padding: 0 10px;
  font: inherit;
  font-size: 13px;
`;

const SmallButton = styled.button`
  height: 34px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.small};
  background: ${({ theme }) => theme.color.softPanel};
  color: ${({ theme }) => theme.color.text};
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
`;

const FilterGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.color.softPanel};
`;

const FilterButton = styled.button<{ $active: boolean }>`
  min-width: 64px;
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: ${({ $active, theme }) => ($active ? theme.color.accent : "transparent")};
  color: ${({ $active, theme }) => ($active ? "#fff" : theme.color.text)};
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
`;

const MatrixCard = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const TableMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};

  span {
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    font-weight: 800;
  }
`;

const MatrixScroll = styled.div`
  max-height: 680px;
  overflow: auto;
`;

const MatrixTable = styled.table`
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  color: ${({ theme }) => theme.color.text};
  font-size: 13px;

  th,
  td {
    min-width: 96px;
    padding: 10px 12px;
    border-right: 1px solid ${({ theme }) => theme.color.border};
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    background: ${({ theme }) => theme.color.panel};
    vertical-align: middle;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 5;
    background: ${({ theme }) => theme.color.softPanel};
    color: ${({ theme }) => theme.color.textMuted};
    font-weight: 900;
    text-align: center;
    white-space: nowrap;
  }

  thead tr:nth-child(2) th {
    top: 41px;
  }

  thead tr:nth-child(3) th {
    top: 82px;
  }

  tbody tr:hover td {
    background: ${({ theme }) => theme.color.hover};
  }
`;

const StickyHead = styled.th`
  && {
    left: 0;
    z-index: 8;
    min-width: 62px;
  }
`;

const DateHead = styled.th`
  && {
    min-width: 288px;
  }
`;

const SummaryHead = styled.th`
  && {
    right: 0;
    z-index: 7;
    min-width: 300px;
    background: ${({ theme }) => theme.color.softPanel};
    color: ${({ theme }) => theme.color.text};
  }
`;

const SummaryFieldHead = styled.th`
  && {
    position: sticky;
    z-index: 7;
    background: ${({ theme }) => theme.color.softPanel};

    &:nth-last-child(3) {
      right: 192px;
      min-width: 132px;
    }

    &:nth-last-child(2) {
      right: 96px;
    }

    &:last-child {
      right: 0;
    }
  }
`;

const StickyCell = styled.td`
  && {
    position: sticky;
    left: 0;
    z-index: 4;
    min-width: 62px;
    text-align: center;
    background: ${({ theme }) => theme.color.panel};
  }
`;

const NumberCell = styled.td`
  text-align: right;
  font-family: ${({ theme }) => theme.font.mono};
`;

const SummaryCell = styled.td`
  && {
    position: sticky;
    right: 192px;
    z-index: 3;
    min-width: 132px;
    background: ${({ theme }) => theme.color.panel};
  }
`;

const SummaryNumber = styled(NumberCell)`
  && {
    position: sticky;
    z-index: 3;
    background: ${({ theme }) => theme.color.panel};

    &:nth-last-child(2) {
      right: 96px;
    }

    &:last-child {
      right: 0;
    }
  }
`;

const NameBlock = styled.div`
  display: grid;
  gap: 4px;
  min-width: 108px;

  strong {
    font-size: 13px;
    line-height: 1.35;
    word-break: keep-all;
  }

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 11px;
  }
`;

const RankText = styled.span`
  color: ${({ theme }) => theme.color.textMuted};
  font-family: ${({ theme }) => theme.font.mono};
  font-weight: 900;
`;

const MutedDash = styled.span`
  color: ${({ theme }) => theme.color.textSubtle};
`;

const ChangeRate = styled.span<{ $tone: "up" | "down" | "flat" }>`
  color: ${({ $tone, theme }) => {
    if ($tone === "up") return theme.color.up;
    if ($tone === "down") return theme.color.down;
    return theme.color.textMuted;
  }};
  font-family: ${({ theme }) => theme.font.mono};
  font-weight: 900;
`;
