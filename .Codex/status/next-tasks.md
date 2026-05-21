## Next Tasks

date: 2026-05-21
status: PENDING — 월 3% 목표 미달성, 다음 세션에서 레짐 필터 구현 필요

---

### 현재 상태 요약

백테스트 결과 (2022-01-03 ~ 2025-06-30, 완전한 3년 데이터):
- monthlyReturn: **0.488%** (목표 3% 미달)
- MDD: **-57.77%** (목표 -30% 초과)
- 피처: 2,062,662 rows (2024 전체 포함)

---

### 다음 세션 작업 (우선순위 순)

#### 1. 코스피 지수 데이터 수집 (최우선)
- `market_daily_price`에 `asset_type='INDEX'`, `asset_code='KOSPI'` 데이터 추가
- KIS API `FHKST03010100` (주식 기간별 일봉) → 코스피 2022-01-03 ~ 2025-06-30 수집
- 또는 KRX API `/idx/krx_dd_trd` 사용
- **왜**: 레짐 필터 구현을 위해 지수 MA 계산에 필요

#### 2. 코스피 레짐 필터 구현
- `findMonthlyMpCoreSignalPicks` SQL에 레짐 조건 추가:
  ```sql
  AND (코스피 현재가 / 코스피 120일 MA) > 1.0  -- 상승장만 거래
  ```
- 하락장(코스피 < 120일 MA)이면 picks 빈 리스트 반환 → 현금 보유
- **기대 효과**: 2022 하락장 + 2024 H2 하락장 회피 → MDD 대폭 감소, 수익률 개선

#### 3. 절대 모멘텀 추가
- 종목별 6개월 절대 수익률(ret_180d) > 0인 경우만 편입
- `feature_rows` CTE에 `ret_180d > 0` 필터 추가
- **왜**: 하락장에서 "덜 떨어지는 종목"도 결국 하락 → 절대 기준 필요

#### 4. vol 필터 재강화 검토
- 현재 vol_60d <= 0.12 → 0.10으로 되돌리는 것 검토
- 레짐 필터 도입 후 결과 보고 판단

#### 5. 재백테스트 & AC 검증
- 레짐 필터 + 절대 모멘텀 적용 후 동일 기간 백테스트
- AC-2: monthlyReturn >= 3.0%
- AC-3: MDD < 30%

---

### 참고 파일
- 스펙: `.Codex/plans/2026-05-21_quant-mp-core-3pct-spec.md`
- 현재 구현: `MarketDailyPriceMapper.xml` — `findMonthlyMpCoreSignalPicks`
- 월별 수익률 분석: `.claude/.logs/2026-05-21-log.md` 참조
