# Backend Report

## 로또 인증/관리 API 보호
- `SecurityConfig`에서 로또 조합 API는 인증 필요, 관리성 POST API는 ADMIN 전용으로 분리
- 댓글 작성 exact path인 `POST /api/lotto/comment` 인증 보호 보강
- `LottoController`가 인증 사용자명을 서비스로 전달하도록 변경
- `LottoService`가 사용자별 조합 저장/조회/삭제를 처리하도록 변경
- 조합 번호 검증 추가: 6개, 1~45, 중복 금지
- `lotto_user_combo.username` 컬럼 및 인덱스 정의 추가

## 검증
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn test` PASS
- 테스트 소스는 현재 없음
