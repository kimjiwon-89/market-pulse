import { useEffect, useState } from "react";
import { getQuantHomeSummary } from "@/features/quant/api";
import type { QuantHomeSummary } from "@/features/quant/types";
import { QuantDecisionSection } from "./QuantDecisionSection";
import { QuantHeroSection } from "./QuantHeroSection";
import { QuantAdCard, QuantNewsCard } from "./QuantUtilityRail";
import { BodyCopy, Card, HomeContentGrid, HomeShell, HomeTopGrid, MobileOnly, Stack } from "./styles";

const emptySummary: QuantHomeSummary = {
  decisions: [],
  kpis: [
    { id: "look", label: "추천 후보", value: "0개", hint: "모델 추천 후보", direction: "flat" },
    { id: "caution", label: "경고", value: "0건", hint: "최신 리포트 기준", direction: "flat" },
    { id: "performance", label: "누적 수익률", value: "-", hint: "모델 검증 성과", direction: "flat" },
    { id: "reports", label: "리포트", value: "0개", hint: "백엔드 생성 리포트", direction: "flat" },
  ],
  models: [],
  reports: [],
  news: [],
};

export function QuantHomePage() {
  const [summary, setSummary] = useState<QuantHomeSummary>(emptySummary);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    const load = () => getQuantHomeSummary()
      .then((data) => {
        if (!mounted) return;
        setSummary(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!mounted) return;
        setStatus("error");
      });
    load();
    const intervalId = window.setInterval(load, 60_000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <HomeShell>
      <Stack>
        {status === "error" ? (
          <Card $soft>
            <BodyCopy>실제 모델 데이터를 불러오지 못했습니다. 백엔드 API 연결 상태를 확인해주세요.</BodyCopy>
          </Card>
        ) : null}
        <HomeTopGrid>
          <QuantHeroSection summary={summary} />
          <QuantAdCard slot="desktop_side_top" />
        </HomeTopGrid>
        <MobileOnly>
          <QuantAdCard slot="mobile_inline_top" />
        </MobileOnly>
        <HomeContentGrid>
          <QuantDecisionSection decisions={summary.decisions} />
          <QuantNewsCard news={summary.news} />
        </HomeContentGrid>
      </Stack>
    </HomeShell>
  );
}
