import { useNavigate } from "react-router-dom";
import { getToken } from "@/services/apiClient";
import { mockMemos } from "@/features/mock/marketMockData";
import { Button, Card, Gate, List, ListItem, MutedText, PageHeaderCard, PageShell, PageTitle, SectionTitle, SubText } from "@/components/ui/Page";

export function MemoList() {
  const navigate = useNavigate();
  const authed = !!getToken();

  if (!authed) {
    return (
      <Gate>
        <SectionTitle>메모는 로그인 후 사용할 수 있습니다</SectionTitle>
        <MutedText>메모는 계정에 연결되는 개인 기능입니다.</MutedText>
        <Button $primary type="button" onClick={() => navigate("/login")}>로그인하기</Button>
      </Gate>
    );
  }

  return (
    <PageShell $width="900px">
      <PageHeaderCard>
        <PageTitle>내 메모</PageTitle>
      </PageHeaderCard>
      <Card>
        <List>
          {mockMemos.map((memo) => (
            <ListItem key={memo.id}>
              <MutedText>{memo.createdAt}</MutedText>
              <SectionTitle>{memo.title}</SectionTitle>
              <SubText>{memo.content}</SubText>
            </ListItem>
          ))}
        </List>
      </Card>
    </PageShell>
  );
}
