import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBullQuantReportDetail, getBullQuantReports } from "@/features/quant/api";
import type { QuantReportDetail, QuantReportSummary } from "@/features/quant/types";
import { Badge, Card, CardHeader, CardLink, Chip, ChipRow, List, ListItem, MutedText, PageHeaderCard, PageHeaderMeta, PageShell, PageTitle, SectionTitle, Stack, SubText, TextLink } from "@/components/ui/Page";

export function Reports() {
  const { reportId } = useParams();
  const [reports, setReports] = useState<QuantReportSummary[]>([]);
  const [selected, setSelected] = useState<QuantReportDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const request = reportId ? getBullQuantReportDetail(reportId).then((detail) => ({ detail, reports: [] })) : getBullQuantReports().then((items) => ({ detail: null, reports: items }));

    request
      .then(({ detail, reports: items }) => {
        if (!mounted) return;
        setSelected(detail);
        setReports(items);
        setLoaded(true);
      })
      .catch(() => {
        if (!mounted) return;
        setError(true);
        setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, [reportId]);

  if (reportId && !loaded) {
    return (
      <PageShell $width="880px">
        <PageHeaderCard>
          <PageTitle>리포트를 불러오는 중입니다</PageTitle>
        </PageHeaderCard>
      </PageShell>
    );
  }

  if (reportId && (!selected || error)) {
    return (
      <PageShell $width="880px">
        <PageHeaderCard>
          <PageTitle>리포트를 찾을 수 없습니다</PageTitle>
          <PageHeaderMeta><TextLink to="/reports">리포트 목록으로</TextLink></PageHeaderMeta>
        </PageHeaderCard>
      </PageShell>
    );
  }

  if (selected) {
    return (
      <PageShell $width="880px">
        <PageHeaderCard as="article">
          <PageTitle>{selected.title}</PageTitle>
          <PageHeaderMeta>
            <TextLink to="/reports">리포트 목록</TextLink>
            <Badge $tone="accent">{selected.modelName}</Badge>
            <MutedText>{selected.publishedAt}</MutedText>
          </PageHeaderMeta>
        </PageHeaderCard>
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
            {selected.sections.map((section, index) => <ListItem key={`${section}-${index}`}>{section}</ListItem>)}
            {selected.sections.length === 0 ? <ListItem>백엔드 리포트 본문 섹션이 없습니다.</ListItem> : null}
          </List>
        </Card>
        <Card $soft>
          <SectionTitle>사용자 체크포인트</SectionTitle>
          <List>
            {selected.checkpoints.map((checkpoint, index) => <ListItem key={`${checkpoint}-${index}`}>{checkpoint}</ListItem>)}
            {selected.checkpoints.length === 0 ? <ListItem>리포트 체크포인트가 없습니다.</ListItem> : null}
          </List>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell $width="1000px">
      <PageHeaderCard>
        <PageTitle>리포트</PageTitle>
        <PageHeaderMeta>
          <MutedText>{reports.length}개</MutedText>
        </PageHeaderMeta>
      </PageHeaderCard>
      {error ? (
        <Card $soft>
          <SubText>실제 리포트 목록을 불러오지 못했습니다.</SubText>
        </Card>
      ) : null}
      <Stack>
        {reports.map((report) => (
          <CardLink key={report.id} to={`/reports/${report.id}`}>
            <CardHeader>
              <SectionTitle>{report.title}</SectionTitle>
              <Badge $tone="accent">{report.modelName}</Badge>
            </CardHeader>
            <SubText>{report.summary}</SubText>
            <MutedText>{report.publishedAt}</MutedText>
          </CardLink>
        ))}
        {reports.length === 0 && !error ? (
          <Card>
            <SectionTitle>리포트 없음</SectionTitle>
            <SubText>아직 생성된 Bull v4 리포트가 없습니다.</SubText>
          </Card>
        ) : null}
      </Stack>
    </PageShell>
  );
}
