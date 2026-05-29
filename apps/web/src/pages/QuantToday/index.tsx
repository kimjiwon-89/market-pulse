import { useEffect, useState } from "react";
import { FavoriteFolderPicker } from "@/features/quant/FavoriteFolderPicker";
import { StockInitialBadge } from "@/features/quant/StockInitialBadge";
import { getBullQuantDecisions, getQuantHomeSummary } from "@/features/quant/api";
import type { QuantDecision } from "@/features/quant/quantTypes";
import { Badge, Card, DataTable, Inline, Mono, MutedText, PageHeaderCard, PageHeaderMeta, PageShell, PageTitle, SectionTitle, Stack, SubText, TableCard, TableScroll } from "@/components/ui/Page";

function tone(code: QuantDecision["decisionCode"]) {
  if (code === "BUY") return "up";
  if (code === "SELL") return "down";
  if (code === "WARNING") return "warning";
  return "flat";
}

export function QuantToday() {
  const [decisions, setDecisions] = useState<QuantDecision[]>([]);
  const [asOf, setAsOf] = useState<string>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getBullQuantDecisions(), getQuantHomeSummary()])
      .then(([items, summary]) => {
        if (!mounted) return;
        setDecisions(items);
        setAsOf(summary.asOf);
      })
      .catch(() => {
        if (!mounted) return;
        setError(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageShell $width="1100px">
      <PageHeaderCard>
        <PageTitle>오늘의 종목</PageTitle>
        <PageHeaderMeta>
          <MutedText><Mono>기준 {asOf ?? "-"}</Mono></MutedText>
        </PageHeaderMeta>
      </PageHeaderCard>

      {error ? (
        <Card $soft>
          <SubText>실제 Bull v4 후보 종목을 불러오지 못했습니다.</SubText>
        </Card>
      ) : null}

      <TableCard>
        <TableScroll>
          <DataTable>
            <thead>
              <tr>
                <th>종목</th>
                <th>신호 모델</th>
                <th>이유</th>
                <th>조심할 점</th>
                <th aria-label="관심" />
              </tr>
            </thead>
            <tbody>
              {decisions.map((item) => (
                <tr key={item.assetCode}>
                  <td>
                    <Inline>
                      <StockInitialBadge text={item.badgeText} tone={item.badgeTone} />
                      <Stack $gap="3px">
                        <Inline $gap="6px">
                          <strong>{item.assetName}</strong>
                          <Badge $tone={tone(item.decisionCode)}>{item.decisionCode}</Badge>
                        </Inline>
                        <MutedText><Mono>{[item.assetCode, item.market].filter(Boolean).join(" · ")}</Mono></MutedText>
                      </Stack>
                    </Inline>
                  </td>
                  <td>{item.modelNames.join(", ")}</td>
                  <td>{item.reasonBullets.join(", ")}</td>
                  <td>{item.cautionBullets.join(", ")}</td>
                  <td>
                    <FavoriteFolderPicker assetName={item.assetName} />
                  </td>
                </tr>
              ))}
              {decisions.length === 0 ? (
                <tr>
                  <td colSpan={5}>현재 Bull v4 후보 종목이 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </DataTable>
        </TableScroll>
      </TableCard>

      <Card $soft>
        <SectionTitle>읽는 법</SectionTitle>
        <SubText>BUY는 살펴볼 종목, SIDE는 기다릴 종목, WARNING은 조심할 종목입니다. 자동 매매나 수익 보장을 의미하지 않습니다.</SubText>
      </Card>
    </PageShell>
  );
}
