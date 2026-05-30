import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { getBullQuantModelDetail, getBullQuantReportDetail, getQuantHomeSummary } from "@/features/quant/api";
import type { QuantCandidateHistoryItem, QuantDecision, QuantModelCategory, QuantModelDetail, QuantModelSummary, QuantReportDetail, QuantReportSummary, QuantTradeHistoryItem } from "@/features/quant/types";
import {
  Badge,
  Card,
  CardHeader,
  CardLink,
  Chip,
  ChipRow,
  DataTable,
  Grid,
  Inline,
  Mono,
  MutedText,
  PageHeaderCard,
  PageHeaderMeta,
  PageShell,
  PageTitle,
  SectionTitle,
  Stack,
  SubText,
  TableCard,
  TableScroll,
  TextLink,
  ValueText,
} from "@/components/ui/Page";

type DetailTab = "overview" | "today" | "period" | "trades" | "reports";
type PeriodFilter = "today" | "7" | "30" | "all";
type SummaryTab = "candidate" | "entry" | "exit" | "capital" | "monthly";
type ModelCategoryFilter = "전체" | QuantModelCategory;

const EMPTY_DETAIL: QuantModelDetail = { candidates: [], trades: [] };

const summaryTabs: Array<{ value: SummaryTab; label: string }> = [
  { value: "candidate", label: "후보 선정" },
  { value: "entry", label: "진입" },
  { value: "exit", label: "손절 / 익절" },
  { value: "capital", label: "자금" },
  { value: "monthly", label: "이번달 수익률" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatNumber(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return value.toLocaleString("ko-KR");
}

function formatPct(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatPctPoint(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%p`;
}

function formatKrw(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function recentSixMonthReturns(currentMonthReturnPct?: number) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: `${date.getMonth() + 1}월`,
      monthKey,
      returnPct: index === 5 ? currentMonthReturnPct ?? 0 : 0,
    };
  });
}

function buildLineChartPoints(rows: ReturnType<typeof recentSixMonthReturns>) {
  const width = 520;
  const height = 150;
  const paddingX = 32;
  const paddingY = 22;
  const min = 0;
  const max = 100;
  const range = max - min;
  const xStep = (width - paddingX * 2) / Math.max(1, rows.length - 1);

  const points = rows.map((row, index) => {
    const previousReturnPct = index > 0 ? rows[index - 1].returnPct : 0;
    const value = Math.max(min, Math.min(max, row.returnPct));
    const x = paddingX + index * xStep;
    const y = paddingY + ((max - value) / range) * (height - paddingY * 2);
    const tooltipX = Math.min(width - 82, Math.max(82, x));
    return { ...row, deltaPct: row.returnPct - previousReturnPct, tooltipX, x, y };
  });
  const gridLines = Array.from({ length: 6 }, (_, index) => {
    const value = index * 20;
    return {
      value,
      label: `${value}%`,
      y: paddingY + ((max - value) / range) * (height - paddingY * 2),
    };
  });

  return {
    width,
    height,
    points,
    polyline: points.map((point) => `${point.x},${point.y}`).join(" "),
    gridLines,
  };
}

function dateOnly(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function monthOnly(value?: string) {
  return dateOnly(value).slice(0, 7);
}

function thisMonthKey() {
  return todayIso().slice(0, 7);
}

function formatMonthTitle(monthKey?: string) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return "월 요약";
  const [year, month] = monthKey.split("-");
  return `${year}년 ${Number(month)}월`;
}

function reportDateOnly(report: QuantReportSummary) {
  if (/^\d{4}-\d{2}-\d{2}/.test(report.publishedAt)) return report.publishedAt.slice(0, 10);
  const match = report.publishedAt.match(/(\d{2})\D(\d{2})/);
  if (!match) return todayIso();
  return `${todayIso().slice(0, 4)}-${match[1]}-${match[2]}`;
}

function inPeriod(rowDate: string, baseDate: string, period: PeriodFilter) {
  if (period === "all") return true;
  if (!rowDate) return false;
  if (period === "today") return rowDate === baseDate;

  const days = Number(period);
  const rowTime = new Date(`${rowDate}T00:00:00`).getTime();
  const baseTime = new Date(`${baseDate}T00:00:00`).getTime();
  if (Number.isNaN(rowTime) || Number.isNaN(baseTime)) return false;
  return rowTime <= baseTime && rowTime >= baseTime - (days - 1) * 24 * 60 * 60 * 1000;
}

function buyTradesAsCandidates(trades: QuantTradeHistoryItem[]): QuantCandidateHistoryItem[] {
  return trades
    .filter((trade) => trade.side === "BUY")
    .map((trade) => ({
      assetCode: trade.assetCode,
      assetName: trade.assetName,
      date: dateOnly(trade.fillTime),
      label: "진입 후보",
      reason: trade.reason,
      price: trade.fillPrice,
    }));
}

function uniqueAssetCount(items: Array<{ assetCode: string }>) {
  return new Set(items.map((item) => item.assetCode)).size;
}

function averageReturn(items: QuantTradeHistoryItem[]) {
  const realized = items
    .map((item) => item.realizedReturnPct)
    .filter((value): value is number => value !== undefined && value !== null && !Number.isNaN(value));
  if (realized.length === 0) return undefined;
  return realized.reduce((sum, value) => sum + value, 0) / realized.length;
}

function buildMonthlyDirection(trades: QuantTradeHistoryItem[], candidates: QuantCandidateHistoryItem[]) {
  const exits = trades.filter((item) => item.side === "SELL");
  const winners = exits.filter((item) => (item.realizedReturnPct ?? 0) > 0).length;
  const losers = exits.filter((item) => (item.realizedReturnPct ?? 0) < 0).length;
  const buyCodes = new Set(trades.filter((item) => item.side === "BUY").map((item) => item.assetCode));
  exits.forEach((item) => buyCodes.delete(item.assetCode));

  if (trades.length === 0 && candidates.length === 0) {
    return "해당 월에는 후보나 거래 내역이 없어 이후 흐름을 판단할 데이터가 아직 없습니다.";
  }
  if (buyCodes.size > 0) {
    return `청산되지 않은 진입 종목 ${buyCodes.size}개가 있어 이후 가격 흐름 확인이 필요합니다.`;
  }
  if (winners > losers) {
    return `청산 기준으로 수익 마감 종목이 더 많았습니다. 후보 이후 흐름은 우상향 쪽이 우세했습니다.`;
  }
  if (losers > winners) {
    return `청산 기준으로 손실 마감 종목이 더 많았습니다. 후보 이후 흐름은 방어적으로 봐야 합니다.`;
  }
  return "청산된 종목의 승패가 비슷해 이후 흐름은 중립으로 보는 편이 좋습니다.";
}

function isDetailTab(value: string | null): value is DetailTab {
  return value === "overview" || value === "today" || value === "period" || value === "trades" || value === "reports";
}

type ReportListItem = {
  id: string;
  kind: "monthly" | "backend";
  date: string;
  title: string;
  summary: string;
  meta: string;
  monthKey?: string;
  report?: QuantReportSummary;
};

export function QuantModels() {
  const { modelCode, monthKey } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [models, setModels] = useState<QuantModelSummary[]>([]);
  const [decisions, setDecisions] = useState<QuantDecision[]>([]);
  const [reports, setReports] = useState<QuantReportSummary[]>([]);
  const [selectedReportDetail, setSelectedReportDetail] = useState<QuantReportDetail | null>(null);
  const [detail, setDetail] = useState<QuantModelDetail>(EMPTY_DETAIL);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [activeSummaryTab, setActiveSummaryTab] = useState<SummaryTab>("candidate");
  const [period, setPeriod] = useState<PeriodFilter>("30");
  const [baseDate, setBaseDate] = useState(todayIso());
  const [tradePeriod, setTradePeriod] = useState<PeriodFilter>("30");
  const [tradeBaseDate, setTradeBaseDate] = useState(todayIso());
  const [reportPeriod, setReportPeriod] = useState<PeriodFilter>("30");
  const [reportBaseDate, setReportBaseDate] = useState(todayIso());
  const [modelCategoryFilter, setModelCategoryFilter] = useState<ModelCategoryFilter>("전체");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getQuantHomeSummary(),
      modelCode ? getBullQuantModelDetail().catch(() => EMPTY_DETAIL) : Promise.resolve(EMPTY_DETAIL),
    ])
      .then(([summary, modelDetail]) => {
        if (!mounted) return;
        setModels(summary.models);
        setDecisions(summary.decisions);
        setReports(summary.reports);
        setDetail(modelDetail);
        setLoaded(true);
      })
      .catch(() => {
        if (!mounted) return;
        setError(true);
        setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, [modelCode]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isDetailTab(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const reportId = searchParams.get("report");
    if (!reportId) {
      setSelectedReportDetail(null);
      return;
    }

    let mounted = true;
    getBullQuantReportDetail(reportId)
      .then((report) => {
        if (mounted) setSelectedReportDetail(report);
      })
      .catch(() => {
        if (mounted) setSelectedReportDetail(null);
      });

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const selected = modelCode ? models.find((model) => model.code === modelCode) : null;
  const modelCategoryFilters = useMemo<ModelCategoryFilter[]>(
    () => ["전체", ...Array.from(new Set(models.map((model) => model.category)))],
    [models],
  );
  const filteredModels = useMemo(
    () => modelCategoryFilter === "전체" ? models : models.filter((model) => model.category === modelCategoryFilter),
    [modelCategoryFilter, models],
  );

  const selectedDecisions = useMemo(
    () => (selected ? decisions.filter((item) => item.modelNames.includes(selected.name)) : []),
    [decisions, selected],
  );

  const candidateHistory = useMemo(
    () => [...detail.candidates, ...buyTradesAsCandidates(detail.trades)]
      .filter((item, index, items) => items.findIndex((other) =>
        other.assetCode === item.assetCode && other.date === item.date && other.label === item.label
      ) === index)
      .sort((a, b) => dateOnly(b.date).localeCompare(dateOnly(a.date))),
    [detail],
  );

  const periodCandidates = candidateHistory.filter((item) => inPeriod(dateOnly(item.date), baseDate, period));
  const periodTrades = detail.trades.filter((item) => inPeriod(dateOnly(item.fillTime), tradeBaseDate, tradePeriod));
  const selectedReportMonth = searchParams.get("month");
  const selectedReportId = searchParams.get("report");

  function selectTab(tab: DetailTab) {
    setActiveTab(tab);
    if (tab === "reports") {
      setSearchParams({ tab });
      return;
    }
    setSearchParams({});
  }

  function selectMonthlyReport(month: string) {
    setSearchParams({ tab: "reports", month });
  }

  function selectBackendReport(reportId: string) {
    setSearchParams({ tab: "reports", report: reportId });
  }

  function closeReportModal() {
    setSearchParams({ tab: "reports" });
  }

  if (modelCode && !loaded) {
    return (
      <PageShell $width="900px">
        <PageHeaderCard>
          <PageTitle>모델을 불러오는 중입니다</PageTitle>
        </PageHeaderCard>
      </PageShell>
    );
  }

  if (modelCode && !selected) {
    return (
      <PageShell $width="900px">
        <PageHeaderCard>
          <PageTitle>모델을 찾을 수 없습니다</PageTitle>
          <PageHeaderMeta><TextLink to="/quant">모델 목록으로</TextLink></PageHeaderMeta>
        </PageHeaderCard>
      </PageShell>
    );
  }

  if (selected) {
    const totalReturnPct = selected.totalReturnPct ?? 0;
    const totalProfit = selected.totalProfit ?? 0;
    const monthlyReturns = recentSixMonthReturns(selected.monthlyReturnPct);
    const monthlyLineChart = buildLineChartPoints(monthlyReturns);
    const currentMonthPoint = monthlyLineChart.points[monthlyLineChart.points.length - 1];
    const monthlyCandidates = candidateHistory.filter((item) => monthOnly(item.date) === monthKey);
    const monthlyTrades = detail.trades.filter((item) => monthOnly(item.fillTime) === monthKey);
    const monthlyTradeReturn = averageReturn(monthlyTrades);
    const monthlyReturnPct = monthKey === thisMonthKey() ? selected.monthlyReturnPct : monthlyTradeReturn;
    const monthlyAssetCount = uniqueAssetCount([...monthlyCandidates, ...monthlyTrades]);
    const monthlyDirection = buildMonthlyDirection(monthlyTrades, monthlyCandidates);
    const reportMonthKey = selectedReportMonth ?? thisMonthKey();
    const reportMonthCandidates = candidateHistory.filter((item) => monthOnly(item.date) === reportMonthKey);
    const reportMonthTrades = detail.trades.filter((item) => monthOnly(item.fillTime) === reportMonthKey);
    const reportMonthTradeReturn = averageReturn(reportMonthTrades);
    const reportMonthReturnPct = reportMonthKey === thisMonthKey() ? selected.monthlyReturnPct : reportMonthTradeReturn;
    const reportMonthAssetCount = uniqueAssetCount([...reportMonthCandidates, ...reportMonthTrades]);
    const reportMonthDirection = buildMonthlyDirection(reportMonthTrades, reportMonthCandidates);
    const reportItems: ReportListItem[] = [
      ...monthlyLineChart.points.map((point) => ({
        id: `month:${point.monthKey}`,
        kind: "monthly" as const,
        date: `${point.monthKey}-01`,
        title: `${formatMonthTitle(point.monthKey)} 월간 리포트`,
        summary: `${point.label} 수익률 ${formatPct(point.returnPct)}`,
        meta: "월간 요약",
        monthKey: point.monthKey,
      })),
      ...reports.map((report) => ({
        id: `report:${report.id}`,
        kind: "backend" as const,
        date: reportDateOnly(report),
        title: report.title,
        summary: report.summary,
        meta: `${report.publishedAt} · ${report.keywords.join(" · ")}`,
        report,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    const filteredReports = reportItems.filter((item) => inPeriod(item.date, reportBaseDate, reportPeriod));
    const selectedReportItem = selectedReportId
      ? reportItems.find((item) => item.kind === "backend" && item.report?.id === selectedReportId)
      : reportItems.find((item) => item.kind === "monthly" && item.monthKey === reportMonthKey) ?? reportItems[0];
    const showReportModal = Boolean(selectedReportMonth || selectedReportId);

    if (monthKey) {
      return (
        <PageShell $width="1100px">
          <ModelHeader>
            <div>
              <TextLink to={`/quant/${selected.code}`}>모델 상세로</TextLink>
              <PageTitle>{formatMonthTitle(monthKey)} Bull v4 월 요약</PageTitle>
            </div>
            <ModelMeta>
              <span>{selected.name}</span>
              <span>5.0.1</span>
              <span>{selected.monthlyMarketRegime ?? "BULL"}</span>
            </ModelMeta>
          </ModelHeader>

          <Grid $columns="repeat(4, minmax(0, 1fr))" $gap="12px">
            <Card $soft $pad="16px">
              <SectionTitle>월 수익률</SectionTitle>
              <ValueText $tone={(monthlyReturnPct ?? 0) >= 0 ? "up" : "down"}>{formatPct(monthlyReturnPct)}</ValueText>
              <MutedText>{monthKey === thisMonthKey() ? "이번달 집계" : "청산 거래 평균"}</MutedText>
            </Card>
            <Card $soft $pad="16px">
              <SectionTitle>거래</SectionTitle>
              <ValueText>{monthlyTrades.length}건</ValueText>
              <MutedText>진입/청산 기록</MutedText>
            </Card>
            <Card $soft $pad="16px">
              <SectionTitle>후보</SectionTitle>
              <ValueText>{monthlyCandidates.length}개</ValueText>
              <MutedText>월 후보 이력</MutedText>
            </Card>
            <Card $soft $pad="16px">
              <SectionTitle>종목</SectionTitle>
              <ValueText>{monthlyAssetCount}개</ValueText>
              <MutedText>중복 제외</MutedText>
            </Card>
          </Grid>

          <Grid $columns="1.1fr 0.9fr" $gap="12px">
            <InfoPanel>
              <SectionTitle>월 요약</SectionTitle>
              <RuleList>
                <li>{formatMonthTitle(monthKey)}에는 후보 {monthlyCandidates.length}개와 거래 {monthlyTrades.length}건이 기록됐습니다.</li>
                <li>월 수익률은 {formatPct(monthlyReturnPct)}로 표시합니다.</li>
                <li>{monthlyDirection}</li>
              </RuleList>
            </InfoPanel>
            <InfoPanel>
              <SectionTitle>이후 향방</SectionTitle>
              <SubText>{monthlyDirection}</SubText>
            </InfoPanel>
          </Grid>

          <Card>
            <CardHeader>
              <div>
                <SectionTitle>거래 내용</SectionTitle>
                <SubText>이 월에 기록된 Bull v4 진입과 청산입니다.</SubText>
              </div>
              <Badge $tone="flat">{monthlyTrades.length}건</Badge>
            </CardHeader>
            <TradeTable items={monthlyTrades} />
          </Card>

          <Card>
            <CardHeader>
              <div>
                <SectionTitle>후보 종목</SectionTitle>
                <SubText>이 월에 후보로 잡힌 종목과 근거입니다.</SubText>
              </div>
              <Badge $tone="flat">{monthlyCandidates.length}개</Badge>
            </CardHeader>
            <CandidateTable items={monthlyCandidates} emptyText="해당 월에 표시할 후보 이력이 없습니다." />
          </Card>
        </PageShell>
      );
    }

    return (
      <PageShell $width="1100px">
        <ModelHeader>
          <PageTitle>{selected.name}</PageTitle>
          <ModelMeta>
            <span>5.0.1</span>
            <span>1억원 paper</span>
            <span>1종목 1천만원</span>
          </ModelMeta>
        </ModelHeader>

        <KpiRail>
          <KpiCard $soft $pad="16px">
            <SectionTitle>수익률</SectionTitle>
            <ValueText $tone={totalReturnPct >= 0 ? "up" : "down"}>{formatPct(selected.totalReturnPct)}</ValueText>
            <MutedText>Bull v4 누적 성과</MutedText>
          </KpiCard>
          <KpiCard $soft $pad="16px">
            <SectionTitle>수익금</SectionTitle>
            <ValueText $tone={totalProfit >= 0 ? "up" : "down"}>{formatKrw(selected.totalProfit)}</ValueText>
            <MutedText>현재 paper 기준</MutedText>
          </KpiCard>
          <KpiCard $soft $pad="16px">
            <SectionTitle>현재 자금</SectionTitle>
            <ValueText>{formatKrw(selected.currentCapital)}</ValueText>
            <MutedText>시드머니와 손익 합산</MutedText>
          </KpiCard>
          <KpiCard $soft $pad="16px">
            <SectionTitle>이번달 시장상황</SectionTitle>
            <ValueText>{selected.monthlyMarketRegime ?? "BULL"}</ValueText>
            <MutedText>BULL / SIDEWAY / BEAR</MutedText>
          </KpiCard>
        </KpiRail>

        <AdSlot>
          <SectionTitle>광고 영역</SectionTitle>
          <MutedText>모델 상세 콘텐츠 사이에 배치되는 광고 슬롯입니다.</MutedText>
        </AdSlot>

        <Card>
          <TabList role="tablist" aria-label="Bull v4 상세 보기">
            <TabButton role="tab" aria-selected={activeTab === "overview"} $active={activeTab === "overview"} onClick={() => selectTab("overview")}>
              요약
            </TabButton>
            <TabButton role="tab" aria-selected={activeTab === "today"} $active={activeTab === "today"} onClick={() => selectTab("today")}>
              오늘 후보
            </TabButton>
            <TabButton role="tab" aria-selected={activeTab === "period"} $active={activeTab === "period"} onClick={() => selectTab("period")}>
              기간별 후보
            </TabButton>
            <TabButton role="tab" aria-selected={activeTab === "trades"} $active={activeTab === "trades"} onClick={() => selectTab("trades")}>
              거래 내역
            </TabButton>
            <TabButton role="tab" aria-selected={activeTab === "reports"} $active={activeTab === "reports"} onClick={() => selectTab("reports")}>
              리포트
            </TabButton>
          </TabList>

          {activeTab === "overview" ? (
            <Stack>
              <InfoPanel>
                <SummaryTabList role="tablist" aria-label="요약 세부 보기">
                  {summaryTabs.map((tab) => (
                    <SummaryTabButton
                      key={tab.value}
                      type="button"
                      role="tab"
                      aria-selected={activeSummaryTab === tab.value}
                      $active={activeSummaryTab === tab.value}
                      onClick={() => setActiveSummaryTab(tab.value)}
                    >
                      {tab.label}
                    </SummaryTabButton>
                  ))}
                </SummaryTabList>

                {activeSummaryTab === "candidate" ? (
                  <RuleSection>
                    <SectionTitle>후보 선정 규칙</SectionTitle>
                    <RuleList>
                      <li>원천 데이터는 `market_daily_price` 기반 리플레이 결과를 사용합니다.</li>
                      <li>`filtered_w4_range20_entry_confirmation` 파이프라인을 통과한 종목만 후보로 봅니다.</li>
                      <li>후보는 최근 진입일 기준으로 정렬하고, 화면에는 최근 10개까지 노출합니다.</li>
                    </RuleList>
                  </RuleSection>
                ) : null}

                {activeSummaryTab === "entry" ? (
                  <RuleSection>
                    <SectionTitle>진입 규칙</SectionTitle>
                    <RuleList>
                      <li>신호일과 실제 진입일을 분리해서 기록합니다.</li>
                      <li>진입은 `entry_date`와 `entry_price` 기준으로 계산합니다.</li>
                      <li>후보가 있어도 진입 확인 조건을 통과하지 않으면 거래 내역에 남기지 않습니다.</li>
                    </RuleList>
                  </RuleSection>
                ) : null}

                {activeSummaryTab === "exit" ? (
                  <RuleSection>
                    <SectionTitle>손절 / 익절 규칙</SectionTitle>
                    <RuleList>
                      <li>청산은 Bull v4 체크포인트/exit rule에 의해 닫힌 거래만 반영합니다.</li>
                      <li>손절 기준은 리플레이 exit plan 기준 -18% 구간을 사용합니다.</li>
                      <li>표시 수익률은 `entry_price`부터 `exit_price`까지의 완료 거래 기준입니다.</li>
                    </RuleList>
                  </RuleSection>
                ) : null}

                {activeSummaryTab === "capital" ? (
                  <RuleSection>
                    <SectionTitle>자금 / 포지션 규칙</SectionTitle>
                    <RuleList>
                      <li>운영 시드머니는 1억원 paper 기준입니다.</li>
                      <li>종목당 진입 금액은 1천만원 paper 기준입니다.</li>
                      <li>모델 성과는 완료된 리플레이 거래를 누적해 현재 자금과 수익률로 환산합니다.</li>
                    </RuleList>
                  </RuleSection>
                ) : null}

                {activeSummaryTab === "monthly" ? (
                  <RuleSection>
                    <SectionTitle>이번달 수익률</SectionTitle>
                  <MetricRows>
                    <MetricRow>
                      <span>이번 달</span>
                      <strong>{formatPct(selected.monthlyReturnPct)}</strong>
                    </MetricRow>
                    <MetricRow>
                      <span>전월 대비</span>
                      <strong>{formatPctPoint(currentMonthPoint?.deltaPct)}</strong>
                    </MetricRow>
                    <MetricRow>
                      <span>누적</span>
                      <strong>{formatPct(selected.totalReturnPct)}</strong>
                    </MetricRow>
                    <MetricRow>
                      <span>현재 자금</span>
                      <strong>{formatKrw(selected.currentCapital)}</strong>
                    </MetricRow>
                  </MetricRows>
                  </RuleSection>
                ) : null}
              </InfoPanel>
              <InfoPanel>
                <SectionTitle>최근 6개월 수익률</SectionTitle>
                <MonthChart>
                  <LineChartSvg
                    role="img"
                    aria-label="최근 6개월 월별 수익률 선 그래프"
                    viewBox={`0 0 ${monthlyLineChart.width} ${monthlyLineChart.height}`}
                    preserveAspectRatio="none"
                  >
                    {monthlyLineChart.gridLines.map((line) => (
                      <line key={line.label} x1="20" x2={monthlyLineChart.width - 20} y1={line.y} y2={line.y} />
                    ))}
                    <polyline points={monthlyLineChart.polyline} />
                    {monthlyLineChart.points.map((point) => (
                      <g
                        key={point.label}
                        aria-label={`${point.label} 수익률 ${formatPct(point.returnPct)}, 전월 대비 ${formatPctPoint(point.deltaPct)}`}
                        tabIndex={0}
                      >
                        <circle cx={point.x} cy={point.y} r="2" />
                        <ChartTooltip x={point.tooltipX} y={Math.max(28, point.y - 22)} textAnchor="middle">
                          {formatPct(point.returnPct)}
                        </ChartTooltip>
                        <ChartTooltip x={point.tooltipX} y={Math.max(28, point.y - 22) + 14} textAnchor="middle">
                          전월 대비 {formatPctPoint(point.deltaPct)}
                        </ChartTooltip>
                      </g>
                    ))}
                  </LineChartSvg>
                  <LineChartLabels>
                    {monthlyLineChart.points.map((point) => (
                      <MonthPoint key={point.label}>
                        <MonthLink to={`/quant/${selected.code}?tab=reports&month=${point.monthKey}`}>
                          {point.label}
                        </MonthLink>
                      </MonthPoint>
                    ))}
                  </LineChartLabels>
                </MonthChart>
              </InfoPanel>
            </Stack>
          ) : null}

          {activeTab === "today" ? (
            <Stack>
              <CandidateTable items={selectedDecisions.map((item) => ({
                assetCode: item.assetCode,
                assetName: item.assetName,
                date: baseDate,
                label: item.decisionLabel,
                reason: item.reasonBullets.join(", "),
              }))} emptyText="현재 후보 종목이 없습니다. 조건을 통과한 종목만 보여줍니다." />
            </Stack>
          ) : null}

          {activeTab === "period" ? (
            <Stack>
              <FilterBar>
                <Inline $wrap>
                  <FilterLabel>기준일</FilterLabel>
                  <DateInput type="date" value={baseDate} onChange={(event) => setBaseDate(event.target.value)} />
                </Inline>
                <Inline $wrap>
                  {[
                    ["today", "당일"],
                    ["7", "최근 7일"],
                    ["30", "최근 30일"],
                    ["all", "전체"],
                  ].map(([value, label]) => (
                    <FilterButton key={value} $active={period === value} onClick={() => setPeriod(value as PeriodFilter)}>
                      {label}
                    </FilterButton>
                  ))}
                </Inline>
              </FilterBar>
              <CandidateTable items={periodCandidates} emptyText="선택한 기간에 표시할 후보 이력이 없습니다." />
            </Stack>
          ) : null}

          {activeTab === "trades" ? (
            <Stack>
              <FilterBar>
                <Inline $wrap>
                  <FilterLabel>기준일</FilterLabel>
                  <DateInput type="date" value={tradeBaseDate} onChange={(event) => setTradeBaseDate(event.target.value)} />
                </Inline>
                <Inline $wrap>
                  {[
                    ["today", "당일"],
                    ["7", "최근 7일"],
                    ["30", "최근 30일"],
                    ["all", "전체"],
                  ].map(([value, label]) => (
                    <FilterButton key={value} $active={tradePeriod === value} onClick={() => setTradePeriod(value as PeriodFilter)}>
                      {label}
                    </FilterButton>
                  ))}
                </Inline>
              </FilterBar>
              <TradeTable items={periodTrades} />
            </Stack>
          ) : null}

          {activeTab === "reports" ? (
            <Stack>
              <FilterBar>
                <Inline $wrap>
                  <FilterLabel>기준일</FilterLabel>
                  <DateInput type="date" value={reportBaseDate} onChange={(event) => setReportBaseDate(event.target.value)} />
                </Inline>
                <Inline $wrap>
                  {[
                    ["today", "당일"],
                    ["7", "최근 7일"],
                    ["30", "최근 30일"],
                    ["all", "전체"],
                  ].map(([value, label]) => (
                    <FilterButton key={value} $active={reportPeriod === value} onClick={() => setReportPeriod(value as PeriodFilter)}>
                      {label}
                    </FilterButton>
                  ))}
                </Inline>
              </FilterBar>

              <TableCard>
                <TableScroll>
                  <DataTable>
                    <thead>
                      <tr>
                        <th>날짜</th>
                        <th>리포트</th>
                        <th>구분</th>
                        <th>요약</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((item) => (
                        <tr key={item.id}>
                          <td>{item.date}</td>
                          <td>
                            <ReportSelectButton
                              type="button"
                              $active={selectedReportItem?.id === item.id}
                              onClick={() => item.kind === "monthly" ? selectMonthlyReport(item.monthKey ?? thisMonthKey()) : selectBackendReport(item.report?.id ?? "")}
                            >
                              {item.title}
                            </ReportSelectButton>
                          </td>
                          <td><Badge $tone={item.kind === "monthly" ? "accent" : "flat"}>{item.kind === "monthly" ? "월간" : "모델 작성"}</Badge></td>
                          <td>
                            <span>{item.summary}</span>
                            <MutedText>{item.meta}</MutedText>
                          </td>
                        </tr>
                      ))}
                      {filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan={4}>선택한 기간에 표시할 리포트가 없습니다.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </DataTable>
                </TableScroll>
              </TableCard>

              {showReportModal && selectedReportItem ? (
                <ModalOverlay role="presentation" onClick={closeReportModal}>
                  <ReportModal role="dialog" aria-modal="true" aria-label={selectedReportItem.title} onClick={(event) => event.stopPropagation()}>
                    <ModalHeader>
                      <div>
                        <SectionTitle>{selectedReportItem.kind === "monthly" ? `${formatMonthTitle(reportMonthKey)} 월간 리포트` : selectedReportDetail?.title ?? selectedReportItem.title}</SectionTitle>
                        <SubText>
                          {selectedReportItem.kind === "monthly"
                            ? "선택한 월의 수익률, 거래 내용, 후보, 이후 향방을 요약합니다."
                            : selectedReportDetail?.summary ?? selectedReportItem.summary}
                        </SubText>
                      </div>
                      <IconButton type="button" onClick={closeReportModal} aria-label="리포트 닫기">×</IconButton>
                    </ModalHeader>

                    {selectedReportItem.kind === "monthly" ? (
                      <Stack>
                        <Grid $columns="repeat(4, minmax(0, 1fr))" $gap="12px">
                          <MetricMini>
                            <span>월 수익률</span>
                            <strong>{formatPct(reportMonthReturnPct)}</strong>
                          </MetricMini>
                          <MetricMini>
                            <span>거래 건수</span>
                            <strong>{reportMonthTrades.length}건</strong>
                          </MetricMini>
                          <MetricMini>
                            <span>후보 수</span>
                            <strong>{reportMonthCandidates.length}개</strong>
                          </MetricMini>
                          <MetricMini>
                            <span>중복 제외 종목 수</span>
                            <strong>{reportMonthAssetCount}개</strong>
                          </MetricMini>
                        </Grid>

                        <Grid $columns="1fr 1fr" $gap="12px">
                          <InfoPanel>
                            <SectionTitle>월 요약</SectionTitle>
                            <RuleList>
                              <li>{formatMonthTitle(reportMonthKey)}에는 후보 {reportMonthCandidates.length}개와 거래 {reportMonthTrades.length}건이 기록됐습니다.</li>
                              <li>월 수익률은 {formatPct(reportMonthReturnPct)}로 표시합니다.</li>
                            </RuleList>
                          </InfoPanel>
                          <InfoPanel>
                            <SectionTitle>이후 향방</SectionTitle>
                            <SubText>{reportMonthDirection}</SubText>
                          </InfoPanel>
                        </Grid>

                        <section>
                          <CardHeader>
                            <SectionTitle>거래 내용</SectionTitle>
                            <Badge $tone="flat">{reportMonthTrades.length}건</Badge>
                          </CardHeader>
                          <TradeTable items={reportMonthTrades} />
                        </section>

                        <section>
                          <CardHeader>
                            <SectionTitle>후보 종목</SectionTitle>
                            <Badge $tone="flat">{reportMonthCandidates.length}개</Badge>
                          </CardHeader>
                          <CandidateTable items={reportMonthCandidates} emptyText="해당 월에 표시할 후보 이력이 없습니다." />
                        </section>
                      </Stack>
                    ) : (
                      <Stack>
                        <ChipRow>
                          {(selectedReportDetail?.keywords ?? selectedReportItem.report?.keywords ?? []).map((keyword) => <Chip key={keyword}>{keyword}</Chip>)}
                        </ChipRow>
                        <InfoPanel>
                          <SectionTitle>리포트 본문</SectionTitle>
                          <RuleList>
                            {(selectedReportDetail?.sections ?? []).map((section, index) => <li key={`${section}-${index}`}>{section}</li>)}
                            {(selectedReportDetail?.checkpoints ?? []).map((checkpoint, index) => <li key={`${checkpoint}-${index}`}>{checkpoint}</li>)}
                            {!selectedReportDetail ? <li>리포트 상세를 불러오고 있습니다.</li> : null}
                            {selectedReportDetail && selectedReportDetail.sections.length === 0 && selectedReportDetail.checkpoints.length === 0 ? <li>표시할 상세 본문이 없습니다.</li> : null}
                          </RuleList>
                        </InfoPanel>
                      </Stack>
                    )}
                  </ReportModal>
                </ModalOverlay>
              ) : null}
            </Stack>
          ) : null}
        </Card>

      </PageShell>
    );
  }

  return (
    <PageShell $width="1100px">
      <PageHeaderCard>
        <PageTitle>모델 목록</PageTitle>
        <PageHeaderMeta>
          <MutedText>{filteredModels.length} / {models.length}개</MutedText>
        </PageHeaderMeta>
      </PageHeaderCard>
      {error ? (
        <Card $soft>
          <SubText>실제 모델 목록을 불러오지 못했습니다.</SubText>
        </Card>
      ) : null}
      <FilterBar>
        <Inline $wrap>
          <FilterLabel>카테고리</FilterLabel>
          {modelCategoryFilters.map((category) => (
            <FilterButton
              key={category}
              type="button"
              $active={modelCategoryFilter === category}
              onClick={() => setModelCategoryFilter(category)}
            >
              {category}
            </FilterButton>
          ))}
        </Inline>
      </FilterBar>
      <Grid>
        {filteredModels.map((model) => (
          <ModelCardLink key={model.code} to={`/quant/${model.code}`}>
            <CardHeader>
              <SectionTitle>{model.name}</SectionTitle>
              <Badge $tone="accent">{model.status}</Badge>
            </CardHeader>
            <SubText>{model.plainName}</SubText>
            <ChipRow>
              <Chip $active>{model.category}</Chip>
              {model.focus.map((item) => <Chip key={item}>{item}</Chip>)}
            </ChipRow>
            <MutedText>오늘 종목 {model.todayCount}개 · {model.marketMode}</MutedText>
          </ModelCardLink>
        ))}
        {models.length === 0 && !error ? (
          <Card>
            <SectionTitle>불러오는 중</SectionTitle>
            <SubText>Bull v4 모델 상태를 확인하고 있습니다.</SubText>
          </Card>
        ) : null}
        {models.length > 0 && filteredModels.length === 0 ? (
          <Card>
            <SectionTitle>표시할 모델이 없습니다</SectionTitle>
            <SubText>선택한 카테고리에 해당하는 모델이 없습니다.</SubText>
          </Card>
        ) : null}
      </Grid>
    </PageShell>
  );
}

function CandidateTable({ items, emptyText }: { items: QuantCandidateHistoryItem[]; emptyText: string }) {
  return (
    <TableCard>
      <TableScroll>
        <DataTable>
          <thead>
            <tr>
              <th>날짜</th>
              <th>종목</th>
              <th>상태</th>
              <th>근거</th>
              <th className="num">가격</th>
              <th className="num">수익률</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.assetCode}-${item.date}-${item.label}`}>
                <td>{item.date || "-"}</td>
                <td>{item.assetName} <MutedCode>{item.assetCode}</MutedCode></td>
                <td><Badge $tone="accent">{item.label}</Badge></td>
                <td>{item.reason}</td>
                <td className="num">{formatNumber(item.price)}</td>
                <td className="num">{formatPct(item.returnPct)}</td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>{emptyText}</td>
              </tr>
            ) : null}
          </tbody>
        </DataTable>
      </TableScroll>
    </TableCard>
  );
}

function TradeTable({ items }: { items: QuantTradeHistoryItem[] }) {
  return (
    <TableCard>
      <TableScroll>
        <DataTable>
          <thead>
            <tr>
              <th>시간</th>
              <th>종목</th>
              <th>구분</th>
              <th>사유</th>
              <th className="num">체결가</th>
              <th className="num">실현 수익률</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.tradeId}>
                <td>{item.fillTime || "-"}</td>
                <td>{item.assetName} <MutedCode>{item.assetCode}</MutedCode></td>
                <td><Badge $tone={item.side === "BUY" ? "accent" : "flat"}>{item.side}</Badge></td>
                <td>{item.reason}</td>
                <td className="num">{formatNumber(item.fillPrice)}</td>
                <td className="num">{formatPct(item.realizedReturnPct)}</td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>아직 표시할 매매 내역이 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </DataTable>
      </TableScroll>
    </TableCard>
  );
}

const AdSlot = styled(Card)`
  min-height: 96px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-style: dashed;
  background: ${({ theme }) => theme.color.softPanel};
`;

const ModelCardLink = styled(CardLink)`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-block: 28px;

  ${CardHeader} {
    margin-bottom: 0;
  }

  ${SubText},
  ${MutedText} {
    margin: 0;
  }

  ${ChipRow} {
    margin-top: 0;
  }
`;

const ModelHeader = styled(Card)`
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  h1 {
    margin: 0;
    font-size: 24px;
    line-height: 1.2;
  }
`;

const ModelMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;

  > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    padding: 6px 10px;
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.radius.small};
    color: ${({ theme }) => theme.color.textMuted};
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
  }
`;

const KpiRail = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-right: -16px;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
  }
`;

const KpiCard = styled(Card)`
  min-width: 0;

  @media (max-width: ${({ theme }) => theme.breakpoint.mobile}) {
    flex: 0 0 38%;
    max-width: 168px;
    min-height: 100px;
    padding: 12px;
    scroll-snap-align: start;

    h2 {
      font-size: 12px;
    }

    ${ValueText} {
      font-size: 20px;
      line-height: 1.15;
    }

    ${MutedText} {
      font-size: 11px;
      line-height: 1.3;
    }
  }
`;

const InfoPanel = styled.div`
  min-width: 0;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.softPanel};
`;

const RuleList = styled.ul`
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
  padding-left: 18px;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 13px;
  line-height: 1.55;
`;

const SummaryTabList = styled.div`
  display: flex;
  gap: 6px;
  padding-bottom: 14px;
  border-bottom: 1px solid ${({ theme }) => theme.color.divider};
  overflow-x: auto;
`;

const SummaryTabButton = styled.button<{ $active?: boolean }>`
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.color.accent : theme.color.border)};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ $active, theme }) => ($active ? theme.color.accent : theme.color.panel)};
  color: ${({ $active, theme }) => ($active ? "#fff" : theme.color.textMuted)};
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
`;

const RuleSection = styled.div`
  padding-top: 14px;
`;

const MetricRows = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 12px;
`;

const MetricRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.color.divider};
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 13px;

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  strong {
    color: ${({ theme }) => theme.color.text};
    font-size: 15px;
    white-space: nowrap;
  }
`;

const MetricMini = styled.div`
  min-width: 0;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.small};
  background: ${({ theme }) => theme.color.panel};

  span {
    display: block;
    color: ${({ theme }) => theme.color.textSubtle};
    font-size: 12px;
    font-weight: 700;
  }

  strong {
    display: block;
    margin-top: 6px;
    color: ${({ theme }) => theme.color.text};
    font-size: 16px;
  }
`;

const MonthChart = styled.div`
  position: relative;
  display: grid;
  gap: 8px;
  margin-top: 14px;
`;

const LineChartSvg = styled.svg`
  width: 100%;
  height: 150px;
  overflow: visible;
  border-radius: ${({ theme }) => theme.radius.small};
  background: ${({ theme }) => theme.color.panel};
  border: 1px solid ${({ theme }) => theme.color.border};

  line {
    stroke: ${({ theme }) => theme.color.divider};
    stroke-width: 1;
  }

  polyline {
    fill: none;
    stroke: ${({ theme }) => theme.color.up};
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  circle {
    fill: ${({ theme }) => theme.color.panel};
    stroke: ${({ theme }) => theme.color.up};
    stroke-width: 1.5;
  }

  g {
    cursor: default;
    outline: none;
  }

  g:hover text,
  g:focus text {
    opacity: 1;
  }
`;

const LineChartLabels = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
`;

const ChartTooltip = styled.text`
  opacity: 0;
  fill: ${({ theme }) => theme.color.textSubtle};
  stroke: none;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
`;

const MonthPoint = styled.div`
  min-width: 0;
  display: grid;
  text-align: center;
`;

const MonthLink = styled(TextLink)`
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.color.accent};
    text-decoration: underline;
  }
`;

const ReportSelectButton = styled.button<{ $active?: boolean }>`
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $active, theme }) => ($active ? theme.color.accent : theme.color.text)};
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.accent};
    text-decoration: underline;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 20px;
  background: rgb(24 24 27 / 42%);
  overflow-y: auto;
`;

const ReportModal = styled.div`
  width: min(100%, 1040px);
  max-height: calc(100vh - 96px);
  overflow: auto;
  display: grid;
  gap: 18px;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.panel};
  box-shadow: 0 24px 60px rgb(24 24 27 / 22%);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid ${({ theme }) => theme.color.divider};
`;

const IconButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.panel};
  color: ${({ theme }) => theme.color.textMuted};
  font: inherit;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.hover};
    color: ${({ theme }) => theme.color.text};
  }
`;

const TabList = styled.div`
  display: flex;
  gap: 6px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.color.divider};
  margin-bottom: 16px;
  overflow-x: auto;
`;

const TabButton = styled.button<{ $active?: boolean }>`
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.color.accent : theme.color.border)};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ $active, theme }) => ($active ? theme.color.accent : theme.color.panel)};
  color: ${({ $active, theme }) => ($active ? "#fff" : theme.color.textMuted)};
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const FilterLabel = styled.span`
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 12px;
  font-weight: 700;
`;

const DateInput = styled.input`
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.control};
  color: ${({ theme }) => theme.color.text};
  font: inherit;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.color.accentBorder : theme.color.border)};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ $active, theme }) => ($active ? theme.color.accentSoft : theme.color.panel)};
  color: ${({ $active, theme }) => ($active ? theme.color.accent : theme.color.textMuted)};
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`;

const MutedCode = styled(Mono)`
  color: ${({ theme }) => theme.color.textSubtle};
  font-size: 11px;
`;
