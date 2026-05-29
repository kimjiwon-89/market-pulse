import { useNavigate } from "react-router-dom";
import { FavoriteFolderPicker } from "@/features/quant/FavoriteFolderPicker";
import { StockInitialBadge } from "@/features/quant/StockInitialBadge";
import { quantDecisions } from "@/features/quant/mock";
import {
  DecisionSectionCard,
  DecisionTable,
  DesktopStockCell,
  DesktopStockName,
  DesktopTableWrap,
  FavoriteCell,
  FirstDecisionCell,
  FirstDecisionHeader,
  MobileDecisionList,
  MonoSub,
  SectionHead,
  SectionTitle,
  SmallButton,
} from "./styles";
import { DecisionCodeBadge, ModelNameList, QuantDecisionCard } from "./QuantDecisionCard";

export function QuantDecisionSection() {
  const navigate = useNavigate();

  return (
    <DecisionSectionCard $flush>
      <SectionHead>
        <SectionTitle>오늘의 종목 판단</SectionTitle>
        <SmallButton type="button" onClick={() => navigate("/quant/today")}>
          전체 목록 보기
        </SmallButton>
      </SectionHead>
      <DesktopTableWrap>
        <DecisionTable>
          <thead>
            <tr>
              <FirstDecisionHeader>종목</FirstDecisionHeader>
              <th>신호 모델</th>
              <th>이유</th>
              <th>조심할 점</th>
              <th aria-label="관심" />
            </tr>
          </thead>
          <tbody>
            {quantDecisions.map((item) => (
              <tr key={item.assetCode}>
                <FirstDecisionCell>
                  <DesktopStockCell>
                    <StockInitialBadge text={item.badgeText} tone={item.badgeTone} />
                    <div>
                      <DesktopStockName>
                        <span>{item.assetName}</span>
                        <DecisionCodeBadge code={item.decisionCode} />
                      </DesktopStockName>
                      <MonoSub>{item.assetCode}</MonoSub>
                    </div>
                  </DesktopStockCell>
                </FirstDecisionCell>
                <td>
                  <ModelNameList names={item.modelNames} />
                </td>
                <td>{item.reasonBullets.join(", ")}</td>
                <td>{item.cautionBullets.join(", ")}</td>
                <FavoriteCell as="td">
                  <FavoriteFolderPicker assetName={item.assetName} />
                </FavoriteCell>
              </tr>
            ))}
          </tbody>
        </DecisionTable>
      </DesktopTableWrap>
      <MobileDecisionList>
        {quantDecisions.map((item) => (
          <QuantDecisionCard key={item.assetCode} item={item} />
        ))}
      </MobileDecisionList>
    </DecisionSectionCard>
  );
}
