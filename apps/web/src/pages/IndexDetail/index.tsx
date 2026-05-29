import { useParams } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { mockIndices, mockStocks } from "@/features/mock/marketMockData";
import { Card, ChartBox, DataTable, Mono, PageShell, PageTitle, SectionTitle, SubText, TableCard, TableScroll, TextLink, ValueText } from "@/components/ui/Page";

export function IndexDetail() {
  const { id } = useParams();
  const index = mockIndices.find((item) => item.code === id) ?? mockIndices[0];

  return (
    <PageShell $width="1000px">
      <Card>
        <TextLink to="/market">시장 보기</TextLink>
        <PageTitle>{index.name}</PageTitle>
        <ValueText $tone={index.changeRate >= 0 ? "up" : "down"}>
          {index.value.toLocaleString("ko-KR")} · {index.changeRate}%
        </ValueText>
      </Card>
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
      <TableCard>
        <SectionTitle>관련 주요 종목</SectionTitle>
        <SubText>지수 흐름과 같이 확인할 대표 종목입니다.</SubText>
        <TableScroll>
          <DataTable>
            <tbody>
              {mockStocks.slice(0, 4).map((stock) => (
                <tr key={stock.code}>
                  <td>{stock.name}<br /><Mono>{stock.code}</Mono></td>
                  <td>{stock.sector}</td>
                  <td className="num">{stock.changeRate}%</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </TableScroll>
      </TableCard>
    </PageShell>
  );
}
