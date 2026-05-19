# Frontend Report

## 로또 내 조합 인증 처리
- `/lotto`에서 비로그인 사용자가 조합 저장 시 `/login`으로 이동
- 내 조합 탭은 로그인 상태에서만 `/lotto/combo`를 호출
- 비로그인 상태에서는 로그인 안내 문구 표시

## 검증
- `npm run build` PASS
- Vite chunk size warning은 기존 번들 크기 경고로 남아 있음
- `npm run lint` FAIL: 기존 `Admin`, `Dashboard`, `IndexDetail`, `LottoDiscussion`, `NewsList`, `StockDetail` 파일의 lint 오류가 남아 있음. 이번에 수정한 `LottoAnalysis/index.tsx`의 빈 catch/any 오류는 정리됨
