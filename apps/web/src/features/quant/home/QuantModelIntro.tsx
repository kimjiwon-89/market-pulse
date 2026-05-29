import { useNavigate } from "react-router-dom";
import {
  BodyCopy,
  BrandMark,
  Card,
  IntroHead,
  IntroLayout,
  SmallButton,
} from "./styles";

export function QuantModelIntro() {
  const navigate = useNavigate();

  return (
    <Card>
      <IntroLayout>
        <div>
          <IntroHead>
            <BrandMark>Q</BrandMark>
            <span>퀀트 모델이란?</span>
          </IntroHead>
          <BodyCopy>
            수많은 시장 데이터를 수학과 통계로 분석해 종목의 매력도를 점수로 계산하는 도구입니다.
            감정이 아닌 데이터로 판단해 더 일관된 투자를 도와줍니다.
          </BodyCopy>
        </div>
        <SmallButton type="button" onClick={() => navigate("/quant")}>
          더 알아보기
        </SmallButton>
      </IntroLayout>
    </Card>
  );
}
