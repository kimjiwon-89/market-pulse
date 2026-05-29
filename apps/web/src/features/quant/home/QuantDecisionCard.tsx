import { FavoriteFolderPicker } from "@/features/quant/FavoriteFolderPicker";
import { StockInitialBadge } from "@/features/quant/StockInitialBadge";
import type { QuantDecision } from "@/features/quant/types";
import {
  DecisionBadge,
  MobileBadgeSlot,
  MobileDecisionItem,
  MobileFavoriteSlot,
  MobileModelLine,
  MobileNameLine,
  ModelNameText,
} from "./styles";

export function ModelNameList({ names }: { names: string[] }) {
  return <ModelNameText>{names.join(", ")}</ModelNameText>;
}

export function DecisionCodeBadge({ code }: { code: QuantDecision["decisionCode"] }) {
  return <DecisionBadge $code={code}>{code}</DecisionBadge>;
}

interface QuantDecisionCardProps {
  item: QuantDecision;
}

export function QuantDecisionCard({ item }: QuantDecisionCardProps) {
  return (
    <MobileDecisionItem>
      <MobileBadgeSlot>
        <StockInitialBadge text={item.badgeText} tone={item.badgeTone} size={32} />
      </MobileBadgeSlot>
      <MobileNameLine>
        {item.assetName} <DecisionCodeBadge code={item.decisionCode} />
      </MobileNameLine>
      <MobileModelLine>
        <ModelNameList names={item.modelNames} />
      </MobileModelLine>
      <MobileFavoriteSlot>
        <FavoriteFolderPicker assetName={item.assetName} />
      </MobileFavoriteSlot>
    </MobileDecisionItem>
  );
}
