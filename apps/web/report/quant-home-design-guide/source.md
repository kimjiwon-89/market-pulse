# Market Pulse Quant Home Design Guide

Date: 2026-05-28  
Scope: `apps/web` frontend design system  
Status: Current design guide  
Based on: `apps/web/.agents/guides/quant-home-design-guide.md`

## Overview

This guide defines the binding visual and UX direction for the Market Pulse quant-model home and related beginner-facing quant surfaces.

The approved direction is:

- preserve the approved desktop mockup ratio
- keep UI chrome monochrome
- use subtle blue only for navigation/action/info emphasis
- use red/blue only for market direction
- use circular initial badges for stocks
- keep `퀀트 모델` as the product keyword
- explain quant-model decisions in beginner-friendly language
- separate market, model, home, services, my page, and admin responsibilities

## Reference Assets

Use this mockup as the source of truth for visual ratio, density, and placement:

![Quant home approved mockup](assets/quant-home-mockup.png)

Related planning report:

```text
apps/web/report/quant-home-planning/source.md
apps/web/report/quant-home-planning/latest.html
```

## Core Intent

The first screen must make the product obvious immediately.

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

## Non-Negotiable Visual Rules

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

## Color System

Base UI is monochrome.

| Role | Rule |
|---|---|
| Background | white/off-white |
| Borders | light gray |
| Text | charcoal/gray |
| Brand/action point | subtle blue only |
| 상승/positive | red |
| 하락/negative | blue |
| Stock badges | per-stock badge colors allowed |

Forbidden UI color usage:

- teal as brand accent
- green status dots for normal operation
- purple/orange/beige decorative UI palette
- red for generic `살펴볼 종목`
- blue for generic info panels when it could be confused with 하락
- colorful model state bars unless they encode real market direction

## Desktop Layout

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

Proportion rules:

- sidebar remains narrow
- right rail remains secondary
- KPI cards stay compact
- table is the visual center
- explainer block stays below the table
- do not stretch cards or enlarge the sidebar to fill space

## Home Content Rules

### Hero

Required elements:

- title: `퀀트 모델이 고른 오늘의 종목`
- subtitle: beginner explanation
- update time / latest refresh

Avoid:

- long paragraph
- marketing claims
- `AI` positioning
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

- compact cards
- count/value plus one short hint
- small sparklines/icons only if compact
- red/blue only for actual positive/negative market values
- `조심 신호` should not look like an alarm dashboard

### Today's Decision Table

Default desktop columns:

```text
종목 | 모델 판단 | 오늘 행동 | 이유 | 조심할 점
```

Optional column:

```text
신호 모델
```

Multiple model behavior:

- default: one compact `여러 모델` badge
- desktop: hover tooltip shows exact model names
- mobile: tap/expand or bottom sheet shows exact model names
- do not list all model names inline by default

## Stock Initial Badge System

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

| Stock | Badge |
|---|---|
| SK하이닉스 | red circle + SK or simple white mark |
| 삼성전자 | blue circle + 삼 |
| 현대차 | dark blue circle + 현 |
| KODEX 반도체 | purple circle + K |

## Navigation

### Desktop Sidebar

```text
홈
오늘의 종목
퀀트 모델
리포트
검증 기록
시장 보기
더보기
```

Rules:

- do not put `마이페이지` in the desktop sidebar
- enter my page from top-right profile menu
- keep lotto/tarot outside the core quant sidebar unless explicitly changed later

### Mobile Bottom Navigation

```text
시장 | 모델 | 홈 | 서비스 | 마이
```

Rules:

- `홈` is centered
- `오늘의 종목` is not a bottom-nav item
- `리포트` is not a bottom-nav item
- today decisions and reports are reached from home
- `서비스` contains lotto/tarot
- `마이` contains profile, saved items, memos, alerts, and ADMIN entry if allowed

## Language System

Preferred beginner terms:

| Expert Term | Beginner Term |
|---|---|
| signal | 오늘의 판단 |
| candidate | 오늘의 종목 |
| buy candidate | 살펴볼 종목 |
| hold/watchlist | 기다릴 종목 |
| risk flag | 조심할 점 |
| trim | 비중 축소 고려 |
| backtest | 검증 기록 |
| diagnostics | 모델 점검 |
| portfolio target | 목표 비중 |

Allowed in advanced/detail screens:

- 백테스트
- 리밸런싱
- 포트폴리오 목표 비중
- MDD
- Sharpe
- factor score
- diagnostics

Rule: if an expert term appears, place a plain-language explanation nearby.

## Mobile Behavior

Use responsive layout, not a separate `m.` site.

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

## My Page, Services, Admin

### My Page

Desktop entry:

- top-right profile menu

Mobile entry:

- bottom nav `마이`

Sections:

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

`서비스` contains:

```text
로또
타로
```

Do not mix lotto/tarot into the quant decision table, right rail, or home KPI sections.

### Admin

Admin is an operating console.

Rules:

- show admin menu only for `ADMIN`
- mobile admin entry belongs inside `마이` only for `ADMIN`
- protect `/admin/*` routes with an admin guard
- normal users should not see disabled admin actions

## Frontend Structure

Recommended:

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

Route direction:

```text
/       -> QuantHome
/market -> existing Dashboard
```

Avoid adding more responsibilities to:

```text
src/pages/QuantDashboard/index.tsx
```

## Acceptance Criteria

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

## Explicit Anti-Patterns

Do not:

- make a landing page
- make an unrelated dashboard layout
- change the approved mockup ratio casually
- replace `퀀트 모델` with `AI`
- use teal/green/purple/orange/beige as chrome accents
- use red to mean recommended
- use wide desktop tables on mobile
- show lotto/tarot in the quant home
- show admin actions to normal users
- keep adding to `QuantDashboard/index.tsx`
