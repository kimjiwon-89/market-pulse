# Frontend 작업 가이드 (market-pulse-web)

## 스택

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · React Router 7 · Recharts · Zustand · Axios

## 실행

```bash
cd market-pulse-web
npm install
npm run dev   # http://localhost:3000
```

## 디렉터리 구조

```
src/
├── app/
│   └── router.tsx              # 라우터 — 페이지 추가 시 여기에 등록
├── pages/
│   ├── Dashboard/index.tsx
│   ├── IndexDetail/index.tsx
│   ├── InvestorTrend/index.tsx
│   └── NetBuyingList/index.tsx
├── components/
│   ├── chart/
│   │   └── RankingTable.tsx    # 순매수 순위 테이블
│   └── common/
│       ├── DefaultLayout.tsx   # Header + Nav + main + Footer 레이아웃
│       ├── Header.tsx
│       ├── Nav.tsx
│       └── Footer.tsx
├── services/
│   └── apiClient.ts            # axios 인스턴스 (baseURL: http://localhost:8080/api)
├── hooks/index.ts
├── types/index.ts              # 공통 타입
├── index.css                   # @import "tailwindcss"
└── main.tsx                    # 진입점 — AppRouter 직접 사용
```

## 페이지 라우팅

| 경로 | 컴포넌트 | 상태 |
|------|----------|------|
| `/` | Dashboard | 구현 예정 |
| `/index/:id` | IndexDetail | 구현 예정 |
| `/investor` | InvestorTrend | 구현 예정 — 순매수/매도 테이블 + 메모 |
| `/net-buy` | NetBuyingList | 목업 데이터 연결 완료 |
| `/memo` | MemoList | 구현 예정 |

## 코드 컨벤션

- **export**: `named export` 사용 (`export function Foo`, default export 금지)
- **파일명**: 컴포넌트는 PascalCase, 훅/유틸은 camelCase
- **스타일**: Tailwind CSS 클래스만 사용 (styled-components, inline style 금지)
- **타입**: 공통 타입은 `src/types/index.ts`에 추가
- **import React**: 불필요 (React 19, JSX transform 사용)
- **페이지 컴포넌트**: `src/pages/<PageName>/index.tsx` 구조 유지

## 새 페이지 추가 절차

1. `src/pages/<PageName>/index.tsx` 생성
2. `src/app/router.tsx`에 route 등록
3. `src/components/common/Nav.tsx`에 링크 추가
4. 이 파일 라우팅 테이블 업데이트

## 새 컴포넌트 추가 기준

- 특정 도메인에 종속: `components/chart/` 또는 도메인별 폴더
- 레이아웃/공통 UI: `components/common/`
- 재사용 단위 컴포넌트: props 타입 정의 필수

## API 호출

```ts
import { apiClient } from '@/services/apiClient';

// 예시
const res = await apiClient.get('/investor/trade-top', { params: { market: 'KOSPI' } });
```

## 주의사항

- `@/` 경로 alias 사용 가능 (vite.config.ts에 설정됨)
- `public/` 폴더에는 favicon.svg만 존재
- Nav에 새 링크 추가 시 `end` prop 처리 여부 확인 (`/`는 반드시 `end` 필요)
