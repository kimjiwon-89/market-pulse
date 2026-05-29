# Quant Home Design Guide

This is the binding design contract for the Market Pulse web quant home and related beginner-facing quant screens.

Before planning or editing any of these surfaces, read this file:

- `apps/web/src/pages/QuantHome.tsx`
- `apps/web/src/pages/QuantToday/index.tsx`
- `apps/web/src/pages/QuantModels/index.tsx`
- `apps/web/src/pages/Reports/index.tsx`
- `apps/web/src/layout/Header.tsx`
- `apps/web/src/layout/Nav.tsx`
- `apps/web/src/layout/BottomNav.tsx`
- `apps/web/src/features/quant/*`

Do not treat this guide as a mood board. It is a strict implementation contract. The current `QuantHome` visual result is the approved visual baseline, but its legacy global-CSS/inline-style implementation is not the approved architecture.

## 1. Canonical References

Legacy implementation to migrate away from:

```text
apps/web/src/pages/QuantHome.tsx
apps/web/src/index.css
apps/web/src/layout/Header.tsx
apps/web/src/layout/Nav.tsx
apps/web/src/features/quant/quantMockData.ts
apps/web/src/features/mock/marketMockData.ts
```

Required target implementation:

```text
apps/web/src/app/theme.ts
apps/web/src/app/GlobalStyle.ts
apps/web/src/app/providers.tsx
apps/web/src/layout/Header.tsx
apps/web/src/layout/Sidebar.tsx
apps/web/src/layout/BottomNav.tsx
apps/web/src/features/quant/api.ts
apps/web/src/features/quant/store.ts
apps/web/src/features/quant/types.ts
apps/web/src/features/quant/mock.ts
apps/web/src/features/quant/home/QuantHomePage.tsx
apps/web/src/features/quant/home/QuantHeroSection.tsx
apps/web/src/features/quant/home/QuantMetricRail.tsx
apps/web/src/features/quant/home/QuantMarketStatusRail.tsx
apps/web/src/features/quant/home/QuantDecisionSection.tsx
apps/web/src/features/quant/home/QuantDecisionCard.tsx
apps/web/src/features/quant/home/styles.ts
apps/web/src/pages/QuantHome.tsx
```

User-facing guide:

```text
apps/web/report/quant-home-design-guide/source.md
apps/web/report/quant-home-design-guide/latest.html
```

Historical mockup asset may remain for context, but the implemented screen now overrides older mockup details:

```text
apps/web/report/quant-home-planning/assets/quant-home-mockup.png
```

## 2. Product Definition

Market Pulse home must communicate this within 5 seconds:

> 퀀트 모델이 매일 시장 데이터를 계산해 오늘 볼 종목과 시장 상태를 쉽게 정리하는 서비스.

Keep the keyword `퀀트 모델`.

Forbidden positioning:

- `AI 투자 판단`
- automatic trading
- buy/sell execution tool
- guaranteed return service

Main copy must stay:

```text
퀀트 모델이 고른 오늘의 종목
매일 시장 데이터를 계산해 살펴볼 종목, 기다릴 종목, 조심할 종목을 쉽게 정리합니다.
```

## 3. Desktop Shell

Required desktop structure:

```text
Header
Left sidebar | Main content column | Right utility rail
```

Current layout tokens:

```css
--sidebar-w: 224px;
--header-h: 60px;
--pad-pg: 32px;
--gap-card: 20px;
--radius: 8px;
```

Current home shell styled-component intent:

```text
HomeShell:
  display: grid
  columns: minmax(0, 1fr) 420px
  gap: 20px
```

Rules:

- Keep the right rail near `420px` on desktop.
- Do not shrink the right rail back to `320px`.
- Do not restore an old `today summary / model status / why judgment` rail.
- Do not create a full-width marketing hero.
- Main content remains the visual center.
- Right rail is utility content, not model explanation content.

## 4. Header Contract

Header must contain:

```text
Left: Market Pulse logo
Center: search input
Right: 알림 + profile circle
```

Current rules:

- Search is centered and compact.
- Do not show `KRX 기준`.
- Do not show `종가`.
- Do not show a top-level `관심` button.
- Do not show `admin` text in the header.
- Do not show a visible `로그아웃` button in the header.
- Profile is a circular button.
- Profile menu contains:
  - `마이페이지`
  - `관심 폴더`
  - `로그아웃`
- `관심 폴더` belongs in the profile menu, not the top header.
- Notification can show a compact badge, but do not use odd temporary symbols or decorative icons.

Allowed header action text:

```text
알림
```

Forbidden header action text:

```text
KRX 기준
종가
관심
admin
```

## 5. Sidebar Contract

Desktop sidebar order:

```text
홈
오늘의 종목
모델 목록
리포트
시장 보기
더보기
관리자, ADMIN only
```

Rules:

- `마이페이지` does not appear in desktop sidebar.
- Profile/my page is entered from top-right profile menu.
- `관리자` appears only for ADMIN users.
- Sidebar bottom shows data 기준 time.
- Do not put `관심 폴더` in sidebar.
- Do not put lottery/tarot as primary sidebar items; they belong under service/more.

## 6. Home Top Panel

The top card is one soft-gray panel with two equal inner areas:

```text
Left: 오늘의 종목 summary
Right: 오늘의 시장 현황
```

Required container:

```tsx
<section className="card soft-section">
  <div className="quant-hero-split">
    <div className="quant-hero-panel">...</div>
    <div className="quant-hero-panel market">...</div>
  </div>
</section>
```

Current visual rules:

- Outer card uses `.soft-section`.
- `.soft-section` background is `#f1f3f6`.
- `.soft-section` border is `#d9dde5`.
- Inner metric cards stay white.
- The two panels are separated by a vertical divider.
- Left and right cards must align horizontally at the bottom.
- Use fixed metric card heights so text wrapping does not break alignment.

Current styled-component intent:

```text
HeroSplit:
  columns: minmax(0, 1fr) minmax(0, 1fr)

MetricCard and MarketStatusCard:
  desktop height: 112px
  mobile rail card width: 118px
```

Do not:

- put market status as a thin strip across the top
- put update time inside the right top panel
- mix old one-line summary cards into this area
- enlarge KPI cards into hero cards

## 7. Top Panel Content

### Left: Today's Stocks

Title:

```text
퀀트 모델이 고른 오늘의 종목
```

Title style:

- `font-size: 19px`
- `font-weight: 600`
- no hero-scale typography

Subtitle:

```text
매일 시장 데이터를 계산해 살펴볼 종목, 기다릴 종목, 조심할 종목을 쉽게 정리합니다.
```

Metric cards:

```text
오늘 살펴볼 종목
조심 신호
모델 검증 수익률
오늘 리포트
```

Rules:

- Four cards in one row on desktop.
- Use compact cards, not large KPI tiles.
- Height must be enough to avoid text clipping.
- Red and blue are only for market/value direction.
- `WARNING` uses orange, not red.

### Right: Today's Market Status

Title:

```text
오늘의 시장 현황
```

Summary copy:

```text
지수는 약세지만 급락 신호는 제한적이고, 반도체 쪽 수급은 개선 흐름입니다.
```

Market cards:

```text
지수     약세 관찰
수급     반도체 개선
체크     환율·금리
분위기   선별 장세
```

Rules:

- Four cards in one row on desktop.
- Match the left metric card height.
- Do not use vague copy like `숨 고르기 구간`.
- Market status must read like a summary for users, not internal model metadata.

## 8. Today Decision Table

Desktop table columns:

```text
종목 | 신호 모델 | 이유 | 조심할 점 | 관심 별
```

Forbidden columns:

```text
오늘 행동
모델 판단
```

Rules:

- Do not imply auto-investing or trade execution.
- Decision code appears beside the stock name:
  - `BUY`
  - `SELL`
  - `WARNING`
  - `SIDE`
- `WARNING` color is orange.
- `BUY` follows positive/up red.
- `SELL` follows down blue.
- `SIDE` is gray.
- Stock name and code use circular initial badge.
- Star favorite control is at the far right.
- Star has no circle border or pill background.
- If logged out, personal save actions redirect to `/login`.
- If logged in, star opens folder selection.

Favorite folder popover:

```text
관심 폴더 선택
메인 관심
반도체
관찰
리스크 체크
+ 폴더 추가
```

Rules:

- Folder add is allowed in the popover.
- Folder edit/delete belongs in `마이페이지 > 관심 폴더`.
- Do not put folder edit/delete in the home table.

## 9. Right Utility Rail

Right rail current order:

```text
뉴스
광고 영역
관심 폴더
```

Width:

```css
420px
```

### 뉴스

Rules:

- News is the first card.
- Show title only.
- Use card-internal scroll, not page expansion.
- News list uses `.utility-news-scroll`.
- Do not show source/date in the home rail news list.
- `더보기` goes to `/news`.

### 광고 영역

Rules:

- Replaces the old `Today Report` card.
- This is a future ad slot.
- Use `.ad-slot-card`.
- Show `AD` label and placeholder copy.
- Do not show report list here.
- Do not call this `Today Report`.

### 관심 폴더

Rules:

- Card uses stronger gray background through `.soft-section` if applied.
- Folder rows remain white inside the gray card.
- Folder list uses internal scroll:

```css
.utility-folder-scroll {
  max-height: 160px;
  overflow-y: auto;
}
```

- `관리` goes to `/my`.
- Folder edit/delete happens in My Page.

Forbidden right rail content:

- today's one-line summary
- quant model status bars
- why-this-judgment explanation
- disclaimer card
- Today Report list
- quick links

## 10. Quant Model Explainer

Position:

- below today decision table
- in the main column

Content:

```text
퀀트 모델이란?
수많은 시장 데이터를 수학과 통계로 분석해 종목의 매력도를 점수로 계산하는 도구입니다.
감정이 아닌 데이터로 판단해 더 일관된 투자를 도와줍니다.
```

Rules:

- Keep it compact.
- Do not turn it into a marketing section.
- Use a plain card, not nested cards.
- `더 알아보기` goes to `/quant`.

## 11. Color Contract

Base UI:

```text
white, off-white, light gray, charcoal, secondary gray
```

Accent:

```css
--accent: #2f77df;
--accent-soft: #eef5ff;
--accent-border: #cfe0ff;
```

Soft section:

```css
background: #f1f3f6;
border-color: #d9dde5;
```

Market direction:

```css
--up: #d62828;
--down: #1e5edb;
--warning: #f97316;
```

Rules:

- Red means 상승/positive.
- Blue means 하락/negative.
- Orange means warning/caution.
- Blue accent is for brand/nav/action/info only.
- Do not use green normal-status indicators.
- Do not introduce purple/teal/beige/gradient decorative palettes.

## 12. Icons And Badges

Use:

- circular stock initial badges
- simple star character for favorite in table
- compact info dot `i`
- profile circular avatar
- text-first header actions

Do not use:

- full company logos by default
- odd temporary unicode icons
- decorative icon sets that do not match the current style
- circular background around the favorite star
- a top-level favorite icon in the header

Stock badge examples:

```text
SK하이닉스   red circle + SK
삼성전자     blue circle + 삼
현대차       dark blue circle + 현
KODEX 반도체 purple circle + K
```

Badge color is identity only. It must not encode price direction.

## 13. Mobile Contract

Use responsive layout, not a separate `m.` site.

Bottom nav:

```text
시장 | 모델 | 홈 | 서비스 | 마이
```

Rules:

- `홈` is centered.
- `오늘의 종목` is not a bottom-nav item.
- `리포트` is not a bottom-nav item.
- `마이` contains profile, saved items, favorite folders, memos, alerts, account, and admin entry if ADMIN.
- Mobile home uses cards, not wide tables.
- Top two-panel content stacks vertically.
- Right rail content becomes stacked sections below main content or is reordered by product need.

## 14. My Page And Favorite Folder Rules

My Page entry:

- desktop: top-right profile menu
- mobile: bottom nav `마이`

Profile menu must include:

```text
마이페이지
관심 폴더
로그아웃
```

Favorite folder management:

- add from star popover is allowed
- view/edit/delete from My Page
- default folder `메인 관심` should not be deleted
- deleting a non-empty folder requires move-or-delete decision

## 15. Services And Admin

Services:

- `서비스` contains lotto/tarot.
- Do not mix lotto/tarot into quant home, right rail, or decision table.

Admin:

- admin is an operating console.
- show admin menu only for ADMIN.
- validation/backtest/evidence is admin-only.
- normal users must not see `검증 기록`.
- do not restore removed public validation/backtest routes.

## 16. Mock Data And Backend Planning

Current implementation is mock-data first.

Mock sources:

```text
src/features/quant/quantMockData.ts
src/features/mock/marketMockData.ts
```

Mock data must expose future backend needs:

- home KPI counts
- market status summary
- stock decisions
- model names per decision
- reason bullets
- caution bullets
- reports
- news
- favorite folder counts
- ad slot placeholder

Personal/FK actions are login-gated:

- favorite save
- memo write/edit
- alert settings
- saved reports
- account data
- admin actions

## 17. CSS Rules

All UI styling for quant home and related beginner-facing quant screens must use `styled-components`.

Required dependency:

```text
styled-components
```

If `styled-components` is not installed, install it before new UI work:

```text
npm install styled-components
```

Allowed global styling:

- Use `createGlobalStyle` from `styled-components` for reset/base only.
- Global reset may include only:
  - `box-sizing: border-box`
  - `html`, `body`, `#root` margin/padding reset
  - base `min-height`
  - base body font/background/text color from theme
- Do not use global CSS for page layout, cards, buttons, rails, tables, navigation, or quant-specific selectors.

Forbidden styling:

- Do not add screen/component styles to `src/index.css`.
- Do not create new `.css`, `.scss`, `.sass`, `.less`, or CSS module files.
- Do not add new Tailwind utility styling for product UI.
- Do not add new inline `style={{ ... }}` for layout/visual styling.
- Do not use class selectors such as `.quant-*`, `.card`, `.btn`, `.stack`, `.market-status-item`, or `.favorite-button` for new or refactored UI.
- Do not patch layout by `nth-child` selectors or DOM-order selectors.
- Do not keep styles in route files if the UI can be a named styled component.

Required theme/token source:

```text
src/app/theme.ts
src/app/GlobalStyle.ts
src/app/providers.tsx
```

Required token groups:

- color: `bg`, `panel`, `softPanel`, `text`, `textMuted`, `border`, `divider`, `accent`, `up`, `down`, `warning`
- spacing: `page`, `card`, `sectionGap`, `rowGap`
- radius: `card`, `control`, `pill`, `circle`
- layout: `headerHeight`, `sidebarWidth`, `rightRailWidth`, `bottomNavHeight`
- breakpoint: `mobile`, `tablet`, `desktop`
- font: `sans`, `mono`

Implementation rules:

- Every visual primitive must be a styled component with a semantic name.
- Keep styled component names explicit: `HomeShell`, `SoftTopPanel`, `MetricRail`, `MetricCard`, `DecisionCard`, `FavoriteButton`.
- Co-locate feature styles in that feature folder, usually `styles.ts`.
- Shared styled UI primitives belong under `src/components/ui/*`.
- Layout styled components belong under `src/layout/*`.
- Responsive behavior belongs inside styled components with theme breakpoints.
- Do not create `mobile/` and `desktop/` folder splits. If markup differs, use sibling components in the same feature folder, e.g. `DesktopDecisionTable.tsx` and `MobileDecisionList.tsx`.
- Hide visual scrollbars through styled-components on scroll containers while preserving scrolling behavior.
- Use `overflow-x: auto` for mobile horizontal rails only when cards cannot fit meaningfully in one viewport.
- Use `scrollbar-width: none` and `::-webkit-scrollbar { display: none; }` inside the scroll container styled component.

Required `src` structure for new/refactored work:

```text
src/
  app/
    router.tsx
    providers.tsx
    theme.ts
    GlobalStyle.ts
  components/
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      IconButton.tsx
  layout/
    AppLayout.tsx
    Header.tsx
    Sidebar.tsx
    BottomNav.tsx
  hooks/
    useBreakpoint.ts
  features/
    quant/
      api.ts
      store.ts
      types.ts
      mock.ts
      home/
        QuantHomePage.tsx
        QuantHeroSection.tsx
        QuantMetricRail.tsx
        QuantMetricCard.tsx
        QuantMarketStatusRail.tsx
        QuantDecisionSection.tsx
        QuantDecisionCard.tsx
        QuantUtilityRail.tsx
        styles.ts
      today/
      models/
    market/
      api.ts
      store.ts
      types.ts
    auth/
      api.ts
      store.ts
      types.ts
    reports/
      api.ts
      store.ts
      types.ts
    services/
      api.ts
      store.ts
      types.ts
  pages/
    QuantHome.tsx
    QuantToday.tsx
    QuantModels.tsx
  store/
    index.ts
    ui.store.ts
```

Folder ownership rules:

- `pages/*` files are route wrappers only and must not own business UI or styling.
- `features/<domain>/api.ts` owns that feature's endpoint functions.
- `features/<domain>/store.ts` owns that feature's state/slice.
- `features/<domain>/types.ts` owns that feature's types.
- `src/api/client.ts` may exist only for shared HTTP client setup.
- `src/store/index.ts` may exist only to compose feature stores.
- `src/components/ui/*` may contain only reusable UI primitives used across multiple features.
- `src/layout/*` owns app shell, header, sidebar, and bottom navigation.

Refactor requirement for quant home:

- Keep `apps/web/src/pages/QuantHome.tsx` as a route wrapper around `src/features/quant/home/QuantHomePage.tsx`.
- Break extractable UI into named components under `src/features/quant/home/`.
- Remove quant-home-specific styling from `src/index.css`.
- Replace inline styles with styled-components.
- Keep existing behavior and visual intent while migrating structure.

Visual rules still apply:

- No nested cards.
- No marketing hero.
- No gradient backgrounds.
- No decorative blobs/orbs.
- No viewport-based font scaling.
- Keep border radius around `8px`.
- Keep dashboard dense, not spacious SaaS marketing.

## 18. Acceptance Criteria

Home is acceptable only when:

- first-time user understands the service within 5 seconds
- `퀀트 모델` appears on first screen
- top panel is split into today's stocks and today's market status
- top panel uses gray soft background
- right rail order is `뉴스`, `광고 영역`, `관심 폴더`
- right rail width is around `420px`
- news scrolls inside the news card
- favorite folders scroll inside the folder card
- decision table has no `오늘 행동` column
- favorite star is far right and has no circular border
- profile menu contains favorite folder entry
- header has no `KRX 기준`, `종가`, top-level `관심`, `admin`, or visible `로그아웃`
- warning color is orange
- red/blue are reserved for market direction
- stock rows use circular initial badges
- mobile bottom nav is `시장 | 모델 | 홈 | 서비스 | 마이`
- normal users do not see admin validation/backtest navigation

## 19. Explicit Anti-Patterns

Never reintroduce:

- old right rail: one-line summary / model status / why judgment / disclaimer
- Today Report card in right rail
- quick links card in right rail
- `오늘 행동` table column
- top header `관심`
- top header `KRX 기준`
- top header `종가`
- visible top header logout button
- odd unicode notification icons
- full company logos by default
- public validation/backtest navigation
- marketing landing page
- old `QuantDashboard` / `QuantBacktest` public surfaces
