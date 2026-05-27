# Leading Model & Collection Pipeline

date: 2026-05-27
status: collection-running / model-proxy-ready / real-data-pending

---

## 왜 필요한가

기존 `MarketRegimeModel`은 **후행 분류기**다.
MA20/MA60/브레드스/변동성 기반으로 현재 시장 상태를 BULL/SIDEWAYS/BEAR로 분류하지만,
신호일 기준 D+20 포워드 수익률이 BULL < SIDEWAYS로 나옴 → 라벨이 미래를 예측하지 못함.

```
train D+20: BULL=1.21%, SIDEWAYS=2.10%, BEAR=4.77%
→ 순서 불일치: 기존 모델은 현재 상태 분류기, 진입 필터 역할 불가
```

검증 스크립트: `validate_regime_vs_market.py`
리포트: `.Codex/reports/2026-05-27_regime-validation.md`

---

## 두 모델 역할 분리

```text
기존 MarketRegimeModel  →  현재 상태 분류 (BULL/SIDEWAYS/BEAR)  →  보유 종목 익스포저 조절, 포지션 청산 타이밍
신규 LeadingModel       →  향후 5~20일 방향 예측               →  진입 필터 (BULL_LEAD일 때만 매수)
```

MarketSupervisor 라우팅은 기존 아키텍처 문서 참고:
`.Codex/plans/2026-05-27_market-supervisor-three-model-architecture.md`

---

## B 모델 (OHLCV 프록시) 결과

스크립트: `build_leading_model.py`
결과: `.Codex/reports/2026-05-27_leading-model-validation.md`

### 구현된 지표 (8개 + ETF)

| 지표 | 설명 | corr D+20 | 방향정확 D+20 |
|---|---|---:|---:|
| breadth_thrust | Zweig — 10일 내 breadth 40%→62% 돌파 | 0.061 | 8.30% |
| momentum_div | KOSPI 5d ret − 20d ret | 0.015 | 6.41% |
| breadth_5d_chg | 브레드스 5일 변화량 | 0.042 | 3.98% |
| kosdaq_lead | KOSDAQ 5d ret − KOSPI 5d ret | -0.072 | 2.62% |
| adv_ratio_chg | 상승종목비율 10일 변화 | 0.015 | 2.48% |
| new_high_ratio | 20일 신고가 종목비율 | -0.004 | 2.02% |
| vol_price_confirm | 거래량 급증 + 양봉 동시 비율 | 0.015 | 1.08% |
| vol_surge | 거래량 5일평균/20일평균 | 0.020 | 0.18% |
| lvrg_invrs_ratio | 레버리지ETF/인버스ETF 거래량 비율 | (수집 후 활성화) | — |

### 복합 신호 성능

```
BULL_LEAD D+20: +1.50%  (N=1,325)
NEUTRAL   D+20: +0.31%  (N=1,365)
BEAR_LEAD D+20: +0.94%  (N=1,305)
```

BULL > BEAR 방향 검증 통과. 그러나 차이가 작아 단독 사용 부족.

### 결론

OHLCV 프록시만으로는 선행 신호 약함. 실제 데이터(공매도, ETF 레버리지/인버스, 신용잔고, 풋/콜) 필수.
데이터 쌓이면 `build_leading_model.py` 재실행 → `lvrg_invrs_ratio` 자동 활성화.

---

## 수집 파이프라인

### 신규 DB 테이블

**`market_leading_snapshot`** (Spring Boot, `data.sql`)

```sql
snap_date      DATE        -- 수집 날짜
market         VARCHAR(10) -- KOSPI | KOSDAQ | ALL
short_sell_vol BIGINT      -- KRX 공매도 거래량 합계
short_sell_amt BIGINT      -- KRX 공매도 거래대금 합계
lvrg_vol       BIGINT      -- 122630 KODEX 레버리지 거래량
invrs_vol      BIGINT      -- 114800 KODEX 인버스 거래량
UNIQUE (snap_date, market)
```

**`market_daily_price`** — 기존 테이블에 ETF/ETN 추가 (assetType="ETF", "ETN")

### Spring Boot 파일 위치

```text
market-pulse-api/
  domain/investor/
    vo/MarketLeadingSnapshotVo.java
    mapper/LeadingSnapshotMapper.java
    service/LeadingIndicatorCollectService.java
  resources/mapper/investor/LeadingSnapshotMapper.xml
  domain/quant/service/QuantCollectService.java   ← ETF("/eto/etf_bydd_trd") + ETN("/etn/etn_bydd_trd") 추가
  domain/quant/scheduler/QuantDailyCollectScheduler.java ← ETF(16:10) + ETN(16:15) 추가
  global/config/RankingSnapshotScheduler.java     ← 선행지표(16:05) 추가
```

### 수집 KRX 엔드포인트

| 데이터 | KRX 경로 | assetType | 스케줄 |
|---|---|---|---|
| 공매도 (KOSPI) | `/short/srt_bydd_trd` | — | 16:05 |
| 공매도 (KOSDAQ) | `/short/srt_ksq_bydd_trd` | — | 16:05 |
| ETF 전종목 | `/eto/etf_bydd_trd` | ETF | 16:10 |
| ETN 전종목 | `/etn/etn_bydd_trd` | ETN | 16:15 |

ETF 쿼리 예: `findByCodeAndDateRange("122630", "ETF", date, date)`

### 전체 스케줄 타임라인 (평일 장 마감 후)

```
15:35  장 마감 최종 스냅샷 (KIS 투자자 흐름, 외국인 랭킹)
16:00  STOCK/INDEX/BOND/GOLD 수집 (KRX)
16:05  선행지표 수집 (공매도 + ETF 거래량) → market_leading_snapshot
16:10  ETF 전종목 → market_daily_price (assetType=ETF)
16:15  ETN 전종목 → market_daily_price (assetType=ETN)
```

---

## EC2 / RDS 배포

### 파이프라인

```
main 브랜치 PR 머지
  → GitHub Actions (.github/workflows/deploy.yml)
    → Docker Hub: market-pulse-api:latest 빌드 & 푸시
    → EC2 SCP: docker-compose.yml 자동 동기화
    → EC2 SSH: /app/deploy.sh 실행
      → docker compose pull → docker compose up -d
      → Spring Boot 기동 시 data.sql 실행 (IF NOT EXISTS — 신규 테이블 자동 생성)
      → 스케줄러 자동 활성화 (matchIfMissing=true)
```

### 환경변수 (EC2 /app/.env)

새 수집 기능에 추가 env var 불필요. 기존 설정으로 동작:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` → RDS
- `KIS_APP_KEY`, `KIS_APP_SECRET` → KIS API
- KRX AUTH_KEY → `application.yml` 하드코딩 (FE777EB1987B49C8A5501FCB889DD28B4633AA33)
- `APP_SCHEDULER_ENABLED=true` → 스케줄러 활성화

### 관련 파일

```text
market-pulse/
  docker-compose.yml          ← EC2 컨테이너 구성 (SCP로 자동 동기화)
  scripts/deploy.sh           ← docker compose pull + up
  .github/workflows/deploy.yml ← CI/CD (PR 머지 → 자동 배포)
  market-pulse-api/
    src/main/resources/
      application-prod.yml    ← SPRING_PROFILES_ACTIVE=prod
      application-rds.yml     ← RDS 연결 (DB_HOST 등 env 참조)
      data.sql                ← 테이블 DDL (mode: always → 기동마다 실행)
```

---

## 실제 데이터 통합 계획

데이터 2~3주 수집 후:

### Step 1. ETF 레버리지/인버스 비율 검증

```bash
python build_leading_model.py
```

`lvrg_invrs_ratio` 지표 자동 활성화됨. 아래 기대 패턴 확인:
- 레버리지 거래량 ↑ / 인버스 ↓ → 리스크온 → BULL_LEAD D+20 높아야 함
- 레버리지 ↓ / 인버스 ↑ → 리스크오프 → BEAR_LEAD

### Step 2. 공매도 비율 지표 추가

`market_leading_snapshot.short_sell_vol` 수집 후 지표 추가:

```python
# build_leading_model.py에 추가
short_sell = pd.read_sql(
    "SELECT snap_date, market, short_sell_vol, short_sell_amt "
    "FROM market_leading_snapshot WHERE market='KOSPI'",
    conn, parse_dates=["snap_date"]
)
# 공매도 비율 = short_sell_amt / 전체 시장 거래대금 (INDEX 테이블 참조)
# 높은 공매도 비율 → 약세 신호
```

### Step 3. 복합 점수 재보정

충분한 실데이터 확보 후 (30일 이상) `validate()` 재실행:
- 새 지표 corr/dir_acc 계산
- 상위 지표 조합 재선정
- BULL_LEAD/BEAR_LEAD 재정의

### Step 4. W4 진입 필터 통합

LeadingModel 신호를 W4 entry 조건으로 추가:
- `leading_signal == "BULL_LEAD"` → 진입 허용
- `leading_signal == "BEAR_LEAD"` → 진입 차단
- 기존 `regime == "BULL"` 조건과 AND 연결

---

## 관련 리포트

| 파일 | 내용 |
|---|---|
| `.Codex/reports/2026-05-27_regime-validation.md` | 레짐 라벨 vs 실제 시장 검증 |
| `.Codex/reports/2026-05-27_leading-model-validation.md` | B 모델 프록시 지표 검증 |
| `.Codex/reports/2026-05-27_leading-model-features.csv` | 지표별 일별 수치 (4,015일) |
| `.Codex/plans/2026-05-27_market-supervisor-three-model-architecture.md` | 전체 MarketSupervisor 아키텍처 |
