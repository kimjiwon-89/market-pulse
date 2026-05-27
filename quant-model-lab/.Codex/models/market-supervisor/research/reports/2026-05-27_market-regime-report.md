# 시장 국면 분석 레포트 (KOSPI/KOSDAQ 분리)

date: 2026-05-27
분석 기간: 2026-01-05 ~ 2026-05-26

---

## 최신 판정 (2026-05-26)

| 지수 | 국면 | 비고 |
|---|---|---|
| KOSPI | SIDEWAYS | 중립 |
| KOSDAQ | SIDEWAYS | 중립 |
| **종합** | **SIDEWAYS** | **W4_RESTRICT 적용** |

| 지표 | 값 | 해석 |
|---|---|---|
| Bull 점수 | 4 / 9 | 보통 |
| Bear 점수 | 3 / 7 | 보통 |
| Breadth (MA20) | 54.2% | 절반 이상 MA20 상회 — 중립 |
| 변동성 (Vol20) | 3.33% | 약간 높음 |
| 유동성 추세 | -1.7% | 소폭 감소 |

---

## 주요 날짜 추적

| 날짜 | KOSPI | KOSDAQ | 종합 | Bull | Bear | Breadth | Vol | 유동성 |
|---|---|---|---|---:|---:|---:|---:|---:|
| 2026-01-05 | BULL | BULL | **BULL** | 8 | 0 | 50.0% | 1.49% | +0.0% |
| 2026-03-30 | SIDEWAYS | SIDEWAYS | **SIDEWAYS** | 2 | 4 | 47.2% | 5.30% | -26.6% |
| 2026-04-15 | BULL | SIDEWAYS | **SIDEWAYS** | 7 | 2 | 86.2% | 3.71% | +27.9% |
| 2026-05-20 | SIDEWAYS | BEAR | **BEAR** | 3 | 4 | 25.6% | 2.87% | -5.4% |
| 2026-05-26 | SIDEWAYS | SIDEWAYS | **SIDEWAYS** | 4 | 3 | 54.2% | 3.33% | -1.7% |

---

## 핵심 인사이트

### 1월 초 (BULL → BULL)
- 양 지수 모두 강세. 변동성 1.49% — 매우 안정.
- V4 전략: 전면 허용.

### 3월 30일 (SIDEWAYS → SIDEWAYS, 위험)
- Bear 4점으로 임계값(5) 직전.
- 변동성 5.30% + 유동성 -26.6% → 투자자 이탈, 불안정.
- V4 전략: 진입 조건 강화. 신규 진입 최소화 권장.

### 4월 15일 ⚠️ DIVERGE (KOSPI=BULL, KOSDAQ=SIDEWAYS)
- KOSPI는 반등 성공했으나 KOSDAQ은 아직 회복 못 함.
- Breadth 86.2%로 종목 대부분 MA20 상회 → 대형주 주도 랠리.
- **V4 지침: KOSPI 종목은 적극 진입, KOSDAQ 종목은 조건 강화.**

### 5월 20일 ⚠️ DIVERGE (KOSPI=SIDEWAYS, KOSDAQ=BEAR)
- KOSDAQ 독립 약세 진입.
- Breadth 25.6% → 종목 4개 중 3개가 MA20 하회.
- **V4 지침: KOSDAQ 종목 진입 차단. KOSPI 종목만 엄격 조건으로 허용.**

### 5월 26일 (SIDEWAYS → SIDEWAYS)
- KOSDAQ이 BEAR에서 회복 중. 아직 안정 확인 필요.
- Persistence 필터(3일) 통과 후 SIDEWAYS 유지.

---

## V4 전략 지침 (현재)

```
KOSPI  → SIDEWAYS : 진입 허용, entry_ma20_min=8%, entry_next_body_min=2%
KOSDAQ → SIDEWAYS : 진입 허용, entry_ma20_min=8%, entry_next_body_min=2%
종합   → SIDEWAYS : W4_RESTRICT

※ KOSDAQ은 5/20 BEAR 이후 회복 중 — 추가 확인 필요
```

---

## 시사점

- **분리 분석이 핵심**: 4/15, 5/20 두 날 모두 합산 판단만 했으면 KOSDAQ 신호 묻혔음.
- KOSDAQ이 KOSPI보다 먼저 약세 진입하는 선행 지표 역할 가능.
- 3일 Persistence 필터 적용 중 → 하루짜리 노이즈 D+1 일치율 84%→94% 개선됨.
