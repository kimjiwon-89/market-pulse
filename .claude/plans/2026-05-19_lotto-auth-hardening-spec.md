# 로또 인증/관리 API 보호 Spec

## 메타
- 상태: PLANNING
- 작성일: 2026-05-19
- 대상 영역: backend 우선, frontend 보조
- 관련 경로:
  - `market-pulse-api/src/main/java/com/marketpulse/global/config/SecurityConfig.java`
  - `market-pulse-api/src/main/java/com/marketpulse/domain/lotto/**`
  - `market-pulse-web/src/pages/LottoAnalysis/**`
  - `market-pulse-web/src/services/apiClient.ts`

## 배경
현재 로또 분석 기능은 조회 API와 일부 쓰기 API가 같은 `/api/lotto` 하위에 섞여 있다.
`SecurityConfig`에서는 로또 댓글의 POST/PATCH/DELETE만 인증을 요구하고 있으며, 아래 API는 공개 요청으로 실행될 가능성이 있다.

- `POST /api/lotto/combo`
- `DELETE /api/lotto/combo/{id}`
- `POST /api/lotto/analyze`
- `POST /api/lotto/collect`
- `POST /api/lotto/bulk-results`
- `POST /api/lotto/analyze-all`
- `POST /api/lotto/result`

이 중 사용자 조합 저장/삭제는 로그인 사용자 기능이고, 분석/수집/대량 입력은 운영성 관리 기능이므로 공개 API로 두면 안 된다.

## 목표
1. 로또 사용자 조합 저장/삭제를 인증 사용자만 수행하게 한다.
2. 로또 관리성 실행 API는 ADMIN 권한에서만 수행하게 한다.
3. 사용자 조합 데이터가 가능하면 로그인 사용자별로 분리되도록 한다.
4. 프론트엔드는 인증이 필요한 액션에서 로그인 상태를 명확히 처리한다.

## 비목표
- 로또 분석 알고리즘 자체 변경
- 로또 UI 전면 개편
- 동행복권 봇 차단 우회 방식 변경
- S3 업로드 정책 변경
- DB 마이그레이션 도구 도입

## 현재 확인 사항
- 프론트 `npm run build`: PASS
- 백엔드 `mvn test`: PASS, 단 테스트 소스 없음
- `market-pulse-api`에 `mvnw` 없음
- 실제 프로젝트 보조 문서 디렉터리는 `.claude/`이며, 일부 문서에는 `.Codex/`로 적혀 있어 불일치가 있음

## 구현 범위

### Backend
1. `SecurityConfig` 접근 제어 정리
   - 공개 허용:
     - `GET /api/lotto/latest`
     - `GET /api/lotto/rounds`
     - `GET /api/lotto/analysis`
     - `GET /api/lotto/stats`
     - `GET /api/lotto/comment`
   - 인증 필요:
     - `POST /api/lotto/combo`
     - `GET /api/lotto/combo`
     - `DELETE /api/lotto/combo/{id}`
     - `POST/PATCH/DELETE /api/lotto/comment/**`
   - ADMIN 필요:
     - `POST /api/lotto/analyze`
     - `POST /api/lotto/collect`
     - `POST /api/lotto/bulk-results`
     - `POST /api/lotto/analyze-all`
     - `POST /api/lotto/result`

2. 사용자 조합 소유권 분리 검토 및 적용
   - 권장 DB 변경:
     - `lotto_user_combo`에 `username VARCHAR(50)` 또는 `user_id INTEGER` 추가
   - 현재 인증 구조가 username 중심이므로 1차 구현은 `username` 컬럼을 권장한다.
   - 저장 시 `Authentication.getName()`을 서비스로 전달한다.
   - 목록 조회 시 해당 사용자 조합만 반환한다.
   - 삭제 시 해당 사용자 소유 조합만 삭제한다.

3. 입력 검증 보강
   - 조합 번호는 정확히 6개
   - 번호 범위는 1~45
   - 중복 번호 금지
   - drawNo는 양수

4. 실패 응답 정책
   - 미인증: 기존 401 응답 유지
   - 권한 없음: Spring Security 기본 403 또는 통일된 JSON 응답 중 선택
   - 잘못된 조합: `ApiResponse.failure(...)` 또는 validation 예외 처리

### Frontend
1. `/lotto` 내 조합 저장/삭제 액션
   - 로그인하지 않은 사용자가 저장/삭제 시 `/login` 이동 또는 로그인 안내
   - 401 발생 시 기존 `apiClient` 인터셉터 흐름 유지

2. 내 조합 목록
   - 로그인 사용자일 때만 요청하거나, 401이 UX를 해치지 않도록 처리
   - 공개 조회 영역과 내 조합 영역의 실패 상태를 분리한다.

## DB 변경안
```sql
ALTER TABLE lotto_user_combo
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_lotto_user_combo_username
ON lotto_user_combo (username, draw_no);
```

주의:
- 기존 저장된 조합은 `username`이 NULL일 수 있다.
- 기존 데이터를 특정 사용자에게 귀속할지, 숨길지, 삭제할지는 유저 결정이 필요하다.

## 결정 필요 사항
1. 기존 `lotto_user_combo` 데이터 처리
   - A안: NULL 데이터는 관리자/legacy로 남기고 일반 사용자에게 숨김
   - B안: 특정 계정에 귀속
   - C안: 초기화

2. 로또 조합 조회 권한
   - A안: 로그인 사용자만 자기 조합 조회
   - B안: 비로그인 사용자는 빈 배열 반환
   - 권장: A안. API는 인증 요구, 프론트에서 비로그인 시 호출하지 않음.

## Acceptance Criteria
- [ ] 비로그인 사용자는 `POST /api/lotto/combo` 호출 시 401을 받는다.
- [ ] 로그인 사용자는 자기 조합을 저장할 수 있다.
- [ ] 로그인 사용자는 자기 조합 목록만 조회한다.
- [ ] 로그인 사용자는 자기 조합만 삭제할 수 있다.
- [ ] 일반 USER는 `POST /api/lotto/analyze` 호출 시 403을 받는다.
- [ ] ADMIN은 `POST /api/lotto/analyze`를 실행할 수 있다.
- [ ] 공개 조회 API `GET /api/lotto/latest`, `/rounds`, `/analysis`, `/stats`는 비로그인 상태에서도 동작한다.
- [ ] 프론트 빌드가 성공한다.
- [ ] 백엔드 컴파일 또는 테스트가 성공한다.

## 검증 명령
```bash
cd market-pulse-web
npm run build

cd ../market-pulse-api
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn test
```

## 리스크
- 현재 테스트 코드가 없어 보안 정책 회귀를 자동으로 잡기 어렵다.
- DB 마이그레이션 도구가 없으므로 운영 DB 반영 절차를 별도로 확인해야 한다.
- 기존 문서의 `.Codex` 경로와 실제 `.claude` 경로가 달라 후속 에이전트가 산출물을 못 찾을 수 있다.
