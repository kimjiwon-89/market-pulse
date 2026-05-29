import { Badge, Button, Card, CardHeader, Grid, PageShell, PageTitle, SectionTitle, Stack, SubText } from "@/components/ui/Page";

const cards = [
  { title: "현재", copy: "지금 가장 크게 작용하는 흐름을 정리합니다." },
  { title: "흐름", copy: "선택지가 어디로 이어질지 차분히 살펴봅니다." },
  { title: "조언", copy: "오늘 당장 무리하지 않아도 되는 점검 포인트를 남깁니다." },
];

export function TarotPage() {
  return (
    <PageShell $width="900px">
      <Card>
        <PageTitle>타로</PageTitle>
        <SubText>타로 리딩은 퀀트 투자 화면과 분리된 개인 서비스입니다.</SubText>
      </Card>
      <Grid>
        {cards.map((card, index) => (
          <Card key={card.title}>
            <CardHeader>
              <SectionTitle>{card.title}</SectionTitle>
              <Badge>{index + 1}</Badge>
            </CardHeader>
            <SubText>{card.copy}</SubText>
          </Card>
        ))}
      </Grid>
      <Card $soft>
        <Stack $gap="12px">
          <SectionTitle>리딩 요청</SectionTitle>
          <SubText>질문은 계정에 연결되는 개인 콘텐츠입니다. 저장과 재열람은 로그인 후 연결합니다.</SubText>
          <Button type="button">질문 작성</Button>
        </Stack>
      </Card>
    </PageShell>
  );
}
