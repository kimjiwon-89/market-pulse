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
│   ├── NetBuyingList/index.tsx
│   ├── MemoList/index.tsx
│   ├── NewsList/index.tsx
│   ├── Login/index.tsx         # 로그인 페이지 (DefaultLayout 바깥)
│   └── Admin/index.tsx         # 사용자 관리 (ADMIN 전용)
├── components/
│   ├── chart/
│   │   └── RankingTable.tsx    # 순매수 순위 테이블
│   └── common/
│       ├── DefaultLayout.tsx   # Header + Nav + main + Footer 레이아웃
│       ├── Header.tsx          # 로그인 유저명 + 로그아웃 버튼 포함
│       ├── Nav.tsx             # ADMIN 로그인 시 "관리자" 메뉴 노출
│       └── Footer.tsx
├── services/
│   └── apiClient.ts            # axios + JWT 인터셉터, auth 헬퍼 함수
├── hooks/index.ts
├── types/index.ts              # 공통 타입
├── index.css                   # @import "tailwindcss"
└── main.tsx                    # 진입점 — AppRouter 직접 사용
```

## 페이지 라우팅

| 경로 | 컴포넌트 | 인증 필요 | 상태 |
|------|----------|-----------|------|
| `/login` | Login | ❌ | 완료 |
| `/` | Dashboard | ❌ | 완료 |
| `/index/:id` | IndexDetail | ❌ | 완료 |
| `/investor` | InvestorTrend | ❌ (메모 기능만 필요) | 완료 |
| `/net-buy` | NetBuyingList | ❌ | 완료 |
| `/memo` | MemoList | ❌ (메모 기능만 필요) | 완료 |
| `/news` | NewsList | ❌ | 완료 |
| `/stock/:code` | StockDetail | ❌ | 구현 예정 |
| `/admin` | Admin | ✅ ADMIN | 완료 |
| `/lotto` | LottoAnalysis | ❌ (내 조합 저장만 필요) | 완료 |

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

## 인증 (JWT)

### 토큰 저장 위치

`localStorage` — 키: `mp_token`, `mp_username`, `mp_role`

### apiClient 헬퍼 함수

```ts
import { apiClient, setAuth, clearAuth, getToken, getUsername, getRole } from '@/services/apiClient';

// 로그인 후 저장
setAuth(token, username, role);

// 로그아웃
clearAuth();  // localStorage 전체 삭제 후 /login 이동

// 현재 유저 정보 읽기
getUsername();  // 헤더 표시용
getRole();      // 'ADMIN' | 'USER' — Nav 메뉴 분기용
```

### 인터셉터 동작

- **요청**: `Authorization: Bearer <token>` 자동 주입
- **응답 401**: `clearAuth()` + `/login` 리다이렉트 (단, `/auth/` 경로 제외)

### 로그인

```ts
const res = await apiClient.post('/auth/login', { username, password });
const { token, username: uname, role } = res.data.data;
setAuth(token, uname, role);
```

## API 호출

```ts
import { apiClient } from '@/services/apiClient';

// 예시
const res = await apiClient.get('/investor/trade-top', { params: { market: 'KOSPI' } });
```

## NetBuyingList 기능 스펙 (`/net-buy`)

> 참고 레퍼런스: `.claude/연합뉴스 순매수도 상위 20위.xlsx`

### 필터

| 필터 | 선택지 |
|------|--------|
| 투자자 | 외국인 / 기관 / 전체 |
| 거래유형 | 순매수 / 순매도 |
| 시장 | 코스피 / 코스닥 / 전체 |

세 필터 조합이 모두 가능. 선택 즉시 테이블 갱신.

### 날짜별 시계열 뷰 (엑셀 동일 구조)

날짜를 복수 선택하면 날짜 컬럼이 가로로 확장되며, **5영업일마다 주간 합계 컬럼**이 자동 삽입된다.

**테이블 헤더 3단 구조**

```
1행: 순매수 | 2026.05.12 |  |  | 2026.05.13 |  |  | 주간합계 |  |  | 2026.05.14 | ...
2행: 코스피  | 순매수     |  |  | 순매수     |  |  | 순매수   |  |  | 순매수     | ...
3행: 외국인  | 종목명 | 순매수대금 | 순매수량 | 종목명 | 순매수대금 | 순매수량 | ...
```

**데이터 행 구조**

```
순위 | [날짜1] 종목명 / 순매수대금(억) / 순매수량(만주) | [날짜2] ... | [주간합계] ... | [날짜3] ...
```

- 세로: 순위 1~20위
- 가로: 날짜 1개 = 3컬럼 (종목명, 순매수대금, 순매수량), 5일 후 주간합계 컬럼 1세트 추가
- 기본값: 오늘 날짜 단일 조회
- 날짜 추가/제거 시 컬럼 동적 증감

---

## 종목 상세 + @mention 태그 스펙 (구현 예정)

### StockDetail 페이지 (`/stock/:code`)

```
KPI 카드 (현재가 / 등락률 / 거래량 / 시가총액)
기간 선택 칩 (1M / 3M / 1Y) + AreaChart
투자자동향 카드 (외국인·기관 순매수)
```

- `GET /api/stock/detail?code=:code`
- `GET /api/stock/chart?code=:code&period=1M`
- `GET /api/stock/investor?code=:code`

### @mention 태그 (InvestorTrend 메모 카드)

**UX 흐름**
```
textarea에 @ 입력
  → GET /api/stock/search?q=<이후 입력> → 드롭다운 표시
  → 종목 선택 → 텍스트에 @종목명(코드) 삽입
  → 메모 저장 시 @태그 파싱 → 현재가 스냅샷과 함께 /api/investor/memo/{id}/tag POST
```

**메모 카드 태그 표시**
```
[삼성전자 005930]  기준가 82,000원  →  현재 84,500원  +3.05%  (클릭 시 /stock/005930)
```
- 현재가는 trade-top 테이블에서 있으면 실시간, 없으면 `/api/stock/detail` 호출
- X 버튼으로 태그 제거 (`DELETE /api/investor/memo/tag/{tagId}`)

**타입 추가 (`src/types/index.ts`)**
```ts
interface StockMasterItem {
  code: string;
  name: string;
  market: 'KOSPI' | 'KOSDAQ';
  sector?: string;
}

interface MemoStockTag {
  id: number;
  stockCode: string;
  stockName: string;
  priceAtTag: number;
  changeRateAtTag: number;
  taggedAt: string;
}
```

**MemoResponseDto 변경** — `tags: MemoStockTag[]` 필드 포함 (백엔드 동시 작업 필요)

---

## 실시간 데이터 갱신 (구현 예정)

방식: **프론트 폴링 (`setInterval`)** — 추가 인프라 없이 가장 단순·안정적

### 장중 여부 판단 헬퍼 (공통 유틸로 추가 예정)

```ts
// src/utils/market.ts
export function isMarketOpen(): boolean {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= 540 && minutes < 930; // 09:00 ~ 15:30 (KST)
}
```

### 폴링 간격 기준

| 데이터 | 위치 | 간격 | 조건 |
|--------|------|------|------|
| 시장 지수 (KOSPI/KOSDAQ/KOSPI200) | Dashboard | 10초 | 장중에만 |
| 종목 현재가 | StockDetail | 10초 | 장중에만 |
| 투자자 동향 | Dashboard, InvestorTrend | 30초 | 장중에만 |

### 패턴

```ts
useEffect(() => {
  if (!isMarketOpen()) return;
  const id = setInterval(fetchData, 10_000);
  return () => clearInterval(id);
}, [fetchData]);
```

- 장 외 시간에는 interval 등록 자체를 안 함 (KIS API 불필요 호출 방지)
- cleanup 함수로 언마운트 시 자동 해제
- 요청 실패해도 다음 interval에 자동 재시도 (별도 에러 처리 불필요)

---

## 주의사항

- `@/` 경로 alias 사용 가능 (vite.config.ts에 설정됨)
- `public/` 폴더에는 favicon.svg만 존재
- Nav에 새 링크 추가 시 `end` prop 처리 여부 확인 (`/`는 반드시 `end` 필요)
