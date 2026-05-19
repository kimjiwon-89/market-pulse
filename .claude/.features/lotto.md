# 로또 분석 연구소 기능

**상태**: 백엔드 분석 엔진 + 백테스트 완료 / 프론트엔드 구현 예정  
**페이지**: `/lotto` (LottoAnalysis)

---

## 컨셉

단순 번호 추천기가 아니라 **통계 전략별 누적 성적을 추적하는 분석 연구소**.  
매 회차마다 5가지 전략이 번호를 분석하고, 당첨 결과가 나오면 전략별 성과를 자동 기록한다.

---

## 5가지 분석 전략

| # | 전략 | 컨셉 |
|---|------|------|
| 1 | 모멘텀 | 최근 빈도 높고 상승 추세인 번호 |
| 2 | 잠수함 | 장기 미출현 + 최근 더 줄어드는 번호 |
| 3 | 관계망 | 함께 자주 나오는 동반번호 네트워크 |
| 4 | 위치 패턴 | 강세 번호대·끝자리 흐름 |
| 5 | AI 스마트픽 | 전략 1~4 가중합 종합 추천 |

> 수식 상세: `.claude/.lotto/lotto-final-plan.md`

---

## 백테스트 결과 (1113회차, draw_no > 110)

| 전략 | 적중률 | 랜덤(22.2%) 대비 |
|------|--------|----------------|
| MOMENTUM | **22.9%** | +3.1% |
| NETWORK | 22.6% | +1.9% |
| AI_PICK | 22.4% | +1.0% |
| PATTERN | 22.2% | ±0% |
| SUBMARINE | 21.8% | -2.0% |

**결론**: LSTM 포함 어떤 ML 방법도 로또 랜덤성 앞에서 랜덤 기대값 수렴.  
MOMENTUM 22.9%가 순수 통계의 현실적 상한.  
→ 번호 적중보다 **전략 성적 추적·시각화** 콘셉트에 집중.

---

## 현재 방식 (전략별 소규모 풀)

```
매 회차
├── 전략 5개 × 상위 10개 번호 풀 생성
├── 각 풀에서 추천 조합 3개 자동 생성
│   필터: 합계 100~175 / 홀짝 편차 ≤ 2 / 4구간 이상 / 3연속 금지
└── 당첨 결과 → 풀·조합 적중률 비교 저장
```

---

## 대풀 방식 (개편 검토 중)

> 구체적인 번호 선정 방식은 추가 논의 필요

**방향**: 전략별로 대규모 번호 풀을 생성하고 정렬 → 그 중에서 어쩌다 한 번이라도 맞추는 재미

- 전략별 스코어로 전체 45개 번호를 정렬하는 방식은 유지
- 풀 크기·조합 방식·히트 정의는 미결정
- 소규모 풀(10개) 방식보다 체감 히트율이 높아 유저 재방문 동기 강화

**검토 포인트**
- 풀 크기 (전략당 몇 개?)
- 회차마다 갱신 vs 고정 풀
- 히트 정의 (6개 완전 일치 vs 3개 이상 포함 조합)

---

## DB 구조

```sql
CREATE TABLE lotto_result (
    draw_no    INTEGER PRIMARY KEY,
    draw_date  DATE NOT NULL,
    no1~no6    INTEGER NOT NULL,
    bonus_no   INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lotto_analysis_pool (
    id           BIGSERIAL PRIMARY KEY,
    draw_no      INTEGER NOT NULL,
    strategy     VARCHAR(20) NOT NULL,  -- MOMENTUM|SUBMARINE|NETWORK|PATTERN|AI_PICK
    pool_numbers INTEGER[] NOT NULL,
    combos       JSONB,
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (draw_no, strategy)
);

CREATE TABLE lotto_analysis_result (
    id             BIGSERIAL PRIMARY KEY,
    draw_no        INTEGER NOT NULL,
    strategy       VARCHAR(20) NOT NULL,
    pool_hit_count INTEGER NOT NULL,
    combo_results  JSONB,
    created_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE (draw_no, strategy)
);

CREATE TABLE lotto_user_combo (
    id         BIGSERIAL PRIMARY KEY,
    draw_no    INTEGER NOT NULL,
    numbers    INTEGER[] NOT NULL,
    hit_count  INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API

```
GET  /api/lotto/latest               -- 최신 회차 분석
GET  /api/lotto/rounds               -- 전체 회차 목록
GET  /api/lotto/analysis?round=1157  -- 특정 회차 5개 전략 풀 + 조합 + 적중률
GET  /api/lotto/stats                -- 전략별 누적 성적 (그래프용)

POST   /api/lotto/combo              -- 내 조합 저장 { drawNo, numbers[] }
GET    /api/lotto/combo              -- 내 저장 조합 목록
DELETE /api/lotto/combo/{id}

POST   /api/lotto/analyze?round=N    -- 기존 데이터로 분석 실행
POST   /api/lotto/collect?from=N&to=M -- 역대 데이터 일괄 수집 (관리자용)
```

---

## 스케줄러

`@Scheduled(cron = "0 30 21 * * SAT")` — 매주 토요일 21:30  
동행복권 API 호출 → lotto_result 저장 → 분석 실행 → 결과 저장

> ⚠️ 동행복권 API(`www.dhlottery.co.kr`)는 서버 측 봇 차단 이슈 있음.  
> 초기 데이터는 psql 직접 INSERT 후 `POST /api/lotto/analyze?round=N` 으로 분석 실행.

---

## 화면 구성

| 화면 | 내용 |
|------|------|
| 최신 회차 | 5개 전략 풀 + 추천 조합 3개씩 |
| 과거 회차 조회 | 풀/조합 + 실제 당첨번호 비교 + 적중률 |
| 성적 대시보드 | 전략별 누적 적중률 그래프 |
| 내 조합함 | 저장한 조합 + 회차별 적중 결과 |
