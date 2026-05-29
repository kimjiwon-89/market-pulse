import { Badge, Card, CardHeader, DataTable, Grid, PageShell, PageTitle, SectionTitle, SubText, TableCard, TableScroll } from "@/components/ui/Page";

const ops = [
  ["데이터 수집", "장중 시세, 지수, 수급 데이터 수집 상태", "정상"],
  ["모델 실행", "일별 모델 계산과 리포트 생성", "정상"],
  ["검증 기록", "백테스트, evidence, 관리자용 성과 점검", "관리자"],
];

export function Admin() {
  return (
    <PageShell $width="1100px">
      <Card>
        <PageTitle>관리자</PageTitle>
        <SubText>데이터 수집, 모델 실행, 캐시, 검증 기록은 일반 사용자 화면에서 분리합니다.</SubText>
      </Card>
      <Grid>
        {ops.map(([title, desc, status]) => (
          <Card key={title}>
            <CardHeader>
              <SectionTitle>{title}</SectionTitle>
              <Badge $tone={status === "정상" ? "accent" : "warning"}>{status}</Badge>
            </CardHeader>
            <SubText>{desc}</SubText>
          </Card>
        ))}
      </Grid>
      <TableCard>
        <CardHeader>
          <SectionTitle>운영 체크리스트</SectionTitle>
        </CardHeader>
        <TableScroll>
          <DataTable>
            <tbody>
              <tr><td>모델 신호 생성</td><td><Badge $tone="accent">정상</Badge></td></tr>
              <tr><td>리포트 생성</td><td><Badge $tone="accent">정상</Badge></td></tr>
              <tr><td>캐시 갱신</td><td><Badge>대기</Badge></td></tr>
              <tr><td>공개 검증 메뉴</td><td><Badge $tone="warning">비공개</Badge></td></tr>
            </tbody>
          </DataTable>
        </TableScroll>
      </TableCard>
    </PageShell>
  );
}
