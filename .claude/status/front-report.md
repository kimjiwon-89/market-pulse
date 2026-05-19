# Frontend Report

## 범용 메모 UI
- `/memo` 페이지를 신규 `/api/memo` 기반 필터 리스트로 전환
- 기능, 날짜 범위, 시장, 종목코드, 키워드 필터 지원
- `/net-buy` 종목 모달에서 해당 날짜/시장/종목 메모 여러 개 조회/추가/삭제 지원
- `/net-buy` 하단 날짜+시장 메모도 신규 다중 메모 구조로 전환
- `/investor` 투자자 동향 메모도 신규 다중 메모 구조로 전환

## 검증
- `npm run build` PASS
- Vite chunk size warning은 기존 번들 크기 경고로 남아 있음
