import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  Grid,
  Inline,
  Mono,
  PageHeaderCard,
  PageHeaderMeta,
  PageShell,
  PageTitle,
  SectionTitle,
  Stack,
  SubText,
  TableCard,
  TableScroll,
  ValueText,
} from "@/components/ui/Page";
import { listQuantModelPackages, scanQuantModelPackages, updateQuantModelPackageVisibility } from "./api";
import type { QuantModelPackage } from "./api";

type AdminTab = "accounts" | "models" | "ops" | "revenue" | "bugs";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "accounts", label: "계정" },
  { id: "models", label: "모델" },
  { id: "ops", label: "운영" },
  { id: "revenue", label: "매출" },
  { id: "bugs", label: "버그" },
];

const accountRows = [
  ["사용자 계정", "가입자 목록, 권한, 정지/해제 관리", "설계 필요"],
  ["관리자 계정", "관리자 권한 부여와 회수", "설계 필요"],
  ["감사 로그", "모델 공개, 권한 변경 같은 관리자 조치 기록", "연동 전"],
];

const opsRows = [
  ["데이터 최신성", "지수, 뉴스, 수급, 종목마스터의 마지막 갱신 시간을 표시", "연동 전"],
  ["외부 API 상태", "KIS 토큰, 실패 횟수, 응답 지연을 표시", "연동 전"],
  ["캐시 관리", "Bull v4 replay cache와 모델 결과 cache 상태 확인", "연동 전"],
];

const revenueRows = [
  ["광고 슬롯", "홈, 모델 상세, 모바일 inline 슬롯별 ON/OFF", "설계 필요"],
  ["광고 성과", "노출, 클릭, CTR, 예상 매출", "연동 전"],
  ["정산", "일/월별 광고 매출 합계", "연동 전"],
];

const bugRows = [
  ["신고함", "새 버그 신고를 접수하고 우선순위를 지정", "report/bugs/inbox"],
  ["작업 폴더", "신고별 source, screenshot, meta, fix-notes 관리", "report/bugs/inbox/<BUG_ID>"],
  ["수정 상태", "접수, 조사 중, 수정 완료, 배포 대기", "설계 필요"],
];

function statusTone(status: string): "accent" | "warning" | "flat" {
  if (status === "APPROVED" || status === "공개") return "accent";
  if (status === "DETECTED" || status === "설계 필요" || status === "연동 전") return "warning";
  return "flat";
}

export function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>("models");
  const [packages, setPackages] = useState<QuantModelPackage[]>([]);
  const [packageError, setPackageError] = useState(false);
  const [packageLoading, setPackageLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    listQuantModelPackages()
      .then((items) => {
        if (!mounted) return;
        setPackages(items);
        setPackageError(false);
      })
      .catch(() => {
        if (!mounted) return;
        setPackageError(true);
      })
      .finally(() => {
        if (mounted) setPackageLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const publicPackages = useMemo(() => packages.filter((item) => item.publicVisible), [packages]);
  const pendingPackages = useMemo(() => packages.filter((item) => !item.publicVisible), [packages]);
  const packageCountText = packageLoading ? "확인 중" : `${packages.length}개`;

  async function scanPackages() {
    setPackageLoading(true);
    try {
      setPackages(await scanQuantModelPackages());
      setPackageError(false);
    } catch {
      setPackageError(true);
    } finally {
      setPackageLoading(false);
    }
  }

  async function setPackageVisible(modelCode: string, publicVisible: boolean) {
    const updated = await updateQuantModelPackageVisibility(modelCode, {
      publicVisible,
      packageStatus: publicVisible ? "APPROVED" : "DETECTED",
      adminNote: publicVisible ? "공개 승인" : "관리자 비공개",
    });
    setPackages((items) => items.map((item) => item.modelCode === modelCode ? updated : item));
  }

  return (
    <PageShell $width="1100px">
      <PageHeaderCard>
        <div>
          <PageTitle>관리자</PageTitle>
          <SubText>계정, 모델, 운영, 매출, 버그 신고를 한 곳에서 관리합니다.</SubText>
        </div>
        <PageHeaderMeta>
          <Button type="button" onClick={scanPackages}>패키지 스캔</Button>
        </PageHeaderMeta>
      </PageHeaderCard>

      <Card>
        <CardHeader>
          <SectionTitle>관리자 처리할 일</SectionTitle>
          <Badge $tone={pendingPackages.length > 0 ? "warning" : "flat"}>{pendingPackages.length + 3}건</Badge>
        </CardHeader>
        <TaskGrid>
          <TaskCard>
            <span>공개 대기 모델</span>
            <strong>{pendingPackages.length}개</strong>
            <small>패키지 감지 후 공개 승인 필요</small>
          </TaskCard>
          <TaskCard>
            <span>새 버그 신고</span>
            <strong>0건</strong>
            <small><Mono>report/bugs/inbox</Mono> 연동 예정</small>
          </TaskCard>
          <TaskCard>
            <span>운영 점검 항목</span>
            <strong>3개</strong>
            <small>데이터 최신성, API 상태, 캐시 관리</small>
          </TaskCard>
          <TaskCard>
            <span>광고 매출</span>
            <strong>연동 전</strong>
            <small>광고 슬롯 적용 후 수집</small>
          </TaskCard>
        </TaskGrid>
      </Card>

      <TabList role="tablist" aria-label="관리자 기능">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            $active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabList>

      {activeTab === "accounts" ? (
        <AdminTable title="계정 관리" description="사용자와 관리자 권한을 관리하는 영역입니다." rows={accountRows} />
      ) : null}

      {activeTab === "models" ? (
        <Stack>
          <Grid $columns="repeat(3, minmax(0, 1fr))">
            <Card $soft>
              <SectionTitle>전체 패키지</SectionTitle>
              <ValueText>{packageCountText}</ValueText>
              <SubText><Mono>domains/quant-serving/packages</Mono> 기준</SubText>
            </Card>
            <Card $soft>
              <SectionTitle>사용자 노출</SectionTitle>
              <ValueText>{publicPackages.length}개</ValueText>
              <SubText>사용자 `/quant` 목록에 표시</SubText>
            </Card>
            <Card $soft>
              <SectionTitle>런타임 준비 전</SectionTitle>
              <ValueText>{packages.filter((item) => !item.runtimeReady).length}개</ValueText>
              <SubText>목록 shell만 노출 가능</SubText>
            </Card>
          </Grid>

          <TableCard>
            <AdminTableHeader>
              <div>
                <SectionTitle>모델 패키지 관리</SectionTitle>
                <SubText><Mono>manifest.json</Mono>을 스캔하고 사용자 노출 여부를 제어합니다.</SubText>
                {packageError ? <SubText>패키지 목록을 불러오지 못했습니다. 관리자 API 연결 상태를 확인해주세요.</SubText> : null}
              </div>
              <Badge $tone={packageLoading ? "warning" : "flat"}>{packageCountText}</Badge>
            </AdminTableHeader>
            <TableScroll>
              <DataTable>
                <thead>
                  <tr>
                    <th>모델</th>
                    <th>버전</th>
                    <th>상태</th>
                    <th>노출</th>
                    <th>런타임</th>
                    <th>패키지 경로</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.length === 0 ? (
                    <tr>
                      <td colSpan={7}>감지된 모델 패키지가 없습니다.</td>
                    </tr>
                  ) : packages.map((item) => (
                    <tr key={item.modelCode}>
                      <td>
                        <strong>{item.modelName}</strong>
                        <SubText><Mono>{item.modelCode}</Mono> · {item.category}</SubText>
                      </td>
                      <td>{item.modelVersion}</td>
                      <td><Badge $tone={statusTone(item.packageStatus)}>{item.packageStatus}</Badge></td>
                      <td><Badge $tone={item.publicVisible ? "accent" : "flat"}>{item.publicVisible ? "공개" : "비공개"}</Badge></td>
                      <td><Badge $tone={item.runtimeReady ? "accent" : "warning"}>{item.runtimeReady ? "준비됨" : "준비 전"}</Badge></td>
                      <td><Mono>{item.packagePath}</Mono></td>
                      <td>
                        <Inline $gap="6px" $wrap>
                          <Button type="button" $primary={!item.publicVisible} onClick={() => setPackageVisible(item.modelCode, true)}>공개</Button>
                          <Button type="button" onClick={() => setPackageVisible(item.modelCode, false)}>비공개</Button>
                        </Inline>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </TableScroll>
          </TableCard>
        </Stack>
      ) : null}

      {activeTab === "ops" ? (
        <AdminTable title="운영 관리" description="실제 데이터와 외부 API 상태가 연결되면 여기서 점검합니다." rows={opsRows} />
      ) : null}

      {activeTab === "revenue" ? (
        <AdminTable title="매출 관리" description="광고 슬롯을 단 뒤 노출, 클릭, 수익을 관리합니다." rows={revenueRows} />
      ) : null}

      {activeTab === "bugs" ? (
        <Stack>
          <AdminTable title="버그 신고함" description="신고된 버그를 작업 폴더로 정리하고 수정 상태를 추적합니다." rows={bugRows} />
          <Card $soft>
            <SectionTitle>Codex 작업 폴더 계약</SectionTitle>
            <SubText>버그 한 건은 <Mono>report/bugs/inbox/&lt;BUG_ID&gt;</Mono> 아래에 저장합니다.</SubText>
            <BugFolder>
              report/bugs/inbox/BUG-YYYYMMDD-001/source.md{"\n"}
              report/bugs/inbox/BUG-YYYYMMDD-001/meta.json{"\n"}
              report/bugs/inbox/BUG-YYYYMMDD-001/screenshot.png{"\n"}
              report/bugs/inbox/BUG-YYYYMMDD-001/fix-notes.md
            </BugFolder>
          </Card>
        </Stack>
      ) : null}
    </PageShell>
  );
}

function AdminTable({ title, description, rows }: { title: string; description: string; rows: string[][] }) {
  return (
    <TableCard>
      <AdminTableHeader>
        <div>
          <SectionTitle>{title}</SectionTitle>
          <SubText>{description}</SubText>
        </div>
      </AdminTableHeader>
      <TableScroll>
        <DataTable>
          <thead>
            <tr>
              <th>항목</th>
              <th>용도</th>
              <th>상태 / 위치</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, purpose, status]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{purpose}</td>
                <td>
                  {status.includes("/") ? <Mono>{status}</Mono> : <Badge $tone={statusTone(status)}>{status}</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </TableScroll>
    </TableCard>
  );
}

const TaskGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoint.tablet}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const TaskCard = styled.div`
  min-height: 96px;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.hover};

  span,
  small {
    display: block;
    color: ${({ theme }) => theme.color.textSubtle};
    font-size: 12px;
    line-height: 1.5;
  }

  strong {
    display: block;
    margin: 8px 0 4px;
    color: ${({ theme }) => theme.color.text};
    font-size: 20px;
    font-weight: 800;
  }
`;

const TabList = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  min-height: 36px;
  padding: 0 16px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.color.accent : theme.color.border)};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ $active, theme }) => ($active ? theme.color.accent : theme.color.panel)};
  color: ${({ $active, theme }) => ($active ? "#fff" : theme.color.textMuted)};
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
`;

const AdminTableHeader = styled(CardHeader)`
  align-items: center;
  margin-bottom: 0;
  padding: 18px 20px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    align-items: flex-start;
    padding: 16px;
  }
`;

const BugFolder = styled.pre`
  margin: 14px 0 0;
  padding: 14px;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.panel};
  color: ${({ theme }) => theme.color.textMuted};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 12px;
  line-height: 1.7;
`;
