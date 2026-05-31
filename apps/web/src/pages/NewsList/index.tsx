import { mockNews } from "@/features/mock/marketMockData";
import { Card, List, ListItem, MutedText, PageHeaderCard, PageShell, PageTitle, SectionTitle, SubText } from "@/components/ui/Page";

export function NewsList() {
  return (
    <PageShell $width="900px">
      <PageHeaderCard>
        <PageTitle>뉴스</PageTitle>
      </PageHeaderCard>
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
