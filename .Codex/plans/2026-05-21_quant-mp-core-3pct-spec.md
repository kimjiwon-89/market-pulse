# MP_CORE 월 3% 목표 모델 수정 스펙

date: 2026-05-21
status: IN_PROGRESS

## 목표

3년 데이터(2022-01-03 ~ 2025-06-30) 기반 백테스트에서 월 복리 수익률 3% 이상 달성.

## 기존 모델 문제점

- 데이터 6개월 (2025-01-02 ~ 2025-06-30)만 보유 → 1개월치 백테스트 샘플
- 월수익률 1.69% — 3% 목표 미달
- `label IS NOT NULL` 필터 → 최신 1개월 시그널 날짜 제외
- 변동성 필터 `vol_60d <= 0.08` 너무 보수적 → 모멘텀 종목 다수 제외
- 단기 모멘텀 가중치(0.15) 낮음 → 근거리 수익률 예측력 저활용
- topN=20 분산 → 수익률 희석

## 수정 내용

### 1. 데이터 확장
- 수집 범위: 2022-01-03 ~ 2024-12-31 추가 → 총 3.5년 (2022-2025)
- 예상 피처 날짜: ~750 거래일 × ~2900종목 = ~2.2M rows

### 2. 점수 가중치 조정 (`findMonthlyMpCoreSignalPicks`)

| 팩터 | 기존 | 변경 | 근거 |
|------|------|------|------|
| risk_adj_rank (위험조정 60d) | 0.35 | 0.25 | 장기 보수 지표 비중 축소 |
| ret_rank (60d 수익률) | 0.25 | 0.20 | 동일 |
| short_momentum_rank (20d) | 0.15 | **0.30** | 근거리 모멘텀 강화 — 1개월 후 수익률 예측력 높음 |
| liquidity_rank | 0.10 | 0.12 | 소폭 상향 |
| drawdown_score | 0.10 | 0.08 | 소폭 하향 |
| stability_rank (저변동성) | 0.05 | 0.05 | 유지 |

### 3. 필터 완화

| 필터 | 기존 | 변경 | 근거 |
|------|------|------|------|
| liquidity_rank >= | 0.25 | 0.20 | 유동성 기준 소폭 완화 |
| drawdown_60d > | -0.25 | -0.30 | 낙폭 기준 완화 |
| vol_60d <= | **0.08** | **0.12** | 핵심 변경 — 모멘텀 종목 편입 허용 |

### 4. 포트폴리오 집중화

| 항목 | 기존 | 변경 |
|------|------|------|
| topN | 20 | **10** | 집중 포트폴리오 → 수익률 집중 |

### 5. 백테스트/시그널 필터 수정

- `QuantCoreSignalMapper.xml`: `label IS NOT NULL` 제거 → 최신 날짜 포함
- `MarketDailyPriceMapper.xml` (findMonthlyMpCoreSignalPicks): `label IS NOT NULL` 제거 → 라이브 날짜 포함

## 검증 기준 (AC)

| AC | 기준 |
|----|------|
| AC-1 | 백테스트 기간 2022-01-03 ~ 2025-06-30 (3년+) |
| AC-2 | 월 복리 수익률 >= 3.0% |
| AC-3 | MDD < 30% |
| AC-4 | `npm run build` 및 `mvn -DskipTests compile` 통과 |

## 변경 파일

- `market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml` — 가중치/필터 수정
- `market-pulse-api/src/main/resources/mapper/quant/QuantCoreSignalMapper.xml` — label 필터 제거
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/MpCoreSignalStrategy.java` — topN 10
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/QuantCoreFeatureSnapshotMapper.java` — findLatestFeatureDate 추가
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantModelSignalService.java` — date auto-resolve
