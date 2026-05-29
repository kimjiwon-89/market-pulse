import { useParams } from "react-router-dom";
import { quantDecisions, quantModels } from "@/features/quant/quantMockData";
import { Badge, Card, CardHeader, CardLink, Chip, ChipRow, Grid, Inline, List, ListItem, MutedText, PageShell, PageTitle, SectionTitle, SubText, TextLink, ValueText } from "@/components/ui/Page";

export function QuantModels() {
  const { modelCode } = useParams();
  const selected = modelCode ? quantModels.find((model) => model.code === modelCode) : null;

  if (modelCode && !selected) {
    return (
      <PageShell $width="900px">
        <Card>
          <PageTitle>모델을 찾을 수 없습니다</PageTitle>
          <TextLink to="/quant">모델 목록으로</TextLink>
        </Card>
      </PageShell>
    );
  }

  if (selected) {
    const decisions = quantDecisions.filter((item) => item.modelNames.some((name) => selected.name.includes(name.replace(" 모델", "")) || name === selected.name));
    return (
      <PageShell $width="1100px">
        <Card>
          <TextLink to="/quant">모델 목록</TextLink>
          <PageTitle>{selected.name}</PageTitle>
          <SubText>{selected.plainName}</SubText>
        </Card>
        <Grid>
          <Card><SectionTitle>상태</SectionTitle><ValueText>{selected.status}</ValueText></Card>
          <Card><SectionTitle>신호 강도</SectionTitle><ValueText>{selected.signalStrength}</ValueText></Card>
          <Card><SectionTitle>오늘 종목</SectionTitle><ValueText>{selected.todayCount}개</ValueText></Card>
        </Grid>
        <Card>
          <SectionTitle>모델이 보는 것</SectionTitle>
          <SubText>{selected.description}</SubText>
          <ChipRow>{selected.focus.map((item) => <Chip key={item}>{item}</Chip>)}</ChipRow>
        </Card>
        <Card>
          <SectionTitle>이 모델이 포함된 오늘의 종목</SectionTitle>
          <List>
            {(decisions.length ? decisions : quantDecisions.slice(0, 2)).map((item) => (
              <ListItem key={item.assetCode}>
                <Inline $justify="space-between">
                  <span>{item.assetName}</span>
                  <Badge $tone="accent">{item.decisionLabel}</Badge>
                </Inline>
              </ListItem>
            ))}
          </List>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell $width="1100px">
      <Card>
        <PageTitle>모델 목록</PageTitle>
        <SubText>퀀트 모델이 어떤 데이터를 보고 어떤 상황에 강한지 쉽게 정리했습니다.</SubText>
      </Card>
      <Grid>
        {quantModels.map((model) => (
          <CardLink key={model.code} to={`/quant/${model.code}`}>
            <CardHeader>
              <SectionTitle>{model.name}</SectionTitle>
              <Badge $tone="accent">{model.status}</Badge>
            </CardHeader>
            <SubText>{model.plainName}</SubText>
            <ChipRow>{model.focus.map((item) => <Chip key={item}>{item}</Chip>)}</ChipRow>
            <MutedText>오늘 종목 {model.todayCount}개 · {model.marketMode}</MutedText>
          </CardLink>
        ))}
      </Grid>
    </PageShell>
  );
}
