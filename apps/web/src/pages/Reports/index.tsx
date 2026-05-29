import { useParams } from "react-router-dom";
import { quantReports } from "@/features/quant/quantMockData";
import { Badge, Card, CardHeader, CardLink, Chip, ChipRow, List, ListItem, MutedText, PageShell, PageTitle, SectionTitle, Stack, SubText, TextLink } from "@/components/ui/Page";

export function Reports() {
  const { reportId } = useParams();
  const selected = reportId ? quantReports.find((report) => report.id === reportId) : null;

  if (reportId && !selected) {
    return (
      <PageShell $width="880px">
        <Card>
          <PageTitle>리포트를 찾을 수 없습니다</PageTitle>
          <TextLink to="/reports">리포트 목록으로</TextLink>
        </Card>
      </PageShell>
    );
  }

  if (selected) {
    return (
      <PageShell $width="880px">
        <Card as="article">
          <TextLink to="/reports">리포트 목록</TextLink>
          <PageTitle>{selected.title}</PageTitle>
          <MutedText>{selected.modelName} · {selected.publishedAt}</MutedText>
        </Card>
        <Card>
          <SectionTitle>핵심 판단</SectionTitle>
          <SubText>{selected.summary}</SubText>
          <ChipRow>
            {selected.keywords.map((keyword) => <Chip key={keyword}>{keyword}</Chip>)}
          </ChipRow>
        </Card>
        <Card>
          <SectionTitle>모델 근거</SectionTitle>
          <List>
            <ListItem>시장 지수는 약세지만 급락 신호는 제한적입니다.</ListItem>
            <ListItem>반도체 수급 개선과 거래대금 집중이 함께 확인됩니다.</ListItem>
            <ListItem>모델 판단은 매매 지시가 아니라 확인해야 할 종목 우선순위입니다.</ListItem>
          </List>
        </Card>
        <Card $soft>
          <SectionTitle>사용자 체크포인트</SectionTitle>
          <SubText>관심 종목에 저장한 뒤 가격 변동, 수급 변화, 후속 리포트를 같이 확인하세요.</SubText>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell $width="1000px">
      <Card>
        <PageTitle>리포트</PageTitle>
        <SubText>모델이 오늘 어떤 이유로 판단했는지 쉬운 말로 정리합니다.</SubText>
      </Card>
      <Stack>
        {quantReports.map((report) => (
          <CardLink key={report.id} to={`/reports/${report.id}`}>
            <CardHeader>
              <SectionTitle>{report.title}</SectionTitle>
              <Badge $tone="accent">{report.modelName}</Badge>
            </CardHeader>
            <SubText>{report.summary}</SubText>
            <MutedText>{report.publishedAt}</MutedText>
          </CardLink>
        ))}
      </Stack>
    </PageShell>
  );
}
