import { useNavigate } from "react-router-dom";
import { getToken } from "@/services/apiClient";
import { mockLottoRounds } from "@/features/mock/marketMockData";
import { Badge, Button, Card, CardHeader, Chip, ChipRow, Grid, Inline, List, ListItem, PageShell, PageTitle, SectionTitle, SubText } from "@/components/ui/Page";

const strategies = [
  { name: "모멘텀", desc: "최근 자주 나온 번호와 흐름이 좋은 번호" },
  { name: "잠수함", desc: "오랫동안 나오지 않은 번호" },
  { name: "패턴", desc: "번호대와 끝자리 균형" },
];

export function LottoAnalysis() {
  const navigate = useNavigate();

  function saveCombo() {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    navigate("/my");
  }

  return (
    <PageShell $width="1000px">
      <Card>
        <PageTitle>로또</PageTitle>
        <SubText>통계 전략 기반 번호 분석 화면입니다. 내 조합 저장은 로그인 후 가능합니다.</SubText>
      </Card>
      <Grid>
        {strategies.map((strategy) => (
          <Card key={strategy.name}>
            <SectionTitle>{strategy.name}</SectionTitle>
            <SubText>{strategy.desc}</SubText>
            <ChipRow>{[3, 11, 18, 24].map((num) => <Chip key={num}>{num}</Chip>)}</ChipRow>
          </Card>
        ))}
      </Grid>
      <Card>
        <CardHeader>
          <SectionTitle>최근 회차</SectionTitle>
          <Button type="button" onClick={saveCombo}>내 조합 저장</Button>
        </CardHeader>
        <List>
          {mockLottoRounds.map((round) => (
            <ListItem key={round.round}>
              <Inline $justify="space-between" $wrap>
                <strong>{round.round}회</strong>
                <ChipRow>
                  {round.numbers.map((num) => <Chip key={num}>{num}</Chip>)}
                  <Badge>+ {round.bonus}</Badge>
                </ChipRow>
              </Inline>
            </ListItem>
          ))}
        </List>
      </Card>
    </PageShell>
  );
}
