# 로또 분석 연구소 — 최종 기획

## 컨셉

단순 번호 추천기가 아니라 **통계 전략별 누적 성적을 추적하는 분석 연구소**.
매 회차마다 5가지 전략이 번호 풀(10개)을 생성하고, 결과가 나오면 얼마나 맞췄는지 자동 비교한다.

---

## 핵심 메커니즘

```
매 회차 (토요일 밤 결과 수집 후)
├── 전략 5가지 × 풀 10개 번호 계산 (통계 수식 기반)
├── 각 풀에서 추천 조합 3개 자동 생성 (필터링 조건 적용)
└── 당첨 번호 수집 → 풀·조합 적중률 비교 저장

조회
├── 회차 선택 → 해당 회차 전략 5개 풀 + 조합 표시
├── 실제 당첨번호와 비교 (풀 적중률, 조합 적중률)
└── 전략별 누적 성적 그래프 (전 회차 평균 적중 개수 추이)
```

---

## 5가지 분석 전략

| # | 전략명 | 통합 원소 | 컨셉 |
|---|--------|-----------|------|
| 1 | 모멘텀 | HOT + RISING | 요즘 뜨는 번호 (최근 빈도 + 상승 추세) |
| 2 | 잠수함 | COLD + FALLING | 폭발 직전 반전 후보 (장기 미출현 + 최근 더 줄어드는 번호) |
| 3 | 관계망 | 동반번호 + 연속번호 | 같이 나오는 번호 네트워크 |
| 4 | 위치 패턴 | 끝수 + 구간 | 강세 번호대·끝자리 흐름 분석 |
| 5 | AI 스마트픽 | 밸런스 + 역배 + CORE + AI종합 | 다중 분석 가중합 종합 추천 |

### 공통 정의

```
N            = {1, 2, ..., 45}           전체 번호 집합
R            = 전체 분석 회차 수
Recent_k(n)  = 최근 k회 동안 번호 n의 출현 횟수
Prev10(n)    = 최근 10회 바로 이전 10회 동안 출현 횟수
Absent(n)    = 마지막 출현 이후 경과 회차 수
CoOccur(a,b) = a와 b가 같은 회차에 함께 출현한 횟수
```

### 정규화

각 전략은 Raw Score 계산 후 **min-max 정규화(0~1)** 를 거쳐 가중합한다.
스케일이 다른 값을 그대로 합치면 특정 항목으로 편향되기 때문.

```
Norm(n, S) = (S(n) - min(S)) / (max(S) - min(S))
```

---

### 전략별 확정 수식

**전략 1 — 모멘텀**
```
Hot(n)       = Recent10(n)×0.5 + Recent30(n)×0.3 + Recent100(n)×0.2
Rising(n)    = Recent10(n) − Prev10(n)

Momentum(n)  = Norm(Hot)×0.6 + Norm(Rising)×0.4
```
> Rising 음수 구간은 정규화 시 자동으로 낮은 값이 됨 — 별도 클램핑 불필요.

---

**전략 2 — 잠수함**
```
Cold(n)      = min(Absent(n), 30)
Falling(n)   = max(Prev10(n) − Recent10(n), 0)    ← 하락만 반영, 음수 제거

Submarine(n) = Norm(Cold)×0.6 + Norm(Falling)×0.4
```
> Cold = "오래 안 나왔다" / Falling = "예전엔 나왔는데 최근엔 뚝 끊겼다" — 둘 다 높은 번호가 진짜 잠수함 후보.

---

**전략 3 — 관계망**
```
PairRate(a,b)    = CoOccur(a,b) / R
CompRaw(n)       = Σ PairRate(n,x)×0.6 + Σ RecentPairRate30(n,x)×0.4   (x ≠ n)
ConsecRaw(n)     = Recent30(n−1) + Recent30(n+1)    (범위: 1 ≤ n±1 ≤ 45)

Network(n)       = Norm(CompRaw)×0.7 + Norm(ConsecRaw)×0.3
```

---

**전략 4 — 위치 패턴**
```
끝수 점수
  DigitGroup(n)  = n mod 10
  DigitScore(n)  = Σ Recent30(x)    (x ∈ N, x mod 10 = DigitGroup(n))

구간 점수  (구간: 1~10 / 11~20 / 21~30 / 31~40 / 41~45)
  SectionScore(n) = Σ Recent30(x)   (x ∈ 번호 n과 같은 구간)

Pattern(n) = Norm(DigitScore)×0.5 + Norm(SectionScore)×0.5
```

---

**전략 5 — AI 스마트픽**
```
① 번호별 종합 점수
  Core(n) = (전략 1~4 Pool에 포함된 수) / 4     ← 이미 0~1 범위, Norm 불필요

  AI(n) = Norm(Hot)×0.20  + Norm(Cold)×0.15
        + Norm(CompRaw)×0.20 + Norm(DigitScore)×0.10
        + Norm(SectionScore)×0.10 + Norm(ConsecRaw)×0.10
        + Core(n)×0.15
                                      ──────────────────
                                      가중치 합계 = 1.00 ✓

② 조합 생성 후 필터
  합계         : 80 ≤ Σ(combo) ≤ 170
  홀짝 편차    : |홀수 개수 − 짝수 개수| ≤ 2
  구간 커버리지 : 사용 구간 수 ≥ 3
  연속번호     : 연속 번호 개수 ≤ 2

③ 역배 보너스 (조합 점수에 가산)
  UnpopularBonus = (combo 중 31 초과 번호 수) × 0.05
  → 생일번호(1~31) 회피 → 당첨 시 분배 인원 줄이는 전략
```

---

## 풀 생성 기준

- 각 전략 점수 상위 **10개** 번호 → Pool
- Pool 기반 **조합 3개** 자동 생성 (ComboScore 상위 3개)
- 조합 필터: 합계 80~170 / 홀짝 편차 ≤ 2 / 연속번호 ≤ 2 / 구간 ≥ 3

---

## ✅ 백테스트 원칙 (구현 완료)

`analyzeOnly(drawNo)` → `findResultsBeforeDrawNo(drawNo)` 교체 완료.  
각 회차 분석 시 해당 회차 이전 데이터만 사용. 10회 미만 히스토리면 분석 건너뜀.

---

## ✅ 전략 고도화 (구현 완료)

> 목표: ~~30~37%~~ → **25%** (학술 연구 결과 반영 하향)

### 구현 완료 항목

| 항목 | 내용 | 실측 효과 |
|------|------|-----------|
| 백테스트 원칙 | drawNo 이전 데이터만 사용 | 통계 신뢰성 확보 |
| 가중 빈도 (모멘텀) | `0.95^(현재-출현회차)` 지수 감쇠 | MOMENTUM 1위 유지 |
| 기대 주기 (잠수함) | DueScore = LastAbsent / AvgInterval | 가중치 0.4/0.3/0.3 |
| 앙상블 투표 (AI) | SUBMARINE 제외, MON+NET+PAT 3전략 투표 | AI_PICK 22.1% → 22.4% |
| 조합 필터 강화 | 합계 100~175, 4구간 이상, 3연속 금지 | 불량 조합 제거 |

### 시도했으나 역효과 → 롤백

| 항목 | 결과 | 이유 |
|------|------|------|
| pairRate 지수 감쇠 | NETWORK 22.6% → 22.0% | 페어 관계는 장기 데이터가 안정적 |
| PATTERN 감쇠 적용 | PATTERN 22.2% → 21.9% | 30회 고정 윈도우가 더 적합 |

### 최종 백테스트 결과 (1113회차, draw_no > 110)

| 전략 | 적중률 | 랜덤(22.2%) 대비 |
|------|--------|----------------|
| MOMENTUM | **22.9%** | +3.1% |
| NETWORK | 22.6% | +1.9% |
| AI_PICK | 22.4% | +1.0% |
| PATTERN | 22.2% | ±0% |
| SUBMARINE | 21.8% | -2.0% |
| 이론 상한 (매 회 최선 전략) | 38.1% | — |

### 결론

외국 학술 연구(Stanford, arXiv SmileyNet 등) 조사 결과, LSTM·딥러닝 포함 어떤 ML 방법도 로또 랜덤성 앞에서 랜덤 기대값 수렴. MOMENTUM 22.9%가 순수 통계 방법의 현실적 상한. **25% 목표 달성은 현재 접근법으로 불가**, 분석 연구소 콘셉트(전략 성적 추적·시각화)에 집중하는 방향으로 결론.

---

## 적중률 계산

```
풀 적중률  = (당첨 6개 중 Pool 10개에 포함된 수) / 6 * 100  (%)
조합 적중률 = (조합 6개 중 당첨번호와 일치하는 수) / 6 * 100 (%)
```

---

## 화면 구성

| 화면 | 내용 |
|------|------|
| 최신 회차 | 5개 전략 풀(10개) + 추천 조합 3개씩 표시 |
| 과거 회차 조회 | 해당 회차 풀/조합 + 실제 당첨번호 비교 + 적중률 |
| 성적 대시보드 | 전략별 누적 적중률 그래프 (전략 성능 비교) |
| 내 조합함 | 사용자가 저장한 조합 + 회차별 적중 결과 |

---

## DB 구조 (예정)

```sql
-- 역대 당첨 번호
CREATE TABLE lotto_result (
    draw_no    INTEGER PRIMARY KEY,
    draw_date  DATE NOT NULL,
    no1~no6    INTEGER NOT NULL,
    bonus_no   INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 회차별 전략 풀 + 추천 조합
CREATE TABLE lotto_analysis_pool (
    id         BIGSERIAL PRIMARY KEY,
    draw_no    INTEGER NOT NULL,
    strategy   VARCHAR(20) NOT NULL,  -- MOMENTUM | SUBMARINE | NETWORK | PATTERN | AI_PICK
    pool_numbers INTEGER[] NOT NULL,  -- 10개
    combos     JSONB,                 -- 추천 조합 3개
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (draw_no, strategy)
);

-- 회차 결과 나온 후 적중 분석
CREATE TABLE lotto_analysis_result (
    id              BIGSERIAL PRIMARY KEY,
    draw_no         INTEGER NOT NULL,
    strategy        VARCHAR(20) NOT NULL,
    pool_hit_count  INTEGER NOT NULL,  -- 풀에서 당첨번호 몇 개 포함
    combo_results   JSONB,             -- 조합별 적중 개수
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE (draw_no, strategy)
);

-- 사용자 저장 조합
CREATE TABLE lotto_user_combo (
    id          BIGSERIAL PRIMARY KEY,
    draw_no     INTEGER NOT NULL,      -- 대상 회차
    numbers     INTEGER[] NOT NULL,    -- 6개
    hit_count   INTEGER,               -- 결과 후 채워짐
    created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## API 설계 (예정)

```
GET /api/lotto/latest               -- 최신 회차 분석 결과
GET /api/lotto/rounds               -- 전체 회차 목록
GET /api/lotto/analysis?round=1157  -- 특정 회차 5개 전략 풀 + 조합 + 적중률
GET /api/lotto/stats                -- 전략별 누적 성적 (그래프용)

POST   /api/lotto/combo             -- 내 조합 저장 { drawNo, numbers[] }
GET    /api/lotto/combo             -- 내 저장 조합 목록
DELETE /api/lotto/combo/{id}        -- 삭제
```

---

## 라우팅

`/lotto` — LottoAnalysis 페이지 (인증 불필요, 내 조합 저장만 인증)

---

## 참고

- 각 지표별 원리 상세 설명 → `lotto_machine_learning_analysis_overview_md.md`
- 수식은 이 파일(lotto-final-plan.md)이 최종 확정본. 위 파일과 충돌 시 이 파일 우선.
