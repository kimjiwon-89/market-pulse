import { useNavigate } from "react-router-dom";
import { mockNews } from "@/features/mock/marketMockData";
import {
  AdCard,
  AdLabel,
  BodyCopy,
  Card,
  SectionHead,
  SectionTitle,
  SmallButton,
  UtilityButton,
  UtilityList,
  UtilityRail,
  UtilityRow,
} from "./styles";

const favoriteFolders = [
  { name: "메인 관심", count: 12 },
  { name: "반도체", count: 6 },
  { name: "리스크 체크", count: 3 },
];

export function QuantUtilityRail() {
  const navigate = useNavigate();

  return (
    <UtilityRail>
      <Card>
        <SectionHead>
          <SectionTitle>뉴스</SectionTitle>
          <SmallButton type="button" onClick={() => navigate("/news")}>
            더보기
          </SmallButton>
        </SectionHead>
        <UtilityList $maxHeight="250px">
          {mockNews.map((news) => (
            <UtilityButton key={news.id} type="button" onClick={() => navigate("/news")}>
              {news.title}
            </UtilityButton>
          ))}
        </UtilityList>
      </Card>

      <AdCard>
        <AdLabel>AD</AdLabel>
        <div>
          <SectionTitle>광고 영역</SectionTitle>
          <BodyCopy>추후 배너, 제휴 콘텐츠, 프로모션을 연결할 자리입니다.</BodyCopy>
        </div>
      </AdCard>

      <Card>
        <SectionHead>
          <SectionTitle>관심 폴더</SectionTitle>
          <SmallButton type="button" onClick={() => navigate("/my")}>
            관리
          </SmallButton>
        </SectionHead>
        <UtilityList $maxHeight="160px">
          {favoriteFolders.map((folder) => (
            <UtilityRow key={folder.name} type="button" onClick={() => navigate("/my")}>
              <span>{folder.name}</span>
              <strong>{folder.count}</strong>
            </UtilityRow>
          ))}
        </UtilityList>
      </Card>
    </UtilityRail>
  );
}
