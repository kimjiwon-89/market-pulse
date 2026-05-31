import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { clearAuth, getRole, getToken, getUsername } from "@/services/apiClient";
import { Badge, Button, Card, CardHeader, CardLink, Gate, Grid, Inline, MutedText, PageHeaderCard, PageHeaderMeta, PageShell, PageTitle, SectionTitle, Stack, SubText } from "@/components/ui/Page";
import { StockLogo } from "@/features/stock/StockLogo";

const tiles = [
  ["관심 종목", "홈에서 저장한 종목이 여기에 표시됩니다.", "/my/favorites"],
  ["내 메모", "종목과 리포트에 연결된 메모를 모아봅니다.", "/memo"],
  ["알림 설정", "모델 신호, 리포트, 관심 종목 알림을 설정합니다.", "/my/alerts"],
  ["저장한 리포트", "나중에 볼 리포트를 저장합니다.", "/my/reports"],
];

const defaultFavoriteGroups = [
  {
    name: "민고민",
    stocks: [
      ["089590", "케이뱅크", "+0.1%", "5,790원"],
      ["323410", "카카오뱅크", "+4.4%", "22,350원"],
      ["035420", "NAVER", "+17.0%", "240,000원"],
      ["051910", "LG화학", "+7.4%", "370,000원"],
      ["009830", "한화솔루션", "+2.2%", "41,600원"],
      ["011760", "현대코퍼레이션", "-2.3%", "27,600원"],
      ["318060", "그래피", "-5.5%", "23,050원"],
      ["NVDA", "엔비디아", "-1.4%", "317,934원"],
      ["122630", "KODEX 레버리지", "+7.8%", "204,400원"],
    ],
  },
  {
    name: "2022년 월드컵",
    stocks: [
      ["011760", "현대코퍼레이션", "-2.3%", "27,600원"],
      ["009830", "한화솔루션", "+2.2%", "41,600원"],
    ],
  },
  {
    name: "2022월드컵...",
    stocks: [
      ["035420", "NAVER", "+17.0%", "240,000원"],
    ],
  },
];

type FavoriteGroup = {
  name: string;
  stocks: string[][];
};

export function MyPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const token = getToken();
  const username = getUsername();
  const role = getRole();
  const [favoriteGroups, setFavoriteGroups] = useState<FavoriteGroup[]>(defaultFavoriteGroups);
  const [activeGroupName, setActiveGroupName] = useState(defaultFavoriteGroups[0].name);
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingFavorite, setAddingFavorite] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newFavoriteName, setNewFavoriteName] = useState("");
  const activeGroup = favoriteGroups.find((group) => group.name === activeGroupName) ?? favoriteGroups[0];
  const activeStocks = activeGroup?.stocks ?? [];

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

  function addFavorite() {
    const name = newFavoriteName.trim();
    if (!name) return;
    setFavoriteGroups((groups) => groups.map((group) => {
      if (group.name !== activeGroupName) return group;
      return {
        ...group,
        stocks: [...group.stocks, [`TEMP-${group.stocks.length + 1}`, name, "0.0%", "-"]],
      };
    }));
    setNewFavoriteName("");
    setAddingFavorite(false);
  }

  function addGroup() {
    const name = newGroupName.trim();
    if (!name || favoriteGroups.some((group) => group.name === name)) return;
    setFavoriteGroups((groups) => [...groups, { name, stocks: [] }]);
    setActiveGroupName(name);
    setNewGroupName("");
    setAddingGroup(false);
  }

  if (section === "favorites") {
    return (
      <PageShell $width="900px">
        <PageHeaderCard>
          <PageTitle>관심 종목</PageTitle>
          <PageHeaderMeta>
            <Badge>{activeStocks.length}개</Badge>
          </PageHeaderMeta>
        </PageHeaderCard>
        <FavoriteSurface>
          <GroupRail role="tablist" aria-label="관심 그룹">
            {favoriteGroups.map((group) => (
              <GroupTab
                key={group.name}
                type="button"
                role="tab"
                aria-selected={activeGroupName === group.name}
                $active={activeGroupName === group.name}
                onClick={() => {
                  setActiveGroupName(group.name);
                  setAddingFavorite(false);
                }}
              >
                {group.name}
              </GroupTab>
            ))}
            <GroupAddButton type="button" onClick={() => setAddingGroup((value) => !value)}>그룹 추가</GroupAddButton>
          </GroupRail>
          {addingGroup && (
            <AddFavoriteForm>
              <label>
                새 그룹 이름
                <input
                  aria-label="새 그룹 이름"
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  placeholder="예: 기본"
                />
              </label>
              <Button type="button" $primary onClick={addGroup}>그룹 생성</Button>
            </AddFavoriteForm>
          )}
          <FavoriteList>
            {activeStocks.length === 0 ? (
              <EmptyText>이 그룹에 관심 종목이 없습니다.</EmptyText>
            ) : activeStocks.map(([code, name, change, price]) => (
              <FavoriteRow key={`${code}-${name}`} to={`/stock/${code}`}>
                <StockIdentity>
                  <StockLogo code={code} name={name} />
                  <strong>{name}</strong>
                </StockIdentity>
                <StockPrice $down={change.startsWith("-")}>
                  <strong>{change}</strong>
                  <span>{price}</span>
                </StockPrice>
              </FavoriteRow>
            ))}
          </FavoriteList>
          {addingFavorite && (
            <AddFavoriteForm>
              <label>
                관심 종목 이름
                <input
                  aria-label="관심 종목 이름"
                  value={newFavoriteName}
                  onChange={(event) => setNewFavoriteName(event.target.value)}
                  placeholder="예: 현대차"
                />
              </label>
              <Button type="button" $primary onClick={addFavorite}>추가</Button>
            </AddFavoriteForm>
          )}
          <BottomAddButton type="button" onClick={() => setAddingFavorite((value) => !value)}>종목 추가</BottomAddButton>
        </FavoriteSurface>
      </PageShell>
    );
  }

  if (section === "alerts") {
    return (
      <PageShell $width="900px">
        <PageHeaderCard>
          <PageTitle>알림 설정</PageTitle>
        </PageHeaderCard>
        <Card>
          <SectionTitle>알림 설정</SectionTitle>
          <SubText>모델 신호, 리포트, 관심 종목 알림을 켜고 끄는 설정 화면입니다.</SubText>
        </Card>
      </PageShell>
    );
  }

  if (section === "reports") {
    return (
      <PageShell $width="900px">
        <PageHeaderCard>
          <PageTitle>저장한 리포트</PageTitle>
        </PageHeaderCard>
        <Card>
          <SectionTitle>저장한 리포트</SectionTitle>
          <SubText>저장한 리포트 목록은 리포트 저장 기능과 연결됩니다.</SubText>
        </Card>
      </PageShell>
    );
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
        {tiles.map(([title, copy, to]) => (
          <CardLink key={title} to={to} aria-label={`${title} ${copy}`}>
            <SectionTitle>{title}</SectionTitle>
            <SubText>{copy}</SubText>
          </CardLink>
        ))}
      </Grid>
      {role === "ADMIN" && (
        <AdminCardLink
          to="/admin"
          aria-label="관리자 검증 기록, 백테스트, 데이터 수집, 캐시 관리는 관리자 전용입니다. ADMIN"
        >
          <CardHeader>
            <SectionTitle>관리자</SectionTitle>
            <Badge $tone="warning">ADMIN</Badge>
          </CardHeader>
          <SubText>검증 기록, 백테스트, 데이터 수집, 캐시 관리는 관리자 전용입니다.</SubText>
        </AdminCardLink>
      )}
    </PageShell>
  );
}

const AdminCardLink = styled(CardLink)`
  position: relative;
`;

const FavoriteSurface = styled.section`
  padding: 0;
`;

const GroupRail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 0 18px;
`;

const GroupTab = styled.button<{ $active: boolean }>`
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ $active, theme }) => ($active ? theme.color.hover : "transparent")};
  color: ${({ $active, theme }) => ($active ? theme.color.text : theme.color.textMuted)};
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
`;

const GroupAddButton = styled.button`
  min-height: 40px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.color.accent};
  font: inherit;
  font-size: 15px;
  font-weight: 900;
  white-space: nowrap;
  cursor: pointer;
`;

const AddFavoriteForm = styled(Inline)`
  align-items: flex-end;
  margin-bottom: 12px;

  label {
    display: grid;
    gap: 6px;
    min-width: 180px;
    color: ${({ theme }) => theme.color.textSubtle};
    font-size: 12px;
    font-weight: 700;
  }

  input {
    min-height: 34px;
    padding: 0 10px;
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.control};
    background: ${({ theme }) => theme.color.panel};
    color: ${({ theme }) => theme.color.text};
    font: inherit;
    font-size: 13px;
  }
`;

const FavoriteList = styled(Stack)`
  margin-top: 6px;
  gap: 0;
`;

const FavoriteRow = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 76px;
  padding: 10px 0;
  color: inherit;
  text-decoration: none;

  &:hover strong {
    color: ${({ theme }) => theme.color.accent};
  }

  strong {
    color: ${({ theme }) => theme.color.text};
    font-size: 18px;
  }

  span {
    margin-top: 4px;
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 14px;
  }
`;

const StockIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const StockPrice = styled.div<{ $down: boolean }>`
  text-align: right;

  strong,
  span {
    display: block;
  }

  strong {
    color: ${({ $down, theme }) => ($down ? theme.color.down : theme.color.up)};
    font-size: 18px;
    font-weight: 900;
  }
`;

const BottomAddButton = styled.button`
  width: 100%;
  min-height: 48px;
  margin-top: 8px;
  border: 1px dashed ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.panel};
  color: ${({ theme }) => theme.color.accent};
  font: inherit;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
`;

const EmptyText = styled(MutedText)`
  padding: 28px 0;
`;
