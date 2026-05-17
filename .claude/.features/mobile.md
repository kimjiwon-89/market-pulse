# 모바일 반응형

**상태**: 구현 예정  
**방침**: 모바일 퍼스트 — 기본 스타일이 모바일, `lg:` prefix로 데스크톱 추가

---

## 브레이크포인트

- `768px` (md) / `1024px` (lg) — Tailwind 4 기본값

---

## 레이아웃 대응

| 컴포넌트 | 데스크톱 | 모바일 |
|----------|----------|--------|
| `Nav.tsx` (사이드바) | `lg:flex` 왼쪽 고정 | `hidden lg:flex` |
| `BottomNav.tsx` (신규) | `hidden` | `fixed bottom-0, flex` |
| `Header.tsx` | 60px, brand + 검색 + 상태 | 52px, brand만 |
| `DefaultLayout.tsx` | `ml-[224px]` 오프셋 | 오프셋 없음, `pb-16` |

---

## 신규 컴포넌트

```
src/components/common/
├── BottomNav.tsx     # 모바일 하단 네비게이션
└── MobileCard.tsx   # 테이블 row → 카드 변환용 (필요 시)
```

---

## `useIsMobile` 훅

```ts
// src/hooks/index.ts
export function useIsMobile(breakpoint = 768): boolean
```

---

## 페이지별 작업 우선순위

| 순위 | 페이지 | 주요 작업 |
|------|--------|-----------|
| 1 | DefaultLayout + Nav + BottomNav | 전 페이지 영향 — 먼저 완료 필수 |
| 2 | Dashboard | stat-grid 2×2, grid-12 → 단일 컬럼 |
| 3 | InvestorTrend | 필터 탭 스크롤, 테이블 → 카드 |
| 4 | StockDetail | KPI 2×2, 차트 높이 축소 |
| 5 | NetBuyingList | 가로 스크롤 유지, 날짜 선택기 레이아웃 |
| 6 | 나머지 페이지 | 단일 컬럼 스택, 패딩 조정 |

> NetBuyingList는 테이블 → 카드 전환 대신 가로 스크롤 유지 (타임라인 구조 특성상)
