import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { FavoriteFolderPicker } from "@/features/quant/FavoriteFolderPicker";
import { StockInitialBadge } from "@/features/quant/StockInitialBadge";
import { getQuantDecisions } from "@/features/quant/api";
import type { QuantDecision } from "@/features/quant/quantTypes";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Inline,
  Mono,
  MutedText,
  PageHeaderCard,
  PageHeaderMeta,
  PageShell,
  PageTitle,
  SectionTitle,
  Stack,
  SubText,
  TableCard,
  TableScroll,
  TextLink,
} from "@/components/ui/Page";

function todayIsoKst() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function tone(code: QuantDecision["decisionCode"]) {
  if (code === "BUY") return "up";
  if (code === "HOT" || code === "ENTRY_READY" || code === "WATCH") return "up";
  if (code === "SELL") return "down";
  if (code === "WARNING" || code === "COOLDOWN") return "warning";
  return "flat";
}

export function QuantToday() {
  const today = todayIsoKst();
  const [selectedDate, setSelectedDate] = useState(today);
  const [decisions, setDecisions] = useState<QuantDecision[]>([]);
  const [asOf, setAsOf] = useState<string>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setError(false);
    const load = () => getQuantDecisions(selectedDate)
      .then((items) => {
        if (!mounted) return;
        setDecisions(items);
        setAsOf(selectedDate);
      })
      .catch(() => {
        if (!mounted) return;
        setError(true);
        setDecisions([]);
      });
    load();
    const intervalId = selectedDate === today ? window.setInterval(load, 60_000) : undefined;

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [selectedDate, today]);

  const modelCount = useMemo(
    () => new Set(decisions.flatMap((item) => item.modelNames)).size,
    [decisions],
  );

  return (
    <PageShell $width="1100px">
      <PageHeaderCard>
        <div>
          <PageTitle>오늘 추천 후보 전체</PageTitle>
          <SubText>운영 중인 모든 모델이 오늘 날짜로 새로 낸 후보만 한곳에서 봅니다.</SubText>
        </div>
        <PageHeaderMeta>
          <MutedText><Mono>기준 {asOf ?? "-"}</Mono></MutedText>
          <Badge $tone="flat">{decisions.length}개</Badge>
          <Badge $tone="flat">{modelCount}개 모델</Badge>
        </PageHeaderMeta>
      </PageHeaderCard>

      <Card $soft>
        <FilterRow>
          <Inline $wrap>
            <FilterLabel>기준일</FilterLabel>
            <DateInput
              type="date"
              value={selectedDate}
              max={today}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            <Button type="button" onClick={() => setSelectedDate(today)}>오늘</Button>
          </Inline>
          <SubText>선택한 날짜의 자동 후보만 표시합니다.</SubText>
        </FilterRow>
      </Card>

      {error ? (
        <Card $soft>
          <SubText>오늘 추천 후보를 불러오지 못했습니다. 잠시 후 다시 확인해주세요.</SubText>
        </Card>
      ) : null}

      <TableCard>
        <TableScroll>
          <DataTable>
            <thead>
              <tr>
                <th>종목</th>
                <th>추천 모델</th>
                <th>판단</th>
                <th>이유</th>
                <th>조심할 점</th>
                <th aria-label="관심" />
              </tr>
            </thead>
            <tbody>
              {decisions.map((item) => (
                <tr key={`${item.signalDate}-${item.assetCode}-${item.modelNames.join("-")}`}>
                  <td>
                    <Inline>
                      <StockInitialBadge text={item.badgeText} tone={item.badgeTone} />
                      <Stack $gap="3px">
                        <TextLink to={`/stock/${item.assetCode}`}>
                          <strong>{item.assetName}</strong>
                        </TextLink>
                        <MutedText><Mono>{[item.assetCode, item.market].filter(Boolean).join(" · ")}</Mono></MutedText>
                      </Stack>
                    </Inline>
                  </td>
                  <td>{item.modelNames.join(", ")}</td>
                  <td><Badge $tone={tone(item.decisionCode)}>{item.decisionLabel}</Badge></td>
                  <td>{item.reasonBullets.join(", ")}</td>
                  <td>{item.cautionBullets.join(", ")}</td>
                  <td>
                    <FavoriteFolderPicker assetName={item.assetName} />
                  </td>
                </tr>
              ))}
              {decisions.length === 0 ? (
                <tr>
                  <td colSpan={6}>오늘 날짜로 새로 발생한 추천 후보가 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </DataTable>
        </TableScroll>
      </TableCard>

      <Card $soft>
        <SectionTitle>읽는 법</SectionTitle>
        <SubText>여러 모델이 같은 종목을 추천할 수 있습니다. 후보는 매수 지시가 아니라 오늘 살펴볼 종목 목록이며, 자동 매매나 수익 보장을 의미하지 않습니다.</SubText>
      </Card>
    </PageShell>
  );
}

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const FilterLabel = styled.span`
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 12px;
  font-weight: 800;
`;

const DateInput = styled.input`
  height: 34px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  padding: 0 10px;
  color: ${({ theme }) => theme.color.text};
  background: ${({ theme }) => theme.color.input};
  font: inherit;
`;
