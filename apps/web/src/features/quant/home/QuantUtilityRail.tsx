import { useNavigate } from "react-router-dom";
import type { QuantNewsItem } from "@/features/quant/types";
import {
  AdCard,
  AdLabel,
  AdSlotFrame,
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

interface QuantUtilityRailProps {
  news: QuantNewsItem[];
}

type QuantAdSlot = "desktop_side_top" | "mobile_inline_top";

export function QuantNewsCard({ news }: QuantUtilityRailProps) {
  const navigate = useNavigate();

  return (
    <Card $flush>
      <SectionHead>
        <SectionTitle>뉴스</SectionTitle>
        <SmallButton type="button" onClick={() => navigate("/news")}>
          더보기
        </SmallButton>
      </SectionHead>
      <UtilityList $maxHeight="250px">
        {news.length === 0 ? <BodyCopy>표시할 최신 뉴스가 없습니다.</BodyCopy> : null}
        {news.map((item) => (
          <UtilityButton key={item.id} type="button" onClick={() => navigate("/news")}>
            {item.title}
          </UtilityButton>
        ))}
      </UtilityList>
    </Card>
  );
}

export function QuantAdCard({ slot = "desktop_side_top" }: { slot?: QuantAdSlot }) {
  return (
    <AdSlotFrame $slot={slot}>
      <AdCard $flush data-ad-slot={slot}>
        <AdLabel>AD</AdLabel>
        <div>
          <SectionTitle>{slot === "desktop_side_top" ? "광고 영역" : "모바일 광고 영역"}</SectionTitle>
          <BodyCopy>{slot === "desktop_side_top" ? "데스크탑 상단 레일형 광고 슬롯입니다." : "모바일 인라인 배너형 광고 슬롯입니다."}</BodyCopy>
        </div>
      </AdCard>
    </AdSlotFrame>
  );
}

export function QuantFavoriteFolderCard() {
  const navigate = useNavigate();

  return (
    <Card $flush>
      <SectionHead>
        <SectionTitle>관심 종목</SectionTitle>
        <SmallButton type="button" onClick={() => navigate("/my/favorites")}>
          관리
        </SmallButton>
      </SectionHead>
      <UtilityList $maxHeight="160px">
        <UtilityRow type="button" onClick={() => navigate("/my/favorites")}>
          <span>로그인 후 관심 종목을 불러옵니다.</span>
          <strong>-</strong>
        </UtilityRow>
      </UtilityList>
    </Card>
  );
}

export function QuantUtilityRail({ news }: QuantUtilityRailProps) {
  return (
    <UtilityRail>
      <QuantNewsCard news={news} />
      <QuantAdCard />
      <QuantFavoriteFolderCard />
    </UtilityRail>
  );
}
