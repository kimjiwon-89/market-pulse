# Market Pulse Web Quant Design Guide

This is the binding design contract for the Market Pulse web quant home, quant model detail pages, reports, today-stock pages, and related beginner-facing quant screens.

Before planning or editing any of these surfaces, read this file:

- `apps/web/src/pages/QuantHome.tsx`
- `apps/web/src/pages/QuantToday/index.tsx`
- `apps/web/src/pages/QuantModels/index.tsx`
- `apps/web/src/pages/Reports/index.tsx`
- `apps/web/src/layout/Header.tsx`
- `apps/web/src/layout/Nav.tsx`
- `apps/web/src/layout/BottomNav.tsx`
- `apps/web/src/features/quant/*`

Do not treat this guide as a mood board. It is a strict implementation contract. The current `QuantHome` visual result remains the approved home baseline. The current `/quant/BULL_V4` model detail result is the approved compact dashboard/detail baseline for model, report, table, modal, tab, and mobile KPI behavior. Legacy global-CSS/inline-style implementation is not the approved architecture.

## 0. Current Approved UI Contract

These rules apply to all new or refactored Market Pulse web quant screens unless the current task explicitly asks for a different UI.

### 0.1 Overall Product Shape

- Build the usable product screen first. Do not create marketing landing pages, large hero pages, or decorative intro sections.
- Keep every screen dense enough for repeated dashboard work.
- Use compact cards, tabs, filters, lists, tables, and modals as the default information architecture.
- Use user-facing Korean by default. Keep model ids, code names, API names, version ids, and file paths in their original form.
- Do not imply automatic trading, order execution, guaranteed return, or investment advice.
- Prefer plain explanations tied directly to visible data over abstract marketing copy.

### 0.2 Desktop Page Layout

For model/detail/dashboard pages, use this structure:

```text
Header
Left sidebar | Main content

Main content:
  Compact identity header
  KPI rail/cards
  Optional ad slot
  One primary content card with tabs
  Lists/tables/modals inside tab content
```

Required desktop dimensions and behavior:

- Main content max width for detail pages: `1100px`.
- Page padding follows `theme.spacing.page` and existing `DefaultLayout`.
- Do not use a tall page header. The page identity header must be compact.
- Model identity header uses one shallow card:
  - left: page/model name, `24px`, no hero type
  - right: small meta chips such as version, seed money, position money
  - padding: `14px 18px`
- KPI cards on desktop appear in one row when there are four primary metrics.
- KPI row gap: `12px`.
- Place the ad slot below KPI cards when a page needs ad inventory.
- The main tab card comes after ad slot/content lead-in.

### 0.3 Mobile Page Layout

Mobile uses responsive layout, not a separate `m.` site.

Header mobile contract:

- Logo/brand stays on the left.
- Login/profile action must be pushed to the right edge with `margin-left: auto`.
- Do not allow the login button to sit immediately beside the brand if there is free horizontal space.
- Header mobile horizontal padding: `16px`.

KPI mobile contract:

- Four top KPI cards must not stack vertically.
- Use one horizontal scroll rail.
- Mobile KPI rail:
  - `display: flex`
  - `overflow-x: auto`
  - `gap: 12px`
  - `scroll-snap-type: x proximity`
  - preserve smooth touch scrolling with `-webkit-overflow-scrolling: touch`
- Mobile KPI card:
  - `flex: 0 0 38%`
  - `max-width: 168px`
  - `min-height: 100px`
  - `padding: 12px`
  - `scroll-snap-align: start`
- This must show 2 full KPI cards and part of a 3rd KPI card in a 390px-wide viewport.
- Mobile KPI typography:
  - card title: `12px`
  - main value: `20px`, `line-height: 1.15`
  - muted helper text: `11px`, `line-height: 1.3`
- Keep bottom padding for bottom navigation: `calc(76px + env(safe-area-inset-bottom))`.

### 0.4 Card Contract

Card use:

- Use cards for page identity headers, KPI tiles, repeated list items, table wrappers, modals, and primary tab containers.
- Avoid cards inside cards unless the inner card is a genuine repeated item, table wrapper, or modal content block.
- Do not style every page section as a floating card.
- Do not use large rounded marketing cards.

Card dimensions:

- General card radius follows `theme.radius.card`.
- Control/tab/filter radius follows `theme.radius.control` (`8px`).
- Small meta chips use `theme.radius.small` (`6px`).
- Detail identity header padding: `14px 18px`.
- KPI desktop card padding: `16px`.
- KPI mobile card padding: `12px`.
- Info/rule panels use `16px` padding.

### 0.5 Typography Contract

Use the existing theme font:

```text
theme.font.sans = "Pretendard Variable", Pretendard, "Noto Sans KR", -apple-system, sans-serif
```

Required sizing:

- Page/model title: `24px`, `font-weight: 800`, no hero scale.
- Section titles inside cards/panels: `13px` to `16px`, compact and bold.
- Button/tab/filter text: `12px` to `13px`, bold enough for scanning.
- Muted helper text: `11px` to `13px`.
- Table text: `12px` to `13px`.
- Do not scale font size with viewport width.
- Letter spacing must be `0` unless inherited normal text rendering is required.
- Do not use oversized H1/H2 typography inside compact dashboard cards.

### 0.6 Tab Contract

Use tabs aggressively when several related views share one page context.

Main model detail tabs must follow the approved pattern:

```text
요약 | 오늘 후보 | 기간별 후보 | 거래 내역 | 리포트
```

Rules:

- If a tab label already identifies the section, do not repeat the same title/description/count badge directly under it.
- A selected tab should start directly with content, filters, list, or table.
- Active main tab:
  - background: `theme.color.accent`
  - text: white
  - border: `theme.color.accent`
- Inactive main tab:
  - background: `theme.color.panel`
  - text: `theme.color.textMuted`
  - border: `theme.color.border`
- Main tab button:
  - min-height: `34px`
  - horizontal padding: `14px`
  - font-size: `13px`
  - font-weight: `700`
  - radius: `theme.radius.control`
- Use internal tabs inside a single card when the content is explanatory and does not need separate pages.

Approved summary internal tabs:

```text
후보 선정 | 진입 | 손절 / 익절 | 자금 | 이번달 수익률
```

Internal tab rules:

- The internal tab list lives inside one `InfoPanel`-style card.
- Only the selected internal tab's content is visible.
- Do not show four separate rule cards when one tabbed rule card is enough.
- `이번달 수익률` belongs inside this internal tab group, not as a separate card beside rules.

### 0.7 List, Filter, Table Contract

All list-like screens must provide filtering appropriate to the list type.

Filter rule:

- Do not hard-code one universal filter structure for every list.
- Choose filters by list semantics.
- Use the Bull v4 report/trade filter as the current reference pattern when a date/period list is needed:

```text
기준일 [date input]     당일 | 최근 7일 | 최근 30일 | 전체
```

Reference filter behavior:

- Date input is on the left.
- Period segmented buttons are on the right.
- Active period uses accent-soft background and accent text.
- The selected period changes the table rows in place.
- Keep filters above the list/table and below the selected main tab.

Table rules:

- Prefer table-style lists for report, trade, candidate, and history screens.
- Table wrapper uses a bordered card-like table container.
- Tables must support horizontal scroll if columns cannot fit.
- Empty states must live inside the table body with a full-width row.
- Do not show redundant heading blocks above tables when the selected tab already names the list.

### 0.8 Detail And Modal Contract

Use modals for document-like detail opened from a list.

Approved flow:

```text
Tab -> Filter -> List/Table -> Row click -> Modal detail
```

Rules:

- Do not insert a long selected-detail card above the list if it makes the tab feel duplicated or heavy.
- Keep the filtered list visible behind the modal.
- Closing the modal must preserve the tab/list/filter context.
- Modal overlay:
  - `position: fixed`
  - `inset: 0`
  - `z-index: 50`
  - dim background: `rgb(24 24 27 / 42%)`
  - top aligned with padding, not vertically centered for long reports
- Modal panel:
  - width: `min(100%, 1040px)`
  - max-height: `calc(100vh - 96px)`
  - overflow: auto
  - padding: `20px`
  - radius: `theme.radius.card`
  - white panel background
  - subtle border and shadow
- Modal header:
  - title + short summary on left
  - close icon button on right
  - bottom divider
- Modal close button:
  - 32px square
  - radius: `theme.radius.control`
  - border: `theme.color.border`

### 0.9 Chart Contract

Approved line chart style:

- Use a lightweight SVG line chart.
- Line stroke: `2px`.
- Point radius: `2`.
- Point stroke: `1.5px`.
- Gridlines: 20% interval, no side axis labels unless explicitly requested.
- Do not show duplicate return values below the chart.
- Month labels below the chart may be links.
- Return value appears in hover/focus tooltip.
- Tooltip text:
  - font family: `theme.font.sans`
  - font-size: `11px`
  - font-weight: `400`
  - color: `theme.color.textSubtle`
  - `stroke: none`
  - no thick paint-order outline
- Tooltip should include current return and previous-month comparison when comparing monthly return:

```text
+4.56%
전월 대비 +4.56%p
```

### 0.10 Color Contract For Current Screens

Use the theme colors in `apps/web/src/app/theme.ts`.

Current approved colors:

```text
bg: #ffffff
panel: #ffffff
softPanel: #f1f3f6
hover: #f5f5f4
text: #18181b
textMuted: #44403c
textSubtle: #78716c
border: #e7e5e4
softBorder: #d9dde5
divider: #efeeec
accent: #2f77df
accentSoft: #eef5ff
accentBorder: #cfe0ff
up: #d62828
down: #1e5edb
warning: #f97316
```

Rules:

- Accent blue is for tabs, selected filters, links, and primary actions.
- Red is positive/up/profit.
- Blue is negative/down/loss.
- Orange is warning/caution.
- Do not add green normal-state indicators.
- Do not introduce purple, teal, beige, gradient, orb, bokeh, or decorative palettes.

### 0.11 Quant Model Detail Contract

For `/quant/:modelCode` style pages:

Top order:

```text
Compact model identity header
Four KPI cards
Ad slot
Primary tab card
```

Approved top KPI labels:

```text
수익률
수익금
현재 자금
이번달 시장상황
```

Approved main tabs:

```text
요약
오늘 후보
기간별 후보
거래 내역
리포트
```

Approved `요약` tab:

- One summary rule card with internal tabs.
- Internal tabs:
  - `후보 선정`
  - `진입`
  - `손절 / 익절`
  - `자금`
  - `이번달 수익률`
- The `이번달 수익률` internal tab must include:
  - 이번 달
  - 전월 대비
  - 누적
  - 현재 자금
- The old generic chips are forbidden:
  - `상승장 확인`
  - `거래대금 증가`
  - `진입 확인`
  - `손절/익절 규칙`

Approved model-rule content for Bull v4:

후보 선정:

```text
원천 데이터는 `market_daily_price` 기반 리플레이 결과를 사용합니다.
`filtered_w4_range20_entry_confirmation` 파이프라인을 통과한 종목만 후보로 봅니다.
후보는 최근 진입일 기준으로 정렬하고, 화면에는 최근 10개까지 노출합니다.
```

진입:

```text
신호일과 실제 진입일을 분리해서 기록합니다.
진입은 `entry_date`와 `entry_price` 기준으로 계산합니다.
후보가 있어도 진입 확인 조건을 통과하지 않으면 거래 내역에 남기지 않습니다.
```

손절 / 익절:

```text
청산은 Bull v4 체크포인트/exit rule에 의해 닫힌 거래만 반영합니다.
손절 기준은 리플레이 exit plan 기준 -18% 구간을 사용합니다.
표시 수익률은 `entry_price`부터 `exit_price`까지의 완료 거래 기준입니다.
```

자금:

```text
운영 시드머니는 1억원 paper 기준입니다.
종목당 진입 금액은 1천만원 paper 기준입니다.
모델 성과는 완료된 리플레이 거래를 누적해 현재 자금과 수익률로 환산합니다.
```

### 0.12 Report Tab Contract

The report tab is a filtered report browser.

Structure:

```text
Filter bar
Report list table
Report detail modal when selected
```

Rules:

- Do not show an inline selected report card above the report list.
- Monthly report rows and backend model-authored report rows can appear in the same list.
- Row click opens modal detail.
- URL query may preserve selection:
  - `?tab=reports&month=2026-05`
  - `?tab=reports&report=101`
- Closing modal returns to `?tab=reports` and preserves the list context.

Monthly report modal must include:

```text
월 수익률
거래 건수
후보 수
중복 제외 종목 수
월 요약
이후 향방
거래 내용 테이블
후보 종목 테이블
```

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
- Keep control border radius at `8px`.
- Keep dashboard dense, not spacious SaaS marketing.

## 18. Acceptance Criteria

Home is acceptable only when:

- first-time user understands the service within 5 seconds
- `퀀트 모델` appears on first screen
- top panel is split into today's stocks and today's market status
- top panel uses gray soft background
- right rail order is `뉴스`, `광고 영역`, `관심 폴더`
- right rail width is `420px`
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
