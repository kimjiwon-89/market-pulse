import { useNavigate } from "react-router-dom";
import { FavoriteFolderPicker } from "@/features/quant/FavoriteFolderPicker";
import { StockInitialBadge } from "@/features/quant/StockInitialBadge";
import type { QuantDecision } from "@/features/quant/types";
import {
  BodyCopy,
  DecisionSectionCard,
  DecisionEmptyState,
  DecisionStockLink,
  DecisionTable,
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

interface QuantDecisionSectionProps {
  decisions: QuantDecision[];
}

export function QuantDecisionSection({ decisions }: QuantDecisionSectionProps) {
  const navigate = useNavigate();

  return (
    <DecisionSectionCard $flush>
      <SectionHead>
        <SectionTitle>오늘 추천 후보</SectionTitle>
        <SmallButton type="button" onClick={() => navigate("/quant/today")}>
          전체 목록 보기
        </SmallButton>
      </SectionHead>
      {decisions.length === 0 ? (
        <DecisionEmptyState>
          <BodyCopy>오늘 날짜로 새로 발생한 추천 후보가 없습니다. 과거 검증 후보는 각 모델 상세에서 확인해주세요.</BodyCopy>
        </DecisionEmptyState>
      ) : (
        <>
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
                {decisions.map((item) => (
                  <tr key={item.assetCode}>
                    <FirstDecisionCell>
                      <DecisionStockLink to={`/stock/${item.assetCode}`}>
                        <StockInitialBadge text={item.badgeText} tone={item.badgeTone} />
                        <div>
                          <DesktopStockName>
                            <span>{item.assetName}</span>
                            <DecisionCodeBadge code={item.decisionCode} />
                          </DesktopStockName>
                          <MonoSub>{item.assetCode}</MonoSub>
                        </div>
                      </DecisionStockLink>
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
            {decisions.map((item) => (
              <QuantDecisionCard key={item.assetCode} item={item} />
            ))}
          </MobileDecisionList>
        </>
      )}
    </DecisionSectionCard>
  );
}
