# Quant Return Boost TODO

작성일: 2026-05-20

## 현재 상태

- 사용자 승인 후 `workation-back`, `workation-front` 구현 에이전트 실행 완료.
- 백엔드 구현 보고서: `.claude/status/back-report.md`
- 프론트 구현 보고서: `.claude/status/front-report.md`
- verifier는 시작했지만 사용자 요청으로 중단했고, 검증 보고서는 아직 미완료.

## 완료된 작업

- `/api/quant/experiments` 계열 백엔드 API 추가.
- experiment run / variant / window / signal DTO, VO, mapper, service, grid factory 추가.
- ADMIN 권한 체크, `targetIsGuarantee=false`, `targetAchieved`, overfit guard, walk-forward 실패 처리 추가.
- `/quant` 프론트에 experiment panel, variant table, drawdown chart, monthly return heatmap 추가.
- 프론트 `npm.cmd run build` 성공.

## 다음 세션 TODO

1. verifier 재실행
   - `workation-verifier`로 `.claude/plans/2026-05-20_quant-return-boost-spec.md`의 AC 전체 PASS/FAIL 확인.
   - `.claude/status/verify-report.md` 생성.

2. 백엔드 컴파일 환경 확보
   - 현재 `market-pulse-api/`에 `mvnw` 없음.
   - 현재 환경에서 `mvn` PATH 없음.
   - Maven 설치 또는 wrapper 추가 후 `mvn test` 또는 `mvn -DskipTests compile` 실행.

3. DB DDL 적용 필요
   - `.claude/status/back-report.md`에 있는 `quant_experiment_run`, `quant_experiment_variant`, `quant_experiment_window`, `quant_signal_log` DDL을 PostgreSQL에 적용.
   - 가능하면 `QuantSchemaInitRunner` 또는 `scripts/quant_tables.sql`에 반영할지 결정.

4. 백엔드 제한 확인
   - `GET /api/quant/experiments/{runId}/trades`는 현재 variant-scoped trade replay 저장 구조가 없어 빈 페이지를 반환한다고 보고됨.
   - spec 요구와 다르면 trade 저장 구조 추가 필요.

5. 프론트 차트 데이터 확인
   - `DrawdownChart`, `MonthlyReturnHeatmap`은 variant `equityCurve`가 없으면 empty state.
   - 백엔드 variant 응답에 `equityCurve`를 넣을지, run 상세 응답에서 별도 endpoint로 가져올지 결정.

6. 수익률 개선 로직 검증
   - 월 10%는 보장값이 아니라 목표/필터링 기준으로 유지.
   - 실제 variant별 `monthlyReturn >= 0.10` 달성 여부 확인.
   - 과최적화 방지: `overfitScore <= 0.15` 조건 작동 확인.

7. look-ahead bias 검증
   - signal 계산일과 execution date 분리 확인.
   - `quant_signal_log`의 `signal_date < execution_date` CHECK 확인.
   - 기존 pick 쿼리 수정이 모든 전략에 일관되게 반영됐는지 확인.

8. 최종 검증 후 로그 업데이트
   - verifier PASS/FAIL 결과를 `.claude/.logs/2026-05-20-log.md`에 추가.
   - FAIL 항목이 있으면 재기획 또는 수정 작업으로 분기.
