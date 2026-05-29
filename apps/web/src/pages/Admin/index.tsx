import { Badge, Card, CardHeader, DataTable, Grid, PageHeaderCard, PageShell, PageTitle, SectionTitle, SubText, TableCard, TableScroll } from "@/components/ui/Page";

const ops = [
  ["데이터 수집", "장중 시세, 지수, 수급 데이터 수집 상태", "정상"],
  ["모델 실행", "일별 모델 계산과 리포트 생성", "정상"],
  ["검증 기록", "백테스트, evidence, 관리자용 성과 점검", "관리자"],
];

const modelVersions = [
  ["BULL", "BULL_V4", "5.0.1", "ACTIVE", "100M paper 운영 중", "롤백 기준: 5.0.0"],
  ["BULL", "BULL_V5", "5.1.0", "DRAFT", "등록 전", "검증 실행 필요"],
  ["BEAR", "BEAR_V1", "1.0.0", "READY_FOR_APPROVAL", "승인 대기", "운영 반영 전"],
];

function statusTone(status: string): "accent" | "warning" | "flat" {
  if (status === "ACTIVE") return "accent";
  if (status === "READY_FOR_APPROVAL") return "warning";
  return "flat";
}

export function Admin() {
  return (
    <PageShell $width="1100px">
      <PageHeaderCard>
        <PageTitle>관리자</PageTitle>
      </PageHeaderCard>
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
      <TableCard>
        <CardHeader>
          <div>
            <SectionTitle>모델 버전 관리</SectionTitle>
            <SubText>업로드 즉시 운영 반영하지 않고 검증, 승인, 활성화, 롤백 단계를 분리합니다.</SubText>
          </div>
        </CardHeader>
        <TableScroll>
          <DataTable>
            <thead>
              <tr>
                <th>패밀리</th>
                <th>모델 코드</th>
                <th>버전</th>
                <th>상태</th>
                <th>단계</th>
                <th>운영 메모</th>
              </tr>
            </thead>
            <tbody>
              {modelVersions.map(([family, code, version, status, stage, memo]) => (
                <tr key={code}>
                  <td>{family}</td>
                  <td>{code}</td>
                  <td>{version}</td>
                  <td><Badge $tone={statusTone(status)}>{status}</Badge></td>
                  <td>{stage}</td>
                  <td>{memo}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </TableScroll>
      </TableCard>
    </PageShell>
  );
}
