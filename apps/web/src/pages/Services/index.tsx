import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardHeader, Grid, PageHeaderCard, PageShell, PageTitle, SectionTitle, Stack, SubText } from "@/components/ui/Page";

export function Services() {
  const navigate = useNavigate();

  return (
    <PageShell $width="900px">
      <PageHeaderCard>
        <PageTitle>서비스</PageTitle>
      </PageHeaderCard>
      <Grid $columns="repeat(2, minmax(0, 1fr))">
        <Card>
          <CardHeader>
            <SectionTitle>로또 분석</SectionTitle>
            <Badge $tone="accent">lotto</Badge>
          </CardHeader>
          <Stack $gap="14px">
            <SubText>통계 전략 기반 번호 분석, 최근 회차 확인, 내 조합 저장을 제공합니다.</SubText>
            <Button type="button" onClick={() => navigate("/lotto")} $primary>로또 열기</Button>
          </Stack>
        </Card>
        <Card>
          <CardHeader>
            <SectionTitle>타로 리딩</SectionTitle>
            <Badge $tone="accent">tarot</Badge>
          </CardHeader>
          <Stack $gap="14px">
            <SubText>사용자 요청과 결과를 민감 정보로 취급하는 별도 리딩 화면입니다.</SubText>
            <Button type="button" onClick={() => navigate("/tarot")}>타로 열기</Button>
          </Stack>
        </Card>
      </Grid>
    </PageShell>
  );
}
