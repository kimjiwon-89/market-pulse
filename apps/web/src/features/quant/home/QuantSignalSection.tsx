import { useMemo, useState } from "react";
import { StockInitialBadge } from "@/features/quant/StockInitialBadge";
import type { QuantDecisionCode } from "@/features/quant/quantTypes";
import type { QuantDecision } from "@/features/quant/types";
import { DecisionCodeBadge } from "./QuantDecisionCard";
import {
  BodyCopy,
  QuantSignalCard,
  QuantSignalEmpty,
  QuantSignalList,
  QuantSignalMeta,
  QuantSignalName,
  QuantSignalReason,
  QuantSignalReasonRow,
  QuantSignalStock,
  QuantSignalTabButton,
  QuantSignalTabs,
  SignalSectionCard,
  SectionHead,
  SectionTitle,
} from "./styles";

const QUANT_SIGNAL_TABS: QuantDecisionCode[] = ["BUY", "SIDE", "SELL", "WARNING"];

interface QuantSignalSectionProps {
  decisions: QuantDecision[];
}

export function QuantSignalSection({ decisions }: QuantSignalSectionProps) {
  const [activeTab, setActiveTab] = useState<QuantDecisionCode>("BUY");
  const filteredDecisions = useMemo(
    () => decisions.filter((item) => item.decisionCode === activeTab),
    [activeTab, decisions],
  );

  return (
    <SignalSectionCard $flush>
      <SectionHead>
        <div>
          <SectionTitle>퀀트 모델 신호</SectionTitle>
          <BodyCopy>오늘의 종목과 시장을 같이 봅니다.</BodyCopy>
        </div>
      </SectionHead>
      <QuantSignalTabs role="tablist" aria-label="퀀트 모델 신호 분류">
        {QUANT_SIGNAL_TABS.map((tab) => (
          <QuantSignalTabButton
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            $active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </QuantSignalTabButton>
        ))}
      </QuantSignalTabs>
      <QuantSignalList>
        {filteredDecisions.length > 0 ? filteredDecisions.map((item) => (
          <QuantSignalCard key={item.assetCode}>
            <QuantSignalStock>
              <StockInitialBadge text={item.badgeText} tone={item.badgeTone} size={36} />
              <div>
                <QuantSignalName>
                  <span>{item.assetName}</span>
                  <DecisionCodeBadge code={item.decisionCode} />
                </QuantSignalName>
                <QuantSignalMeta>{item.modelNames.join(", ")}</QuantSignalMeta>
              </div>
            </QuantSignalStock>
            <QuantSignalReasonRow>
              {item.reasonBullets.slice(0, 2).map((reason) => (
                <QuantSignalReason key={reason}>{reason}</QuantSignalReason>
              ))}
            </QuantSignalReasonRow>
          </QuantSignalCard>
        )) : (
          <QuantSignalEmpty>{activeTab} 신호가 없습니다.</QuantSignalEmpty>
        )}
      </QuantSignalList>
    </SignalSectionCard>
  );
}
