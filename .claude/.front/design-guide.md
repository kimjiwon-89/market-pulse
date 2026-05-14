# Market Pulse 디자인 가이드

> 출처: Claude Design 프로토타입 (`prototype.html`)
> 프론트 작업 시 반드시 이 파일을 먼저 확인하고 시작할 것.

---

## 디자인 원칙

- **언어**: 한국어 전용
- **느낌**: 기관 투자자용 — 화이트 배경, 절제된 그레이, 보수적인 금융 UI
- **밀도**: 균형 잡힌 위계 구조, 적절한 여백
- **한국 관례**: 빨간색 = 상승, 파란색 = 하락 (서양과 반대)

---

## 색상 시스템 (CSS 변수)

### 라이트 모드 (기본)

```css
/* 배경 */
--bg: #ffffff
--bg-alt: #fafaf9        /* 테이블 헤더, 칩 배경 */
--bg-panel: #ffffff      /* 카드 배경 */
--bg-hover: #f5f5f4      /* 호버 상태 */
--bg-input: #ffffff
--bg-skeleton: #f1f1ef   /* 스켈레톤 로딩 */

/* 테두리 */
--border: #e7e5e4
--border-strong: #d6d3d1
--divider: #efeeec       /* 행 구분선 (border보다 연함) */

/* 텍스트 */
--text: #18181b          /* 기본 텍스트 */
--text-2: #44403c        /* 보조 텍스트 */
--text-3: #78716c        /* 레이블, 메타 정보 */
--text-4: #a8a29e        /* 플레이스홀더, 구분자 */

/* 액센트 */
--accent: #18181b        /* 기본: 거의 검정 */
--accent-fg: #ffffff
--accent-soft: #f4f4f5

/* 주가 방향 (한국 관례) */
--up: #d62828            /* 상승 = 빨강 */
--up-soft: #fdecec
--down: #1e5edb          /* 하락 = 파랑 */
--down-soft: #e8eefc
--flat: #57534e          /* 보합 */
```

### 다크 모드 (`[data-theme="dark"]`)

```css
--bg: #0c0c0d
--bg-alt: #131316
--bg-panel: #16161a
--bg-hover: #1d1d22
--border: #26262c
--border-strong: #3a3a42
--divider: #232329
--text: #f5f5f4
--text-2: #d6d3d1
--text-3: #a8a29e
--text-4: #78716c
--up: #ff5b5b            /* 다크에서 상승 */
--down: #5b8bff          /* 다크에서 하락 */
```

### 액센트 컬러 옵션 (4종)

```
#18181b  거의 검정 (기본)
#1e5edb  파랑
#0f766e  틸
#a16207  앰버
```

---

## 타이포그래피

```css
--font-sans: "Pretendard Variable", Pretendard, "Noto Sans KR", -apple-system, sans-serif
--font-mono: "IBM Plex Mono", "SF Mono", ui-monospace, monospace
--font-serif: "Noto Serif KR", "Times New Roman", serif  /* 현재 미사용 */
```

- **기본 폰트**: Pretendard (모든 한글 UI)
- **숫자 전용**: IBM Plex Mono — 주가, 대금, 수량 등 모든 수치에 사용
- **base size**: 14px, line-height: 1.5
- `font-feature-settings: "tnum" on` — 테이블 숫자 정렬 (monospace 수치 폭 통일)

### 숫자 크기 토큰

| 변수 | 기본값 | 컴팩트 |
|------|--------|--------|
| `--num-hero` | 34px | 28px |
| `--num-lg` | 28px | 22px |
| `--num-md` | 22px | 18px |
| `--num-sm` | 16px | 14px |

---

## 레이아웃

### 앱 전체 구조

```
┌─────────────────────────────────────────────┐
│  Header (60px, sticky, z-index:30)          │
│  brand(224px) │ search │ market-status       │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  main.page                       │
│ (224px)  │  padding: var(--pad-pg) = 32px   │
│ sticky   │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### 레이아웃 토큰

```css
--sidebar-w: 224px
--header-h: 60px
--pad-pg: 32px        /* 페이지 패딩 (컴팩트: 24px) */
--pad-card: 24px      /* 카드 내부 패딩 (컴팩트: 18px) */
--gap-card: 20px      /* 카드 간격 (컴팩트: 14px) */
--row-h: 44px         /* 테이블 행 높이 (컴팩트: 36px) */
--radius: 8px
--radius-sm: 6px
--radius-lg: 12px     /* 카드에 사용 */
```

### 그리드 헬퍼 클래스

```css
.grid-2   /* 1fr 1fr */
.grid-3   /* 1fr 1fr 1fr */
.grid-4   /* 1fr 1fr 1fr 1fr */
.grid-12  /* 8fr 4fr  (메인:사이드 비율) */
.stack    /* flex-column, gap: --gap-card */
.stat-grid /* grid 4열 */
```

---

## 컴포넌트 패턴

### 카드 (`.card`)

```tsx
<div className="card">
  <div className="card-head">
    <div className="card-title">제목</div>
    <div className="card-sub">부제목</div>
  </div>
  {/* 내용 */}
</div>
```

- `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`, `padding: var(--pad-card)`
- `.card-head`: flex, space-between, `margin-bottom: 16px`
- `.card-title`: 14px, font-weight 600
- `.card-link`: 텍스트 링크 스타일 (border-bottom hover)

### 통계 셀 (`.stat-cell`)

```tsx
<div className="stat-cell">
  <div className="stat-label">레이블</div>
  <div className="stat-value up">+4,820</div>  {/* mono font */}
  <div className="stat-delta up">▲ 전일 대비 +1,200억</div>
</div>
```

- 상승: `className="up"`, 하락: `className="down"`, 보합: `className="flat"`
- `.stat-value`: IBM Plex Mono, `var(--num-lg)`
- `.stat-delta`: IBM Plex Mono, 12px

### 테이블 (`.t`)

```tsx
<table className="t">
  <thead>
    <tr>
      <th>종목명</th>
      <th className="num">순매수대금</th>  {/* 우측 정렬 + mono */}
      <th className="num sortable">수량</th>
    </tr>
  </thead>
  <tbody>
    <tr className="clickable">
      <td className="ticker">삼성전자</td>
      <td className={`num ${dirCls(val)}`}>{fmtNum(val, { sign: true })}</td>
    </tr>
  </tbody>
</table>
```

- `thead th`: 11.5px, uppercase, `var(--text-3)`, `var(--bg-alt)` 배경
- `tbody td`: hover 시 `var(--bg-hover)`
- `.num`: text-align right + IBM Plex Mono
- `.ticker`: font-weight 600
- `.pct`: IBM Plex Mono

### 필터 칩 (`.chip`)

```tsx
<div className="chips">
  <button className="chip" aria-pressed={active} onClick={...}>코스피</button>
</div>
```

- `aria-pressed="true"` → `background: var(--accent)`, `color: var(--accent-fg)`
- 높이 30px, `border-radius: 999px`, 12.5px

### 세그먼트 탭 (`.seg-tabs`) — 필터 토글

```tsx
<div className="seg-tabs" role="tablist">
  <button role="tab" aria-selected={v === "foreign"} onClick={() => setV("foreign")}>외국인</button>
  <button role="tab" aria-selected={v === "inst"} onClick={() => setV("inst")}>기관</button>
</div>
```

- 배경: `var(--bg-alt)`, 테두리: `var(--border)`, `border-radius: 8px`, padding: 2px
- 선택된 버튼: `background: var(--bg-panel)`, font-weight 600, box-shadow

### 탭 (`.tabs` / `.tab`) — 페이지 내 탭

```tsx
<div className="tabs">
  <button className="tab" aria-selected={tab === "a"}>탭 A</button>
</div>
```

- border-bottom: 2px solid (선택 시 `var(--accent)`)

### 버튼 (`.btn`)

```tsx
<button className="btn primary">저장</button>
<button className="btn">취소</button>
<button className="btn ghost">← 이전</button>
<button className="btn sm">작은 버튼</button>
```

### 태그 (`.tag`)

```tsx
<span className="tag">KRX 기준</span>
<span className="tag up">상승</span>
<span className="tag down">하락</span>
```

### 스파크라인

```tsx
<Sparkline data={hist} height={28} color="var(--up)" fill={true} showDot={false} />
```

### 에어리어 차트

```tsx
<AreaChart data={periodData} color="var(--up)" />
```

### 플로우 차트 (외국인/기관/개인 멀티라인)

```tsx
<FlowChart data={FLOW_SERIES} />
```

---

## 포매터 함수

```ts
fmtNum(n, opts)     // 숫자 포맷 (sign: true → +/−, compact: 억 단위)
fmtPct(p)           // 퍼센트 (+0.45%, −0.37%)
dirCls(n)           // "up" | "down" | "flat"  → className에 사용
triangle(n)         // "▲" | "▼" | "▬"
```

---

## 페이지별 UI 스펙

### 1. 시장 대시보드 (`/`)

```
grid-12 (8:4)
├── 왼쪽 카드
│   ├── 지수 3개 (KOSPI / KOSDAQ / KOSPI200) — grid-3, stat-cell + 스파크라인
│   └── 업종 테이블 (6개) — 업종명 / 현재가 / 등락률 / 거래대금 / 5일추이
└── 오른쪽 카드
    └── 최신 뉴스 5개 (news-mini)

grid-12 (8:4)
├── FlowDirCard (외국인/기관 × 순매수/순매도 × 전체/코스피/코스닥)
│   ├── seg-tabs 3종 (주체 / 방향 / 시장)
│   ├── stat-cell 3개 (오늘합계 / 오늘1위 / 어제1위)
│   └── rank-flow: 어제(좌) → 오늘(우) 순위 5개씩
└── 투자자 동향 카드
    ├── stat-cell 3개 (기관 / 외국인 / 개인)
    └── bi-bar 5개 (외국인 / 기관 / 개인 / 프로그램 / 연기금)
```

### 2. 업종 상세 (`/index/:id`)

```
업종 선택 칩 (chip 8개)
stat-grid 4개 KPI (업종지수 / 거래량 / 시가총액 / 52주최고)
카드: 에어리어 차트 + 1M/3M/1Y 칩
grid-2
├── 주요지표 테이블 (P/E / P/B / 배당수익률 / ROE 등)
└── 차트 해설 + 변동성 태그
```

### 3. 투자자 매매동향 (`/net-buy` 또는 `/investor`)

```
필터 카드
├── seg-tabs: 코스피 / 코스닥
├── seg-tabs: 외국인 / 기관
├── seg-tabs: 순매수 / 순매도
└── 날짜 선택기 (← 날짜 input → | 오늘 버튼) + 요약 정보

순위 테이블 카드 (Top 20)
  순위 / 종목명(+코드) / 현재가 / 등락률 / 순매수대금(억) / 순매수량(주)

메모 카드
  textarea + 저장/삭제 버튼
  key: localStorage `mp:memo:{date}:{market}`
  날짜·시장 변경 시 자동 로드
```

### 4. 메모 모아보기 (`/memo`)

```
seg-tabs: 코스피 / 코스닥
memo-list (날짜 내림차순)
  memo-item: date(mono) + market(tag) + 저장시각 + 본문 2줄 미리보기
  클릭 → sessionStorage에 date/market 저장 후 /investor로 이동
```

### 5. 뉴스 (`/news`)

```
필터 카드: 검색 input + 날짜 select + 정렬 select
뉴스 목록 카드 (news-list)
  news-item: title / summary / date · source · time
```

### 6. 투자자 동향 (`/trends`)

```
stat-grid 4개 (외국인/기관/개인/프로그램 순매수)
FlowChart (09:00~15:30, 5분봉, 외국인/기관/개인 3선)
투자자 유형별 테이블 (매수/매도/순매수/전일비/비중바)
```

---

## 로딩 / 에러 상태

모든 페이지는 loading / error / live 3가지 상태를 가진다.

```tsx
// Loading
<div className="sk" />           /* 텍스트 스켈레톤 */
<div className="sk short" />     /* 짧은 스켈레톤 */
<div className="sk tall" />      /* 높은 스켈레톤 */
<Spinner />                      /* SVG 스피너 */

// Error
<ErrorBlock
  title="데이터를 불러올 수 없습니다"
  msg="일시적 오류..."
  onRetry={...}
  onBack={...}
/>
```

---

## Tweaks 패널 (사용자 설정)

| 설정 | 옵션 |
|------|------|
| 테마 | light / dark |
| 액센트 컬러 | #18181b / #1e5edb / #0f766e / #a16207 |
| 밀도 | comfortable / compact |
| 사이드바 | icon+text / text-only |

`data-theme`, `data-density`, `data-sidebar` → `<html>` 루트에 적용

---

## 사이드바 네비게이션

| id | 레이블 | 아이콘 경로 |
|----|--------|-------------|
| dashboard | 대시보드 | `M3 12 12 4l9 8M5 11v9h5v-6h4v6h5v-9` |
| sector | 업종 상세 | `M3 21h18M5 21V8l7-4 7 4v13M9 21v-7h6v7` |
| flow | 순매수도 | `M3 17l6-6 4 4 8-8M14 7h7v7` |
| memo | 메모 | `M9 3h6l5 5v11a2 2 0 0 1-2 2H6...` |
| news | 뉴스 | `M4 5h12a2 2 0 0 1 2 2v10...` |
| trends | 동향 | `M3 3v18h18M7 14l4-4 4 3 5-7` |

---

## 데이터 구조 (mock → API 교체 대상)

```ts
INDICES[]   // { code, name, value, change, pct, hist[] }
SECTORS[]   // { code, name, price, pct, vol, chg, cap, weight, hist[] }
STOCKS[]    // { code, name, price, pct, foreignNet, foreignNetPrev, instNet, instNetPrev, foreignVol, foreignOwn, sector, market, vol, netQty, instQty }
INVESTORS[] // { name, buy, sell, net, prev }
NEWS[]      // { id, title, summary, date, source, time }
FLOW_SERIES // { t, foreign, inst, retail }[]
```

---

## 구현 시 주의사항

1. **수치는 반드시 IBM Plex Mono** — `.mono` 클래스 또는 `font-family: var(--font-mono)`
2. **상승/하락 색상** — `dirCls(n)` → `"up"` | `"down"` | `"flat"` className으로 처리
3. **min-width: 1180px** — 이 앱은 데스크톱 전용
4. **카드 패딩** — `var(--pad-card)` 사용, 하드코딩 금지
5. **`aria-pressed`** — 칩 토글에 사용 (접근성)
6. **`aria-selected`** — seg-tabs, tab에 사용
7. **`aria-current="page"`** — 사이드바 활성 아이템
8. **sessionStorage** — 페이지 간 상태 전달 (`mp:flow:initDate`, `mp:flow:initMarket`)
9. **localStorage** — 메모 저장 (`mp:memo:{date}:{market}`)
10. **`white-space: nowrap`** — 칩, 헤더 우측 요소, 카드 제목에 적용
