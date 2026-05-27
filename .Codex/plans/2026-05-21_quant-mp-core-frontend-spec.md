## 기능명

MP_CORE 초보자용 판단 대시보드 UX 리플랜

### 상태

- status: REPLANNING
- 작성일: 2026-05-21
- 배경: 기존 MP_CORE 대시보드는 verifier PASS 상태이나, 퀀트 지식이 없는 사용자에게 판단 근거와 실행 행동이 어렵게 보인다. 기능은 유지하되 첫 화면을 "오늘 무엇을 해야 하는지" 중심으로 재구성한다.

### 범위

- 백엔드: 변경 없음 원칙
  - `market-pulse-api/src/main/java/com/marketpulse/domain/quant/controller/QuantController.java`
  - `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantCoreDashboardService.java`
  - 백엔드는 기존 응답으로 표현이 불가능한 경우에만 설명 보조 필드 추가를 검토한다.
- 프론트엔드:
  - `market-pulse-web/src/pages/QuantDashboard/index.tsx`
  - `market-pulse-web/src/pages/QuantDashboard/CandidateDrilldown.tsx`
  - `market-pulse-web/src/pages/QuantDashboard/BacktestEvidencePanel.tsx`
  - `market-pulse-web/src/pages/QuantDashboard/PortfolioTargetPanel.tsx`
  - `market-pulse-web/src/pages/QuantDashboard/DiagnosticsPanel.tsx`
  - `market-pulse-web/src/pages/QuantDashboard/RunControlPanel.tsx`
  - `market-pulse-web/src/types/index.ts` 또는 기존 quant 전용 타입 파일

### UX 목표

첫 화면은 퀀트 용어보다 사용자의 실전 판단 질문에 답해야 한다.

- 지금 모델 판단은? `매수 가능` / `관찰` / `위험` / `매도 축소`
- 오늘 무엇을 해야 하나?
- 왜 그렇게 판단했나?
- 얼마나 위험한가?
- 지금 보유 중이면 `유지` / `축소` / `매도` 중 무엇인가?
- 비보유 후보는 언제 사는가? 어떤 조건이면 안 사는가?

### 핵심 설계 원칙

- 기본 화면의 1차 라벨은 쉬운 한국어로 쓴다.
- `winnerProb`, `score`, `factorScores`, `sharpe`, `MDD` 같은 정량 용어는 고급 보기나 상세 접힘 영역에 둔다.
- 수익률은 사람이 이해하는 표현으로 표시한다.
  - 월평균 수익률
  - 전체 수익률
  - 최대 하락 경험
  - 거래 비용
  - 신뢰도 경고
- 수익 보장, 확정 수익, 반드시 상승 같은 문구를 사용하지 않는다.
- 단순화 때문에 정량 정보가 숨겨지는 트레이드오프는 `고급 보기` 토글로 해결한다.

### 프론트엔드 구현

#### 1. 초보자용 상태 매핑 추가

기존 후보 데이터에서 프론트엔드가 초보자용 판단 상태를 계산한다. 백엔드 필드 추가를 우선하지 않는다.

```ts
type BeginnerDecisionState = "BUYABLE" | "WATCH" | "RISK" | "REDUCE_SELL";

type BeginnerAction = "BUY_READY" | "WAIT" | "HOLD" | "REDUCE" | "SELL" | "DO_NOT_BUY";
```

매핑 규칙은 프론트엔드 유틸 함수로 분리한다.

```ts
function mapBeginnerDecision(candidate: QuantCandidateSignal): {
  state: BeginnerDecisionState;
  action: BeginnerAction;
  title: string;
  shortAction: string;
  reasons: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskText: string;
  noBuyConditions: string[];
}
```

권장 기본 매핑:

| 조건 | state | action | 한국어 라벨 |
|---|---|---|---|
| `candidateStatus == "BLOCKED"` 또는 `blockers.length > 0` | `RISK` | `DO_NOT_BUY` | 위험 / 오늘은 사지 않음 |
| `candidateStatus == "SELL_TRIM"` 또는 `nextAction`이 `SELL`, `TRIM` 계열 | `REDUCE_SELL` | `REDUCE` 또는 `SELL` | 매도 축소 / 비중 줄이기 |
| 보유 중이고 목표 비중과 현재 비중 차이가 작음 | `WATCH` | `HOLD` | 관찰 / 유지 |
| `candidateStatus == "BUY_CANDIDATE"`이고 blockers가 없고 `rebalanceStatus == "SCHEDULED"` | `BUYABLE` | `BUY_READY` | 매수 가능 / 예정일에 매수 검토 |
| 위 조건 외 | `WATCH` | `WAIT` | 관찰 / 아직 기다림 |

#### 2. 첫 화면 구성

`QuantDashboard/index.tsx` 상단을 다음 순서로 재구성한다.

1. 모델 판단 요약 카드
   - 제목: `지금 모델 판단`
   - 상태 배지: `매수 가능`, `관찰`, `위험`, `매도 축소`
   - 짧은 행동 문장: 예) `오늘은 신규 매수보다 관찰이 우선입니다.`
2. 오늘 할 일 카드
   - 보유 종목: `유지`, `비중 축소`, `매도 검토`
   - 비보유 후보: `예정일`, `매수 조건`, `사지 않는 조건`
3. 이유 카드 3개 이내
   - 예) `최근 점수가 기준선 위입니다.`
   - 예) `목표 비중보다 현재 비중이 높아 일부 축소가 필요합니다.`
   - 예) `위험 경고가 있어 오늘은 매수하지 않습니다.`
4. 위험 미터
   - `낮음`, `보통`, `높음` 3단계
   - 보조 문구: `최대 하락 경험과 차단 조건을 함께 반영합니다.`
5. 후보 결정 테이블
   - 컬럼: `종목`, `모델 판단`, `내가 할 행동`, `이유`, `위험`, `예정일`

#### 3. 후보 결정 테이블

기존 후보 리스트를 투자 의사결정 테이블처럼 바꾼다.

| 컬럼 | 표시 규칙 |
|---|---|
| 종목 | 종목명, 코드, 시장 |
| 모델 판단 | 쉬운 상태 배지: `매수 가능`, `관찰`, `위험`, `매도 축소` |
| 내가 할 행동 | `오늘 매수하지 않음`, `리밸런싱일에 매수 검토`, `보유 유지`, `비중 줄이기`, `매도 검토` |
| 이유 | `reasonChips`, `triggerConditions`, `blockers`를 쉬운 문장 1~2개로 변환 |
| 위험 | `낮음` / `보통` / `높음` 배지와 짧은 경고 |
| 예정일 | `rebalanceDate`가 있으면 `YYYY-MM-DD`, 없으면 `미정` |

#### 4. 보유자/비보유자 행동 가이드

상단 또는 테이블 위에 세그먼트 탭을 둔다.

- `보유 중`
- `관심 후보`
- `사지 말아야 할 후보`
- `고급 보기`

보유 중 화면:

- `유지`: 목표 비중과 현재 비중 차이가 작을 때
- `축소`: 현재 비중이 목표 비중보다 높거나 trim 신호가 있을 때
- `매도`: sell 신호나 위험 차단 조건이 있을 때

비보유 후보 화면:

- `언제 사는가`: `rebalanceDate`와 `triggerConditions` 기반으로 표시
- `어떤 조건이면 안 사는가`: `blockers`, `riskFlags`, 목표 비중 0, 리밸런싱 미예정 등을 쉬운 문장으로 표시

#### 5. 백테스트 패널 문구 변경

`BacktestEvidencePanel.tsx`는 기본 라벨을 다음처럼 바꾼다.

| 기존 정량 라벨 | 기본 화면 라벨 |
|---|---|
| Monthly Return | 월평균 수익률 |
| Total Return | 전체 수익률 |
| MDD | 최대 하락 경험 |
| Sharpe | 변동 대비 성과 |
| Win Rate | 오른 달 비율 |
| Total Cost | 거래 비용 |

`최대 하락 경험`에는 도움말을 붙인다.

- 도움말: `과거 테스트 기간 중 고점 대비 가장 크게 내려갔던 구간입니다. 앞으로도 같은 수준으로만 하락한다는 뜻은 아닙니다.`

`수익률` 영역에는 신뢰도 경고를 표시한다.

- 문구: `과거 결과는 참고 자료이며 앞으로의 수익을 보장하지 않습니다.`

#### 6. 고급 보기

고급 보기는 기본적으로 접힌 상태다.

포함 항목:

- 원래 factor score
- signal state
- winner probability
- score
- backtest 상세 지표
- diagnostics
- factor correlation
- sector exposure

토글 라벨:

- 닫힌 상태: `고급 지표 보기`
- 열린 상태: `쉬운 보기로 돌아가기`

#### 7. 용어 도움말

초보자에게 필요한 곳에만 짧은 tooltip을 둔다.

| 용어 | tooltip |
|---|---|
| 리밸런싱 | 정해진 날짜에 보유 비중을 다시 맞추는 작업입니다. |
| 목표 비중 | 모델이 권장하는 보유 비율입니다. |
| 현재 비중 | 지금 포트폴리오에서 차지하는 비율입니다. |
| 최대 하락 경험 | 과거 테스트에서 가장 크게 내려갔던 손실 구간입니다. |
| 거래 비용 | 매매 과정에서 발생한 수수료와 세금입니다. |

### UI 카피 가이드

- 기본 라벨은 한국어로 쓴다.
- 문장은 짧게 쓴다.
- 화면 안 설명은 1~2문장 이내로 제한한다.
- 정량 지표는 괄호 안 보조 정보로만 보여주거나 고급 보기에 둔다.
- 금지 문구:
  - `수익 보장`
  - `무조건 매수`
  - `확정 수익`
  - `안전한 종목`
- 권장 문구:
  - `매수 검토`
  - `오늘은 관찰`
  - `위험 조건이 있어 보류`
  - `보유 중이면 비중 축소 검토`
  - `과거 테스트 기준`

### 백엔드 구현

이번 리플랜의 기본 방침은 백엔드 변경 없음이다.

프론트엔드 매핑만으로 다음을 만들 수 있어야 한다.

- 쉬운 상태 배지
- 오늘 할 일
- 쉬운 이유 문장
- 위험 단계
- 사지 않는 조건
- 고급 보기

백엔드 변경이 필요한 경우는 기존 응답에 다음 데이터가 전혀 없을 때로 제한한다.

- `rebalanceDate`
- `nextAction`
- `blockers`
- `riskFlags`
- `reasonChips`
- `triggerConditions`
- `currentWeight`
- `targetWeight`

필요 시 추가 필드는 기존 DTO에 optional 성격으로만 추가하고, DB 변경은 하지 않는다.

### DB 변경

신규 DB 변경 없음.

```sql
-- 이번 UX 리플랜에서는 실행할 DDL이 없다.
```

### Acceptance Criteria

- [ ] AC-UX-1: `/quant` 또는 기존 MP_CORE 대시보드 첫 화면 상단에 `지금 모델 판단` 영역이 있고, `매수 가능`, `관찰`, `위험`, `매도 축소` 중 하나 이상의 상태 배지가 표시된다.
- [ ] AC-UX-2: 첫 화면에 `오늘 할 일` 영역이 있고, 보유 종목에 대해 `유지`, `축소`, `매도 검토` 중 하나의 행동 문구가 표시된다.
- [ ] AC-UX-3: 비보유 후보에 대해 `언제 사는가`와 `어떤 조건이면 안 사는가`가 각각 별도 문장 또는 별도 칸으로 표시된다.
- [ ] AC-UX-4: 후보 리스트 테이블 컬럼은 `종목`, `모델 판단`, `내가 할 행동`, `이유`, `위험`, `예정일` 순서를 포함한다.
- [ ] AC-UX-5: 후보 테이블의 기본 표시 영역에는 `winnerProb`, `sharpe`, `MDD`, `factorScores` 같은 영문/퀀트 라벨이 1차 라벨로 노출되지 않는다.
- [ ] AC-UX-6: 각 후보 row는 기존 `candidateStatus`, `nextAction`, `rebalanceStatus`, `blockers`, `riskFlags`, `reasonChips`, `triggerConditions`, `currentWeight`, `targetWeight` 중 사용 가능한 필드에서 쉬운 한국어 행동과 이유를 계산한다.
- [ ] AC-UX-7: 위험 미터는 `낮음`, `보통`, `높음` 3단계 중 하나를 표시하고, 차단 조건 또는 위험 플래그가 있는 후보는 `높음`으로 표시된다.
- [ ] AC-UX-8: 백테스트 기본 라벨은 `월평균 수익률`, `전체 수익률`, `최대 하락 경험`, `거래 비용`을 사용한다.
- [ ] AC-UX-9: `최대 하락 경험`에는 tooltip 또는 짧은 도움말이 있으며, 고점 대비 가장 크게 내려간 구간이라는 설명을 포함한다.
- [ ] AC-UX-10: 백테스트 영역에는 `과거 결과는 참고 자료이며 앞으로의 수익을 보장하지 않습니다.` 문구가 표시된다.
- [ ] AC-UX-11: 고급 정량 지표는 기본적으로 접힌 `고급 지표 보기` 영역 안에 배치된다.
- [ ] AC-UX-12: `고급 지표 보기`를 열면 기존 factor score, score, signal state, diagnostics, backtest 상세 지표를 확인할 수 있다.
- [ ] AC-UX-13: 화면 내 주요 버튼/탭/배지 라벨은 한국어이며, 초보자 판단에 필요한 문구는 한 문장 40자 내외로 짧게 표시된다.
- [ ] AC-UX-14: 화면 어디에도 `수익 보장`, `무조건 매수`, `확정 수익`, `안전한 종목` 문구가 없다.
- [ ] AC-UX-15: 이번 리플랜 구현으로 신규 DB DDL이 추가되지 않는다.
- [ ] AC-UX-16: 백엔드 변경이 있다면 기존 응답 필드를 보조하는 optional 설명 필드 추가에 한정되며, 기존 API 경로는 변경하지 않는다.
- [ ] AC-UX-17: `market-pulse-web`에서 `npm run build`가 성공한다.

### 구현 순서

1. 프론트엔드에 초보자용 상태/행동/위험 매핑 유틸을 만든다.
2. `QuantDashboard/index.tsx` 상단을 판단 요약, 오늘 할 일, 이유, 위험 미터 중심으로 재배치한다.
3. 후보 리스트를 결정 테이블 형태로 바꾼다.
4. 백테스트 패널의 기본 라벨과 경고 문구를 초보자용으로 바꾼다.
5. 고급 보기 토글 아래에 기존 정량 상세를 유지한다.
6. 빌드와 verifier를 실행한다.
