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
| 투자자 | 외국인 / 기관 |
| 거래유형 | 순매수 / 순매도 |
| 시장 | 코스피 / 코스닥 / 전체 |

세 필터 조합이 모두 가능. 선택 즉시 테이블 갱신.
- 기관(INSTITUTION) 선택 시 API 호출 없이 즉시 빈 상태 표시 ("준비 중")

### 날짜 범위 선택 UI

```
[← 이전주]  [시작일 input]  ~  [종료일 input]  [다음주 →]  [오늘]
```

- 기본 범위: 오늘 기준 최근 10영업일 (9영업일 전 ~ 오늘)
- `[← 이전주]` / `[다음주 →]`: 시작·종료 날짜를 동시에 5영업일씩 이동 (주말 자동 스킵)
- `[오늘]`: 종료일을 오늘로 고정, 기간 폭(영업일 수) 유지
- 날짜 범위 변경 시 범위 내 모든 영업일 자동 생성 → 날짜별 API 병렬 호출

### 시계열 테이블 (항상 타임라인 뷰)

단일 날짜도 항상 타임라인 구조. 날짜 범위 내 영업일이 가로 컬럼으로 자동 확장.

**고정(sticky) 컬럼 구조**

| 위치 | 컬럼 | 너비 |
|------|------|------|
| 좌측 고정 | 순위 | 44px |
| 우측 고정 | 합계 — 종목명 / 대금(억) / 수량 | 110+78+68px |

- 날짜 컬럼은 가로 스크롤
- `borderCollapse: "separate", borderSpacing: 0` 필수 (sticky 동작 조건)
- 합계 컬럼 좌측에 그림자 구분선 (`box-shadow: -4px 0 6px -4px rgba(0,0,0,0.3)`)

**합계(조회기간 누적) 컬럼**

- 조회 범위 내 모든 날짜의 데이터를 종목별로 집계 → 순매수대금 기준 TOP 20 재랭킹
- 상태: 일부 날짜 로딩 중 → 스켈레톤 표시 / 하나라도 완료 → 부분 결과 즉시 표시
- `calcRangeTotal(dates, dataMap)` 함수로 계산 (`useMemo`)

**날짜 컬럼별 3-sub-column**

```
[날짜 헤더]
종목명 | 대금(억) | 수량
```

- 날짜 헤더에 상태 인디케이터: `실시간` (오늘) / `저장됨` (스냅샷 있음) / `미저장` (과거+스냅샷 없음)
- 빈 상태: 오늘+데이터 없음 → "집계 전 또는 휴장일" / 과거+스냅샷 없음 → "스냅샷 없음"

**sticky 컬럼 right offset 상수**

```ts
const RANK_W = 44;   // 좌측 순위 컬럼
const NAME_W = 110;  // 합계 종목명
const AMT_W  = 78;   // 합계 대금
const VOL_W  = 68;   // 합계 수량
// 합계 종목명 right: AMT_W + VOL_W
// 합계 대금   right: VOL_W
// 합계 수량   right: 0
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
isWeekday(d: Date): boolean                      // 토/일 제외
getWeekdays(start: string, end: string): string[] // YYYYMMDD 범위 내 영업일 목록
nWeekdaysBefore(n: number, from: string): string  // n영업일 이전 날짜
nWeekdaysAfter(n: number, from: string): string   // n영업일 이후 날짜
shiftWeek(delta: 1|-1): void                      // 시작+종료 동시 5영업일 이동
resetToToday(): void                              // 종료일→오늘, 기간 폭 유지
calcRangeTotal(dates, dataMap): RangeTotal        // 조회기간 누적 합계 TOP20
```

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
