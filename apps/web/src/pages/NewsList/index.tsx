import { mockNews } from "@/features/mock/marketMockData";
import { Card, List, ListItem, MutedText, PageShell, PageTitle, SectionTitle, SubText } from "@/components/ui/Page";

export function NewsList() {
  return (
    <PageShell $width="900px">
      <Card>
        <PageTitle>뉴스</PageTitle>
        <SubText>시장과 모델 판단에 영향을 줄 수 있는 주요 뉴스를 모았습니다.</SubText>
      </Card>
      <Card>
        <List>
          {mockNews.map((news) => (
            <ListItem key={news.id}>
              <SectionTitle>{news.title}</SectionTitle>
              <SubText>{news.summary}</SubText>
              <MutedText>{news.source} · {news.date}</MutedText>
            </ListItem>
          ))}
        </List>
      </Card>
    </PageShell>
  );
}
