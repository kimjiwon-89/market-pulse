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
│   ├── StockDetail/index.tsx   # 종목 상세 (현재가·차트·투자자동향)
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
| `/stock/:code` | StockDetail | ❌ | 완료 |
| `/admin` | Admin | ✅ ADMIN | 완료 |
| `/lotto` | LottoAnalysis | ❌ (내 조합 저장/조회/삭제만 필요) | 완료 |
| `/quant` | QuantBacktest | ❌ | 진행 — 퀀트 백테스팅 |

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
| 투자자 | 외국인 / 기관 |
| 거래유형 | 순매수 / 순매도 |
| 시장 | 코스피 / 코스닥 / 전체 |

세 필터 조합이 모두 가능. 선택 즉시 테이블 갱신.
- 기관(INSTITUTION) 선택 시 API 호출 없이 즉시 빈 상태 표시 ("준비 중")

### 날짜 범위 선택 UI

```
[← 이전주]  [시작일 input]  ~  [종료일 input]  [다음주 →]  [오늘]
```

- 기본 범위: 이번주 월요일 ~ min(오늘, 금요일) — `getThisWeekBounds(today)` 사용
- `[← 이전주]` / `[다음주 →]`: 현재 시작일 월요일 기준 ±7일 이동 → 항상 월~금 full week 표시
- `[오늘]`: 이번주 월~min(오늘, 금)으로 리셋 — `getThisWeekBounds(today)` 재호출
- 날짜 범위 변경 시 범위 내 모든 영업일 자동 생성 → 날짜별 API 병렬 호출

### 시계열 테이블 (항상 타임라인 뷰)

단일 날짜도 항상 타임라인 구조. 날짜 범위 내 영업일이 가로 컬럼으로 자동 확장.

**고정(sticky) 컬럼 구조**

| 위치 | 컬럼 | 너비(데스크톱) | 너비(모바일) |
|------|------|--------------|------------|
| 좌측 고정 | 순위 | 44px | 44px |
| 우측 고정 | 합계 종목명 | 110px | 100px |
| 우측 고정 | 합계 대금(억) | 78px | 숨김 |
| 우측 고정 | 합계 수량(만주) | 68px | 숨김 |

- 날짜 컬럼은 가로 스크롤
- `borderCollapse: "separate", borderSpacing: 0` 필수 (sticky 동작 조건)
- 합계 컬럼 좌측에 그림자 구분선 (`box-shadow: -4px 0 6px -4px rgba(0,0,0,0.3)`)
- **모바일**: 합계 열은 종목명만 표시, 날짜별 컬럼 폭도 축소 (`M_NAME_W=100, M_AMT_W=70, M_VOL_W=56`)

**합계(조회기간 누적) 컬럼**

- 조회 범위 내 모든 날짜의 데이터를 종목별로 집계 → 순매수대금 기준 TOP 20 재랭킹
- 상태: 일부 날짜 로딩 중 → 스켈레톤 표시 / 하나라도 완료 → 부분 결과 즉시 표시
- `calcRangeTotal(dates, dataMap)` 함수로 계산 (`useMemo`)

**날짜 컬럼별 3-sub-column**

```
[날짜 헤더]
종목명 | 대금(억) | 수량(만주)
```

- 날짜 헤더에 상태 인디케이터: `<LiveBadge>` (오늘) / `저장됨` / `미저장`
- **오늘 컬럼 강조**: 헤더 날짜 대신 "오늘" 텍스트, 배경 `--accent-soft`, 텍스트 `--accent`, bold
- 테이블 셀에 단위 미표시 — 헤더에 `(억)`, `(만주)` 표기로 충분
- **비거래일 컬럼 자동 숨김**: 전체 날짜 로딩 완료 후 items 빈 날짜(공휴일·비거래일) 컬럼 제거
  - `allLoaded`: 전체 날짜 로딩 완료 여부 useMemo
  - `visibleDates`: `allLoaded` 후 빈 날짜 필터링 (`dates`에서 파생, 오늘·에러 날짜는 유지)
  - 합계 누적·minWidth·필터 카운트 모두 `visibleDates` 기준

**sticky 컬럼 right offset 상수**

```ts
// 데스크톱
const RANK_W = 44;   const NAME_W = 110;  const AMT_W = 78;   const VOL_W = 68;
// 모바일
const M_NAME_W = 100; const M_AMT_W = 70;  const M_VOL_W = 56;

// 컴포넌트 내에서 반응형 선택
const nameW = isMobile ? M_NAME_W : NAME_W;
const amtW  = isMobile ? M_AMT_W  : AMT_W;
const volW  = isMobile ? M_VOL_W  : VOL_W;
const groupW = isMobile ? M_GROUP_W : GROUP_W;
```

### 종목 상세 모달 (`StockModal`)

행 클릭 시 슬라이드업 모달 표시. `stat-cell` / `stat-label` / `stat-value` 패턴 사용.

```
[종목명]  [종목코드]  →종목 상세 페이지 링크
───────────────────────────────────
현재가         등락률          지분률(외국인만)
82,000원      ▲+2.3%          51.2%
───────────────────────────────────
순매수대금          순매수량
+123억              45만주
───────────────────────────────────
메모 (댓글형)
  [textarea]
  [저장] 버튼
```

- 현재가·등락률·지분률: trade-top API 응답 데이터 재사용 (별도 API 호출 없음)
- 지분률(`foreignShareRatio`): 외국인 선택 + 실시간(오늘) 데이터에서만 표시
- 등락률 색상: 빨강=상승(up), 파랑=하락(down), 기본=보합(flat) — `dirCls()` 헬퍼 사용
- 배경: `var(--bg-panel)` (`--bg-card` 없음 주의)
- 메모: `investor_memo` API 사용 (날짜+시장 기준 upsert), 로그인 필요

### 하단 메모

InvestorTrend와 동일한 구조 — 날짜+시장 기준, 로그인 필요.
`GET/POST/DELETE /api/investor/memo` 재사용.
@종목 태그 자동완성: stock_master 구현 후 추가 예정.

### 핵심 유틸 함수

```ts
isWeekday(d: Date): boolean                           // 토/일 제외
getWeekdays(start: string, end: string): string[]     // YYYYMMDD 범위 내 영업일 목록
getMondayOf(dateStr: string): Date                    // 해당 날짜가 속한 주의 월요일
getThisWeekBounds(today: string): {start, end}        // 이번주 월~min(오늘,금) 범위
shiftWeek(delta: 1|-1): void                          // ±7일(월 기준) 이동, 항상 월-금
resetToToday(): void                                  // 이번주 월~min(오늘, 금)으로 리셋
calcRangeTotal(visibleDates, dataMap): RangeTotal      // 조회기간 누적 합계 TOP20
```

---

## 종목 상세 + @mention 태그 스펙

### StockDetail 페이지 (`/stock/:code`) — 완료

```
KPI 카드 (현재가 / 등락률 / 거래량 / 시가총액)
기간 선택 칩 (1M / 3M / 1Y) + AreaChart
투자자동향 카드 (외국인·기관·개인 순매수대금/매수/매도)
시세 정보 카드 (시가·고가·저가·52주최고/최저)
```

**구현 파일**: `src/pages/StockDetail/index.tsx`

**API**
- `GET /api/stock/detail?code=` → `StockDetail` 타입
- `GET /api/stock/chart?code=&period=1M|3M|1Y` → `StockChartItem[]`
- `GET /api/stock/investor?code=` → `StockInvestor` 타입

**타입** (`src/types/index.ts`): `StockDetail`, `StockChartItem`, `StockInvestor`, `StockMasterItem`

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

### 장중 여부 훅 — `useIsMarketOpen` (구현 완료)

```ts
// src/hooks/index.ts
export function useIsMarketOpen(): boolean
// 평일 09:00 ~ 15:30 KST 기준, 1분마다 갱신
```

### LiveBadge 컴포넌트 — `src/components/common/LiveBadge.tsx` (구현 완료)

장중/종가 상태를 시각적으로 표시. `실시간` 표시가 필요한 모든 곳에 사용.

```tsx
import { LiveBadge } from "@/components/common/LiveBadge";

// 장중: 초록 펄스 점 + "실시간" (초록)
// 장 마감: "종가" (흐린 회색)
<LiveBadge size={11} />  // size 기본값 11px
```

적용 위치: `Header`, `Dashboard` 시장지수 카드, `InvestorTrend` 열 헤더, `NetBuyingList` 오늘 날짜 컬럼

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

## 반응형 (모바일) 작업 가이드

> 상세 변환 규칙·컴포넌트 패턴: `design-guide.md` → "모바일 컴포넌트 변환 규칙" 섹션

### 기본 방침

- **모바일 퍼스트** — 기본 스타일이 모바일, `lg:` prefix로 데스크톱 추가
- **브레이크포인트**: `768px`(md) / `1024px`(lg) — Tailwind 4 기본값 그대로
- **Sidebar** → 모바일에서 숨기고 하단 Bottom Nav로 대체
- **테이블** → 모바일에서 카드 리스트로 변환 (NetBuyingList 제외 — 가로 스크롤 유지)

### 레이아웃 컴포넌트 대응

| 컴포넌트 | 데스크톱 | 모바일 |
|----------|----------|--------|
| `Nav.tsx` (사이드바) | `lg:flex` — 왼쪽 고정 | `hidden lg:flex` |
| `BottomNav.tsx` (신규) | `hidden` | `fixed bottom-0, flex` |
| `Header.tsx` | 60px, brand + 검색 + 상태 | 52px, brand만 |
| `DefaultLayout.tsx` | `ml-[224px]` 오프셋 | 오프셋 없음, `pb-16` (BottomNav 여백) |

### 새 공통 컴포넌트 추가 시

```
src/components/common/
├── BottomNav.tsx     # 모바일 하단 네비게이션 (신규)
└── MobileCard.tsx   # 테이블 row → 카드 변환용 (필요 시)
```

### `useIsMobile` 훅

화면 크기 판단이 필요한 컴포넌트에서 사용 (차트 높이, 조건부 렌더링 등).

```ts
// src/hooks/index.ts에 추가
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}
```

### 페이지별 작업 우선순위

| 우선순위 | 페이지 | 주요 작업 |
|----------|--------|-----------|
| 1 | DefaultLayout + Nav + BottomNav | 공통 레이아웃 — 전 페이지 영향 |
| 2 | Dashboard | stat-grid 2×2, grid-12 → 단일 컬럼 |
| 3 | InvestorTrend | 필터 탭 스크롤, 테이블 → 카드 |
| 4 | StockDetail | KPI 2×2, 차트 높이 축소 |
| 5 | NetBuyingList | 가로 스크롤, 날짜 선택기 모바일 레이아웃 |
| 6 | 나머지 페이지 | 단일 컬럼 스택, 패딩 조정 |

---

## 주의사항

- `@/` 경로 alias 사용 가능 (vite.config.ts에 설정됨)
- `public/` 폴더에는 favicon.svg만 존재
- Nav에 새 링크 추가 시 `end` prop 처리 여부 확인 (`/`는 반드시 `end` 필요)
- 모바일 Nav 추가 시 `BottomNav.tsx`도 동시에 업데이트
