import { useNavigate } from "react-router-dom";
import { clearAuth, getRole, getToken, getUsername } from "@/services/apiClient";
import { Badge, Button, Card, CardHeader, Gate, Grid, MutedText, PageHeaderCard, PageHeaderMeta, PageShell, PageTitle, SectionTitle, SubText } from "@/components/ui/Page";

const tiles = [
  ["관심 종목", "홈에서 저장한 종목이 여기에 표시됩니다."],
  ["관심 폴더", "폴더 보기, 이름 변경, 삭제를 관리합니다."],
  ["내 메모", "종목과 리포트에 연결된 메모를 모아봅니다."],
  ["알림 설정", "모델 신호, 리포트, 관심 종목 알림을 설정합니다."],
  ["저장한 리포트", "나중에 볼 리포트를 저장합니다."],
];

export function MyPage() {
  const navigate = useNavigate();
  const token = getToken();
  const username = getUsername();
  const role = getRole();

  if (!token) {
    return (
      <Gate>
        <SectionTitle>로그인이 필요한 기능입니다</SectionTitle>
        <MutedText>관심 종목, 메모, 알림, 저장 리포트는 계정에 저장됩니다.</MutedText>
        <Button $primary type="button" onClick={() => navigate("/login")}>로그인하기</Button>
      </Gate>
    );
  }

  function handleLogout() {
    clearAuth();
    navigate("/", { replace: true });
  }

  return (
    <PageShell $width="900px">
      <PageHeaderCard>
        <PageTitle>마이</PageTitle>
        <PageHeaderMeta>
          <Badge $tone="accent">{username}</Badge>
          <Badge>{role ?? "USER"}</Badge>
          <Button type="button" onClick={handleLogout}>로그아웃</Button>
        </PageHeaderMeta>
      </PageHeaderCard>
      <Grid $columns="repeat(2, minmax(0, 1fr))">
        {tiles.map(([title, copy]) => (
          <Card key={title}>
            <SectionTitle>{title}</SectionTitle>
            <SubText>{copy}</SubText>
          </Card>
        ))}
      </Grid>
      {role === "ADMIN" && (
        <Card>
          <CardHeader>
            <SectionTitle>관리자</SectionTitle>
            <Badge $tone="warning">ADMIN</Badge>
          </CardHeader>
          <SubText>검증 기록, 백테스트, 데이터 수집, 캐시 관리는 관리자 전용입니다.</SubText>
          <Button type="button" onClick={() => navigate("/admin")}>관리자 화면</Button>
        </Card>
      )}
    </PageShell>
  );
}
