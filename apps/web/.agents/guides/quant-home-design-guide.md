# Quant Home Design Guide

This is the binding design and planning guide for the Market Pulse quant-model home and related beginner-facing quant surfaces.

If producing or editing an HTML report from this guide, first read and follow:

```text
D:\market-pulse\market-pulse-prod\apps\web\.agents\guides\html-output-style.md
```

HTML reports must use the strict `project-overview.html` document-dashboard contract from that guide. This quant-home guide controls product/page direction; the HTML style guide controls report HTML structure, layout, CSS, and forbidden patterns.

Before planning or editing any of the following, read this file:

- home dashboard
- today stock decision lists
- quant model overview/detail entry surfaces
- report summary surfaces
- validation/evidence entry surfaces
- mobile dashboard and bottom navigation
- navigation labels for quant, market, lotto, tarot, memo, my page, or admin areas

Do not treat this as a loose mood board. Match the approved direction unless the user explicitly changes it.

## 1. Approved References

### Design Report

```text
apps/web/report/quant-home-planning/source.md
apps/web/report/quant-home-planning/latest.html
```

### Approved Mockup

```text
apps/web/report/quant-home-planning/assets/quant-home-mockup.png
```

This mockup is the source of truth for:

- desktop ratio
- left sidebar width feeling
- top header/search placement
- main content vs right rail proportions
- card density
- table density
- stock badge style
- right rail composition
- overall restraint

When making implementation or new mockups, preserve this ratio. Do not reinterpret the page as a different dashboard layout.

## 2. Core Product Intent

The home page must make the product obvious immediately.

Market Pulse is:

> a service where a quant model reviews market data every day and explains today's stock decisions in plain language.

Keep the keyword `퀀트 모델`. Do not replace it with `AI 투자 판단`.

Required main copy:

```text
퀀트 모델이 고른 오늘의 종목
매일 시장 데이터를 계산해 살펴볼 종목, 기다릴 종목, 조심할 종목을 쉽게 정리합니다.
```

The first screen must answer:

- 오늘 어떤 종목을 보면 되는가
- 왜 그렇게 판단했는가
- 어떤 점을 조심해야 하는가
- 어떤 모델이 판단했는가
- 과거 검증 근거는 있는가

## 3. Non-Negotiable Visual Direction

Use the first approved mockup direction.

Required:

- desktop app-like dashboard
- left sidebar
- top header/search
- main dashboard column
- right insight rail
- compact financial density
- plain-language quant explanations
- stock decision table
- circular stock initial badges

Forbidden:

- marketing/landing-only page
- oversized hero section
- split marketing hero
- decorative illustration
- gradient background
- gradient orbs, blobs, bokeh
- colorful SaaS dashboard theme
- card mosaic unrelated to daily decisions
- changing the approved page ratio for small visual changes

The screen should feel like a clean stock decision console, not a generic SaaS landing page.

## 4. Color System

Base UI is monochrome.

Use:

- white backgrounds
- off-white section/card alternates
- light gray borders
- charcoal primary text
- gray secondary text
- subtle blue only as brand/action point color

Use red and blue only for market direction:

- 상승/positive: red
- 하락/negative: blue

Allowed exceptions:

- stock icon badges may use per-stock colors
- tiny info icons may use subtle blue
- primary action/focus/active nav may use subtle blue

Forbidden UI color usage:

- teal as brand accent
- green status dots for normal operation
- purple/orange/beige decorative UI palette
- red for generic `살펴볼 종목`
- blue for generic info panels when it could be confused with 하락
- colorful model state bars unless they encode real market direction

Decision badges should usually be gray/blue outline. Red/blue should not become generic recommendation styling.

## 5. Desktop Layout Requirements

Use this page structure:

```text
Left sidebar | Top header/search
             | Main dashboard                 | Right insight rail
```

Desktop sections:

```text
Top header
- centered search
- top-right 관심/알림/profile controls

Left sidebar
- Market Pulse logo
- primary navigation
- lower data/update mini area
- user/account footer area

Main dashboard
- title/copy/update time
- KPI cards
- today's stock decision table
- quant model explainer

Right rail
- today's one-line summary
- quant model status
- why this judgment
- disclaimer
```

Keep the approved mockup proportions:

- sidebar remains narrow, about the same visual width as the mockup
- right rail remains a secondary column, not equal to the main dashboard
- KPI cards stay compact
- the table is the visual center of the page
- explainer block stays below the table

Do not stretch cards or enlarge the sidebar to fill space.

## 6. Home Page Content Requirements

### Hero

Required elements:

- title: `퀀트 모델이 고른 오늘의 종목`
- subtitle: beginner explanation
- update time / latest refresh

Avoid:

- long paragraph
- marketing claims
- "AI" positioning
- exaggerated performance promise

### KPI Cards

Required cards:

```text
오늘 살펴볼 종목
조심 신호
최근 검증 수익률
최신 리포트
```

Rules:

- use compact cards
- show count/value and one short hint
- use tiny sparklines/icons only if compact
- red/blue only for actual positive/negative market values
- `조심 신호` should not look like an alarm dashboard

### Today's Decision Table

Default desktop columns:

```text
종목 | 모델 판단 | 오늘 행동 | 이유 | 조심할 점
```

Optional:

```text
신호 모델
```

Use `신호 모델` only if it does not harm scanability.

Multiple-model behavior:

- table default: show one compact `여러 모델` badge
- do not list all model names inline
- desktop: hover tooltip shows exact model names
- mobile: tap/expand or bottom sheet shows exact model names

Required row pattern:

```text
[badge] 종목명
        종목코드

모델 판단: 살펴볼 종목 / 기다릴 종목 / 조심할 종목
오늘 행동: 관심 목록 추가 / 지켜보기 / 비중 축소 고려 / 새 매수 보류
이유: 1-2 short bullets
조심할 점: 1-2 short bullets
```

## 7. Stock Initial Badge System

Use circular initial badges by default, not full company logo files.

Badge rules:

- desktop size: about 32px
- mobile size: about 36px
- circular shape
- colored background
- white one-character or short initial mark
- aligned next to stock name and code
- compact, not decorative

Examples:

```text
SK하이닉스      red circle + SK or simple white mark
삼성전자        blue circle + 삼
현대차          dark blue circle + 현
KODEX 반도체    purple circle + K
```

Important:

- badge color does not mean 상승/하락
- badge is only for recognition
- do not use full third-party company logos by default
- do not let badges dominate the table

## 8. Navigation Requirements

### Desktop Sidebar

Target:

```text
홈
오늘의 종목
퀀트 모델
리포트
검증 기록
시장 보기
더보기
```

Desktop profile/my page:

- do not put `마이페이지` in the sidebar
- enter via top-right profile menu

Desktop more/service:

- `더보기` may contain service and utility links
- lotto/tarot should not be core sidebar items unless the user later asks

### Mobile Bottom Navigation

Final target:

```text
시장 | 모델 | 홈 | 서비스 | 마이
```

Rules:

- `홈` is centered.
- `오늘의 종목` is not a bottom-nav item.
- `리포트` is not a bottom-nav item.
- today decisions and reports are reached strongly from home.
- `서비스` contains lotto/tarot.
- `마이` contains profile, saved items, memos, alerts, and admin entry if ADMIN.

Tab responsibilities:

```text
시장: 지수, 종목 검색, 수급, 뉴스
모델: 퀀트 모델 목록, 모델 상태, 모델별 상세
홈: 오늘의 종목, 오늘의 한 줄 요약, 최신 리포트, 검증 요약
서비스: 로또, 타로
마이: 프로필, 관심 종목, 메모, 알림, 저장 리포트, 계정, ADMIN-only 관리자
```

## 9. Language Rules

The first screen must be understandable to beginners.

Preferred beginner terms:

```text
퀀트 모델        keep
오늘의 판단      instead of signal
오늘의 종목      instead of candidate list
검증 기록        instead of backtest on beginner surfaces
조심할 점        instead of risk flag
기다릴 종목      instead of hold/watchlist
살펴볼 종목      instead of buy candidate
비중 축소 고려   instead of trim
모델 점검        instead of diagnostics
목표 비중        instead of portfolio target
```

Allowed in advanced/detail screens only:

- 백테스트
- 리밸런싱
- 포트폴리오 목표 비중
- MDD
- Sharpe
- factor score
- diagnostics

Rule:

- If an expert term appears, put a plain-language explanation nearby.
- Do not use expert terms as first-screen labels unless they are the product keyword `퀀트 모델`.

## 10. Mobile Behavior

Use responsive layout, not a separate `m.` site.

Same route, same API, same data hook. Different presentation components.

Desktop:

- table layout
- persistent sidebar
- right insight rail

Mobile:

- bottom nav: `시장 | 모델 | 홈 | 서비스 | 마이`
- card list instead of wide table
- collapsed explanation panels
- tap to expand `여러 모델`
- today decisions and reports are primary home sections

Mobile home order:

```text
1. compact header/profile/search
2. title and short quant-model explanation
3. compact KPI cards, 2x2
4. today's decision card list
5. latest report card
6. collapsible "퀀트 모델이란?"
7. model state summary
```

Mobile decision card shape:

```text
[badge] 종목명      [모델 판단]
       code
오늘 행동
이유 1-2줄
조심할 점 1줄
여러 모델, tap to expand if applicable
```

## 11. My Page, Services, Admin

### My Page

Desktop entry:

- top-right profile menu

Mobile entry:

- bottom nav `마이`

My page sections:

```text
프로필
관심 종목
내 메모
알림 설정
저장한 리포트
계정 정보
관리자, ADMIN only
```

### Services

`서비스` is separate from the core quant investing flow.

Contains:

```text
로또
타로
```

Rules:

- do not show lotto/tarot as core home sections
- do not mix lotto/tarot into the quant decision table or right rail
- use service cards/list rows under `서비스`

### Admin

Admin is an operating console, not part of beginner-facing quant home.

Rules:

- show admin menu only for `ADMIN`
- desktop admin entry belongs in admin-only navigation or profile menu
- mobile admin entry belongs inside `마이` only for `ADMIN`
- protect `/admin/*` routes with an admin guard
- keep admin actions out of normal user screens
- normal users should not see disabled admin actions

Admin contains:

```text
운영 대시보드
데이터 수집
모델 실행
캐시 관리
사용자/권한
시스템 로그
```

## 12. Frontend Structure

Prefer adding the new home as:

```text
src/pages/QuantHome/
  index.tsx
  components/
    QuantHomeHeader.tsx
    QuantHomeKpiGrid.tsx
    TodayDecisionTable.tsx
    TodayDecisionMobileList.tsx
    QuantInsightRail.tsx
    QuantModelExplainer.tsx
    StockInitialBadge.tsx
  hooks/
    useQuantHomeData.ts
  quantHomeTypes.ts
```

Keep existing market dashboard available separately:

```text
/market
src/pages/Dashboard/
```

Avoid adding more responsibilities to:

```text
src/pages/QuantDashboard/index.tsx
```

That file is already too large and should be split over time.

## 13. Data Expectations

The home should eventually consume a home aggregation response.

Suggested response:

```ts
interface QuantHomeResponse {
  asOf: string;
  summaryText: string;
  kpis: {
    lookCount: number;
    lookDelta: number;
    cautionCount: number;
    cautionDelta: number;
    recentValidationReturnPct: number | null;
    benchmarkReturnPct: number | null;
    latestReportCount: number;
    latestReportTime: string | null;
  };
  decisions: QuantHomeDecision[];
  modelState: QuantHomeModelState;
  latestReports: QuantHomeReportSummary[];
}
```

Decision shape:

```ts
interface QuantHomeDecision {
  assetCode: string;
  assetName: string;
  market: string;
  badgeText: string;
  badgeTone: string;
  modelNames: string[];
  modelLabel: "상승장 모델" | "횡보장 모델" | "하락장 모델" | "여러 모델";
  decisionLabel: "살펴볼 종목" | "기다릴 종목" | "조심할 종목";
  actionText: string;
  reasonBullets: string[];
  cautionBullets: string[];
}
```

Existing APIs may be composed first before a dedicated endpoint exists.

## 14. Loading, Empty, Error States

Required states:

```text
Loading:
  skeleton cards and rows

No decisions:
  "오늘 표시할 종목이 없습니다. 최신 리포트를 확인해 주세요."

Data delayed:
  right-rail notice and as-of time

API error:
  compact error card with retry

Unauthenticated:
  public read if policy allows, otherwise login CTA

Admin missing permission:
  hide admin entry or show 403 route
```

## 15. CSS And Component Rules

Use existing global UI tokens and classes first:

- `.card`
- `.t`
- `.btn`
- `.tag`
- `.tabs`
- `.seg-tabs`
- `.stat-*`

Only add new CSS when existing tokens cannot express the design cleanly.

When adding CSS:

- use existing CSS variables from `src/index.css`
- keep radius near existing values
- keep font sizes dense
- no viewport-based font scaling
- no one-note colorful palette
- no nested cards
- no decorative backgrounds

## 16. Implementation Phases

Recommended phases:

```text
Phase 1: Static Home Shell
- Add src/pages/QuantHome/
- Use static sample data
- Build desktop table and mobile cards
- Route / to QuantHome
- Move existing Dashboard to /market

Phase 2: Navigation And Permissions
- Update desktop sidebar
- Update mobile bottom nav
- Add profile/my entry
- Add admin visibility/route guard

Phase 3: Data Wiring
- Compose existing quant/report APIs
- Add skeleton/empty/error states
- Add several-model hover/tap expansion

Phase 4: Route Cleanup
- Decide /quant role
- Connect /quant/backtest or /quant/evidence
- Split QuantDashboard/index.tsx gradually
```

## 17. Acceptance Criteria

Home is acceptable only when:

- a first-time user can understand what the service does within 5 seconds
- the phrase `퀀트 모델` is visible on first screen
- the page explains today's stocks with plain-language decisions
- desktop ratio matches the approved mockup
- mobile bottom nav is exactly `시장 | 모델 | 홈 | 서비스 | 마이`
- mobile does not use a wide table
- today decisions and reports are reachable from home
- lotto/tarot are grouped under `서비스`
- my page is profile/mobile `마이`, not desktop sidebar
- admin is hidden from normal users
- red/blue are reserved for market direction
- stock rows use circular initial badges
- `여러 모델` does not list all model names inline by default

## 18. Explicit Anti-Patterns

Do not:

- make a landing page
- make an unrelated dashboard layout
- change the approved mockup ratio casually
- replace `퀀트 모델` with `AI`
- use teal/green/purple/orange/beige as chrome accents
- use red to mean "recommended"
- use wide desktop tables on mobile
- show lotto/tarot in the quant home
- show admin actions to normal users
- keep adding to `QuantDashboard/index.tsx`
- create HTML or final user reports in `.agents`
