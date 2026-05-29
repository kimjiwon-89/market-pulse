import { FavoriteFolderPicker } from "@/features/quant/FavoriteFolderPicker";
import { StockInitialBadge } from "@/features/quant/StockInitialBadge";
import { quantAsOf, quantDecisions } from "@/features/quant/quantMockData";
import type { QuantDecision } from "@/features/quant/quantTypes";
import { Badge, Card, CardHeader, DataTable, Inline, Mono, MutedText, PageShell, PageTitle, SectionTitle, Stack, SubText, TableCard, TableScroll } from "@/components/ui/Page";

function tone(code: QuantDecision["decisionCode"]) {
  if (code === "BUY") return "up";
  if (code === "SELL") return "down";
  if (code === "WARNING") return "warning";
  return "flat";
}

export function QuantToday() {
  return (
    <PageShell $width="1100px">
      <Card>
        <CardHeader>
          <div>
            <PageTitle>오늘의 종목</PageTitle>
            <SubText>퀀트 모델이 오늘 살펴볼 종목, 기다릴 종목, 조심할 종목을 나눠 정리했습니다.</SubText>
          </div>
          <MutedText><Mono>기준 {quantAsOf}</Mono></MutedText>
        </CardHeader>
      </Card>

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
              {quantDecisions.map((item) => (
                <tr key={item.assetCode}>
                  <td>
                    <Inline>
                      <StockInitialBadge text={item.badgeText} tone={item.badgeTone} />
                      <Stack $gap="3px">
                        <Inline $gap="6px">
                          <strong>{item.assetName}</strong>
                          <Badge $tone={tone(item.decisionCode)}>{item.decisionCode}</Badge>
                        </Inline>
                        <MutedText><Mono>{item.assetCode} · {item.market}</Mono></MutedText>
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
