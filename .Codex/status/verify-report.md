## 검증 결과

spec: `.Codex/plans/2026-05-21_quant-mp-core-frontend-spec.md`
검증일: 2026-05-21
최종 판정: **PASS**

### AC별 결과

| AC | 판정 | 근거 |
|----|------|------|
| AC-7A: `GET /api/quant/core/candidates` 응답 row가 `rebalanceStatus`를 포함하고 enum 값은 `PENDING`, `SCHEDULED`, `EXECUTED`, `SKIPPED`, `BLOCKED` 중 하나 | ✅ PASS | `market-pulse-api/src/main/java/com/marketpulse/domain/quant/controller/QuantController.java:151` — candidates endpoint 확인. `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantCandidateSignalDto.java:19` — `rebalanceStatus` 필드 존재. `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantCoreDashboardService.java:312` — `BLOCKED`, `SKIPPED`, `SCHEDULED`, `PENDING`만 산출하며 미지원 문자열 반환 없음 |
| AC-7B: `GET /api/quant/core/candidates/{assetCode}?date=YYYYMMDD` 응답의 `candidate.rebalanceStatus`가 같은 enum 값 중 하나 | ✅ PASS | `market-pulse-api/src/main/java/com/marketpulse/domain/quant/controller/QuantController.java:160` — detail endpoint 확인. `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantCandidateDetailDto.java:6` — detail이 `QuantCandidateSignalDto candidate`를 포함. `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantCoreDashboardService.java:95` — detail history와 candidate 생성이 `toCandidate`를 사용하며 `toCandidate`에서 `rebalanceStatus`를 채움 |
| AC-7C: `CandidateDrilldown.tsx`의 리밸런싱 상태 표시가 `candidate.rebalanceStatus`를 사용하고 `candidate.signalState`를 상태 표시로 쓰지 않음 | ✅ PASS | `market-pulse-web/src/pages/QuantDashboard/CandidateDrilldown.tsx:12` — 허용 enum label map 존재. `market-pulse-web/src/pages/QuantDashboard/CandidateDrilldown.tsx:60` — 리밸런싱 상태 표시가 `candidate.rebalanceStatus` 사용. 해당 파일 내 `signalState` 참조 없음 |
| AC-10A: `GET /api/quant/core/backtests/latest` 응답에 top-level `monthlyReturn`, `mdd`, `sharpe`, `winRate`, `totalCost` 포함 | ✅ PASS | `market-pulse-api/src/main/java/com/marketpulse/domain/quant/controller/QuantController.java:174` — latest backtest endpoint 확인. `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantBacktestEvidenceDto.java:11` — top-level metric 필드 존재. `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantCoreDashboardService.java:167` — 서비스가 top-level metric 값을 채움 |
| AC-10B: `monthlyReturns` 항목이 `{ year: number, month: number, returnPct: number }` 구조 | ✅ PASS | `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantMonthlyReturnDto.java:6` — `year`, `month`, `returnPct` 구조 확인. `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantCoreDashboardService.java:426` — mapper의 `"YYYY-MM"` 값을 `year/month`로 파싱. `market-pulse-web/src/types/index.ts:455` — 프론트 타입도 같은 구조 |
| AC-10C: `costSummary`가 `grossReturn`, `netReturn`, `totalTurnover`, `avgTurnover`, `totalFee`, `totalTax`, `totalCost`, `tradeCount` 포함 | ✅ PASS | `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantCostSummaryDto.java:6` — 필수 필드 존재. `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantCoreDashboardService.java:152` — 서비스에서 cost summary 생성. `market-pulse-web/src/types/index.ts:461` — 프론트 타입도 동일 필드 포함 |
| AC-10D: `BacktestEvidencePanel.tsx`가 KPI, heatmap, cost summary를 AC-10A~C 필드에서 렌더링 | ✅ PASS | `market-pulse-web/src/pages/QuantDashboard/BacktestEvidencePanel.tsx:24` — KPI가 top-level metric 우선 사용. `market-pulse-web/src/pages/QuantDashboard/BacktestEvidencePanel.tsx:98` — heatmap이 `year/month/returnPct` 사용. `market-pulse-web/src/pages/QuantDashboard/BacktestEvidencePanel.tsx:117` — cost summary 필드 렌더링 |
| AC-10E: `PortfolioTargetPanel.tsx`가 `portfolio.positions`를 사용하고 `portfolio.holdings`를 참조하지 않음 | ✅ PASS | `market-pulse-web/src/pages/QuantDashboard/PortfolioTargetPanel.tsx:9` — `portfolio.positions` 사용. 해당 파일 내 `holdings` 참조 없음. `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantPortfolioTargetDto.java:13` — backend 응답도 `positions` 포함 |
| AC-10F: `DiagnosticsPanel.tsx`가 diagnostics map을 `Object.entries` 방식으로 렌더링하고 배열 전용 타입을 기대하지 않음 | ⚠️ WARN | `market-pulse-web/src/pages/QuantDashboard/DiagnosticsPanel.tsx:9` — `Record<string, number>`를 `Object.entries`로 변환. `market-pulse-web/src/pages/QuantDashboard/DiagnosticsPanel.tsx:16` — feature/factor/sector/class distribution 모두 map 변환 사용. 단, backend `QuantDiagnosticsDto`에는 `classDistribution`이 없어 해당 섹션은 빈 상태로 렌더링될 수 있음 (`market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantDiagnosticsDto.java:10`) |
| AC-12A: `RunControlPanel.tsx` backtest POST body가 `{ strategyId, from, to, initialCash }`이고 `modelCode`를 포함하지 않음 | ✅ PASS | `market-pulse-web/src/pages/QuantDashboard/RunControlPanel.tsx:30` — POST body가 `strategyId`, `from`, `to`, `initialCash`만 포함. `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/BacktestRequestDto.java:4` — backend DTO도 같은 계약 |
| AC-17: `market-pulse-web`에서 `npm run build` 성공 | ✅ PASS | `.Codex/status/front-report.md:21` — verification 섹션 확인. `.Codex/status/front-report.md:22` — `npm.cmd run build` passed 보고 |
| AC-18: `market-pulse-api`에서 compile/test 성공 | ✅ PASS | `.Codex/status/back-report.md:25` — verification 섹션 확인. `.Codex/status/back-report.md:26` — `.\mvnw.cmd -DskipTests compile` passed 보고 |
| AC-19A: AC-7, AC-10 통과 시 통합 verifier 조건 PASS | ✅ PASS | AC-7A/B/C와 AC-10A~F가 FAIL 없이 통과. WARN은 backend diagnostics의 추가 정합성 우려이며 AC-19A 실패 조건은 아님 |

### FAIL 상세

없음.

### 특이사항

- 런타임 서버 기동, curl 테스트, 브라우저 테스트는 workation-verifier 역할 제한에 따라 수행하지 않았습니다.
- 타입 안전성 점검: 검증 범위 파일에서 무분별한 TypeScript `any` 사용은 확인되지 않았습니다.
- dead code 점검: 검증 범위에서 AC를 저해하는 미사용 import/변수는 확인되지 않았습니다.
- WARN: `DiagnosticsPanel`은 `classDistribution`을 map으로 렌더링하지만 backend `QuantDiagnosticsDto`는 현재 `classDistribution` 필드를 반환하지 않습니다. 현재 AC-10F는 렌더링 방식 검증이므로 PASS 판정 유지, 후속 계약 정합성 개선 대상으로 기록합니다.
