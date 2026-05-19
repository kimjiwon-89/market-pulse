# Backend Report

## 범용 메모 시스템 개편
- 신규 `domain/memo` 도메인 추가
- `/api/memo` CRUD 및 필터 조회 API 추가
- `/api/memo/context`로 기능/날짜/시장/종목 맥락별 메모 조회 지원
- `memo` 테이블 DDL 및 인덱스 추가
- `/api/memo`는 로그인 사용자 개인 메모로 보호
- 기존 `/api/investor/memo` endpoint, DTO, Mapper, VO, XML 제거
- `data.sql`의 legacy `investor_memo` 생성 정의 제거

## 검증
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn test` PASS
- 로컬 PostgreSQL `memo` 테이블 및 인덱스 생성 완료
