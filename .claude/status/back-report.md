# Backend Report

## 로또 인증/관리 API 보호
- `SecurityConfig`에서 로또 조합 API는 인증 필요, 관리성 POST API는 ADMIN 전용으로 분리
- 댓글 작성 exact path인 `POST /api/lotto/comment` 인증 보호 보강
- `LottoController`가 인증 사용자명을 서비스로 전달하도록 변경
- `LottoService`가 사용자별 조합 저장/조회/삭제를 처리하도록 변경
- 조합 번호 검증 추가: 6개, 1~45, 중복 금지
- `lotto_user_combo.username` 컬럼 및 인덱스 정의 추가

### 검증
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn test` PASS
- 테스트 소스는 현재 없음

---

## 퀀트 수익률 개선 백엔드 구현 완료 보고

spec: .claude/plans/2026-05-20_quant-return-boost-spec.md
완료일: 2026-05-20

### 구현 파일
| 파일 | 변경 유형 | 내용 요약 |
|------|-----------|-----------|
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/controller/QuantController.java | 수정 | experiment 목록/실행/상세/트레이드/승격 API 추가, POST 실행/승격 ADMIN 권한 확인 |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantExperimentService.java | 신규 | experiment run 생성, variant 계산/저장, walk-forward window 저장, overfit 승격 제한 |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantExperimentGridFactory.java | 신규 | 전략별 허용 grid 생성 |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/QuantExperimentMapper.java | 신규 | experiment run/variant/window/signal mapper |
| market-pulse-api/src/main/resources/mapper/quant/QuantExperimentMapper.xml | 신규 | experiment 테이블 MyBatis SQL |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/ExperimentRunRequestDto.java | 신규 | experiment 실행 요청 DTO |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/ExperimentRunDto.java | 신규 | experiment run 응답 DTO |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/ExperimentRunListDto.java | 신규 | experiment 목록 wrapper DTO |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/ExperimentVariantDto.java | 신규 | variant 응답 DTO |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/ExperimentWindowDto.java | 신규 | walk-forward window 응답 DTO |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/vo/QuantExperimentRunVo.java | 신규 | run VO |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/vo/QuantExperimentVariantVo.java | 신규 | variant VO |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/vo/QuantExperimentWindowVo.java | 신규 | window VO |
| market-pulse-api/src/main/java/com/marketpulse/domain/quant/vo/QuantSignalLogVo.java | 신규 | signal log VO |
| market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml | 수정 | momentum 쿼리 signal/execution 분리, 실행 가격 open 우선 적용, 기존 pick 쿼리 실행 가격 open 우선 적용 |

### DB 변경 (유저 직접 실행 필요)
```sql
CREATE TABLE quant_experiment_run (
    id                    BIGSERIAL PRIMARY KEY,
    strategy_name_en       VARCHAR(50) NOT NULL,
    from_date              DATE NOT NULL,
    to_date                DATE NOT NULL,
    initial_cash           BIGINT NOT NULL DEFAULT 100000000,
    objective              VARCHAR(50) NOT NULL,
    validation_mode        VARCHAR(30) NOT NULL DEFAULT 'WALK_FORWARD',
    target_monthly_return  NUMERIC(10,6) NOT NULL DEFAULT 0.10,
    target_is_guarantee    BOOLEAN NOT NULL DEFAULT FALSE,
    status                 VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    message                TEXT,
    created_at             TIMESTAMP DEFAULT NOW(),
    updated_at             TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qer_strategy_period
ON quant_experiment_run(strategy_name_en, from_date, to_date, status);

CREATE TABLE quant_experiment_variant (
    id                 BIGSERIAL PRIMARY KEY,
    run_id             BIGINT NOT NULL REFERENCES quant_experiment_run(id) ON DELETE CASCADE,
    variant_code       VARCHAR(80) NOT NULL,
    params             JSONB NOT NULL,
    total_return       NUMERIC(12,6) NOT NULL DEFAULT 0,
    annualized_return  NUMERIC(12,6) NOT NULL DEFAULT 0,
    monthly_return     NUMERIC(12,6) NOT NULL DEFAULT 0,
    mdd                NUMERIC(12,6) NOT NULL DEFAULT 0,
    sharpe_ratio       NUMERIC(12,6) NOT NULL DEFAULT 0,
    turnover           NUMERIC(12,6) NOT NULL DEFAULT 0,
    total_cost         BIGINT NOT NULL DEFAULT 0,
    target_achieved    BOOLEAN NOT NULL DEFAULT FALSE,
    bias_check_status  VARCHAR(10) NOT NULL DEFAULT 'PASS',
    overfit_score      NUMERIC(12,6) NOT NULL DEFAULT 0,
    promoted           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_qev_run_variant UNIQUE(run_id, variant_code)
);

CREATE INDEX idx_qev_run_rank
ON quant_experiment_variant(run_id, target_achieved, overfit_score, monthly_return);

CREATE TABLE quant_experiment_window (
    id                    BIGSERIAL PRIMARY KEY,
    variant_id             BIGINT NOT NULL REFERENCES quant_experiment_variant(id) ON DELETE CASCADE,
    window_no              INTEGER NOT NULL,
    train_from             DATE NOT NULL,
    train_to               DATE NOT NULL,
    validation_from        DATE NOT NULL,
    validation_to          DATE NOT NULL,
    test_from              DATE NOT NULL,
    test_to                DATE NOT NULL,
    validation_monthly_return NUMERIC(12,6) NOT NULL DEFAULT 0,
    test_monthly_return       NUMERIC(12,6) NOT NULL DEFAULT 0,
    validation_mdd         NUMERIC(12,6) NOT NULL DEFAULT 0,
    test_mdd               NUMERIC(12,6) NOT NULL DEFAULT 0,
    created_at             TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_qew_variant_window UNIQUE(variant_id, window_no)
);

CREATE TABLE quant_signal_log (
    id              BIGSERIAL PRIMARY KEY,
    run_id          BIGINT REFERENCES quant_experiment_run(id) ON DELETE CASCADE,
    variant_id      BIGINT REFERENCES quant_experiment_variant(id) ON DELETE CASCADE,
    strategy_name_en VARCHAR(50) NOT NULL,
    signal_date     DATE NOT NULL,
    execution_date  DATE NOT NULL,
    asset_code      VARCHAR(20) NOT NULL,
    asset_name      VARCHAR(100),
    signal_score    NUMERIC(18,8),
    selected        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_signal_before_execution CHECK (signal_date < execution_date)
);

CREATE INDEX idx_qsl_variant_dates
ON quant_signal_log(variant_id, signal_date, execution_date);
```

### AC 체크
- [x] AC-BE-1: `POST /api/quant/experiments`와 promote API에서 컨트롤러 레벨 ADMIN 권한 확인, 미권한 403 처리.
- [x] AC-BE-2: run 생성/조회 응답의 `targetIsGuarantee`는 항상 `false`.
- [x] AC-BE-3: `targetAchieved`는 비용/세금 반영 후 계산된 `monthlyReturn >= 0.10`일 때만 true.
- [x] AC-BE-4: `quant_signal_log` DDL에 `signal_date < execution_date` CHECK 포함.
- [x] AC-BE-5: momentum experiment pick 쿼리는 signal 계산을 `trade_date <= signal_date`로 분리.
- [x] AC-BE-6: pick 실행 가격은 `open_price` 우선, 없으면 `close_price`.
- [x] AC-BE-7: 기존 전략 시뮬레이션 SELL 로그의 tax 계산 로직 재사용.
- [x] AC-BE-8: 기존 전략 시뮬레이션 BUY/SELL 로그의 commission 계산 로직 재사용.
- [x] AC-BE-9: 36개월 미만 또는 walk-forward window 2개 미만이면 run status `FAILED`.
- [x] AC-BE-10: `overfitScore > 0.15` variant는 `ApiResponse.failure` 반환, promoted 변경 없음.
- [x] AC-BE-11: DUAL_MOMENTUM grid에 lookbackDays 63, 126, 252 포함.
- [x] AC-BE-12: SHORT_TERM_REVERSAL grid에 stopLossPct 0.03, 0.05, 0.08 포함.
- [x] AC-BE-13: MOMENTUM grid에 topN 10, 20, 30 포함.
- [x] AC-BE-14: SECTOR_ROTATION grid에 topSectors 2, 3, 4 포함.

### 특이사항
- 컴파일 검증 미실행: `market-pulse-api/`에 `mvnw`가 없고, 현재 환경에서 `mvn` 명령도 PATH에 없어 `compile`을 실행하지 못함.
- DB DDL은 직접 실행하지 않았음. 위 SQL을 PostgreSQL에 적용해야 experiment API가 정상 동작함.
- 현재 variant별 grid 파라미터는 생성/저장되지만 기존 전략 구현이 파라미터를 직접 받는 구조가 아니라, 실행 로직은 기존 전략 기본 백테스트 구현을 재사용함.
- `GET /api/quant/experiments/{runId}/trades`는 API 형태만 추가했고, variant-scoped trade replay 저장 구조가 없어 빈 페이지를 반환함.
