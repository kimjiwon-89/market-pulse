import { useNavigate, useParams } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import styled from "styled-components";
import { mockIndices, mockStocks } from "@/features/mock/marketMockData";
import { Badge, Card, ChartBox, DataTable, Mono, PageHeaderCard, PageHeaderMeta, PageShell, PageTitle, RowButton, SectionTitle, SubText, TableScroll, TextLink } from "@/components/ui/Page";

export function IndexDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const index = mockIndices.find((item) => item.code === id) ?? mockIndices[0];

  return (
    <PageShell $width="1000px">
      <PageHeaderCard>
        <PageTitle>{index.name}</PageTitle>
        <PageHeaderMeta>
          <TextLink to="/market">시장 보기</TextLink>
          <Badge>{index.value.toLocaleString("ko-KR")}</Badge>
          <Badge $tone={index.changeRate >= 0 ? "up" : "down"}>{index.changeRate}%</Badge>
        </PageHeaderMeta>
      </PageHeaderCard>
      <Card>
        <SectionTitle>흐름</SectionTitle>
        <ChartBox $height="280px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={index.trend.map((value, day) => ({ day: `${day + 1}`, value }))}>
              <XAxis dataKey="day" />
              <YAxis domain={["dataMin - 20", "dataMax + 20"]} />
              <Tooltip />
              <Line dataKey="value" stroke={index.changeRate >= 0 ? "#d62828" : "#1e5edb"} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </Card>
      <RelatedStocksCard>
        <RelatedHeader>
          <SectionTitle>관련 주요 종목</SectionTitle>
          <SubText>지수 흐름과 같이 확인할 대표 종목입니다.</SubText>
        </RelatedHeader>
        <TableScroll>
          <DataTable>
            <tbody>
              {mockStocks.slice(0, 4).map((stock) => (
                <RowButton key={stock.code} onClick={() => navigate(`/stock/${stock.code}`)}>
                  <td>{stock.name}<br /><Mono>{stock.code}</Mono></td>
                  <td>{stock.sector}</td>
                  <td className="num">{stock.changeRate}%</td>
                </RowButton>
              ))}
            </tbody>
          </DataTable>
        </TableScroll>
      </RelatedStocksCard>
    </PageShell>
  );
}

const RelatedStocksCard = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const RelatedHeader = styled.div`
  padding: 18px 20px 10px;
`;
