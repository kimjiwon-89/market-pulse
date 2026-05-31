# Market Pulse Quant Home Design Guide

Date: 2026-05-28  
Scope: `apps/web` quant-model home and related beginner-facing screens  
Status: Current approved guide  
Canonical implementation: `apps/web/src/pages/QuantHome/index.tsx`

## 1. Product Direction

Market Pulse home is not a landing page and not an auto-trading product.

It is a dashboard where a `퀀트 모델` reviews daily market data and explains:

- 오늘 볼 종목
- 조심할 종목
- 판단에 사용된 모델
- 판단 이유
- 오늘의 시장 상태

Main copy:

```text
퀀트 모델이 고른 오늘의 종목
매일 시장 데이터를 계산해 살펴볼 종목, 기다릴 종목, 조심할 종목을 쉽게 정리합니다.
```

Do not replace `퀀트 모델` with `AI 투자 판단`.

## 2. Desktop Layout

Approved desktop structure:

```text
Header
Left sidebar | Main content column | Right utility rail
```

Required dimensions:

| Area | Rule |
|---|---|
| Sidebar | `224px` fixed desktop width |
| Header | `60px` height |
| Page padding | `32px` |
| Right rail | about `420px` |
| Card radius | `8px` |
| Main gap | `20px` |

Home shell:

```css
.quant-home-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: var(--gap-card);
}
```

Do not shrink the right rail to the old narrow rail. Do not restore the old right-side summary/status/explanation rail.

## 3. Header

Header must contain:

```text
Market Pulse logo | centered search | 알림 | profile circle
```

Profile menu contains:

```text
마이페이지
관심 폴더
로그아웃
```

Do not show in the header:

- `KRX 기준`
- `종가`
- top-level `관심`
- `admin`
- visible `로그아웃`
- odd temporary unicode icons

## 4. Sidebar

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

Sidebar bottom:

```text
데이터 기준
2026.05.28 14:25
```

Rules:

- `마이페이지` does not appear in desktop sidebar.
- `관심 폴더` is in profile menu and My Page, not sidebar.
- Admin appears only for ADMIN users.

## 5. Top Dashboard Panel

The first card is a gray soft section split into two equal panels:

```text
Left: 퀀트 모델이 고른 오늘의 종목
Right: 오늘의 시장 현황
```

Container:

```tsx
<section className="card soft-section">
  <div className="quant-hero-split">
    <div className="quant-hero-panel">...</div>
    <div className="quant-hero-panel market">...</div>
  </div>
</section>
```

Soft section color:

```css
background: #f1f3f6;
border-color: #d9dde5;
```

Rules:

- Outer top panel is gray.
- Inner metric cards are white.
- Left and right card rows align horizontally.
- Metric cards and market cards use fixed height around `112px`.
- Do not make the title hero-sized.
- Do not put update time in the top panel.

## 6. Left Top Panel: Today's Stocks

Title:

```text
퀀트 모델이 고른 오늘의 종목
```

Style:

```text
19px, 600 weight
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
- Compact, not oversized KPI tiles.
- Height must prevent text clipping.
- `WARNING` uses orange.
- Red/blue only encode market direction.

## 7. Right Top Panel: Market Status

Title:

```text
오늘의 시장 현황
```

Summary:

```text
지수는 약세지만 급락 신호는 제한적이고, 반도체 쪽 수급은 개선 흐름입니다.
```

Cards:

```text
지수     약세 관찰
수급     반도체 개선
체크     환율·금리
분위기   선별 장세
```

Rules:

- Four cards in one row on desktop.
- Same height as left metric cards.
- Do not use vague labels such as `숨 고르기 구간`.

## 8. Today Decision Table

Desktop columns:

```text
종목 | 신호 모델 | 이유 | 조심할 점 | 관심 별
```

Forbidden columns:

```text
오늘 행동
모델 판단
```

Rules:

- No auto-trading language.
- Decision code sits next to stock name.
- `BUY`, `SELL`, `WARNING`, `SIDE` are compact badges.
- `WARNING` is orange.
- Favorite star is far right.
- Favorite star has no circle border.
- Star click opens favorite folder selection for logged-in users.
- Logged-out personal actions go to `/login`.

## 9. Right Utility Rail

Right rail order:

```text
뉴스
광고 영역
관심 폴더
```

### 뉴스

Rules:

- First card in right rail.
- Show titles only.
- Scroll inside the news card.
- `더보기` goes to `/news`.
- Do not show source/date in the home rail list.

### 광고 영역

Rules:

- This replaces the previous `Today Report`.
- Use as a future ad slot.
- Show `AD` label and simple placeholder copy.
- Do not show reports here.

### 관심 폴더

Rules:

- Folder list scrolls inside the card.
- `관리` goes to My Page.
- Edit/delete happens in My Page.
- Folder rows remain white against gray card/background when highlighted.

## 10. Quant Model Explainer

Position:

```text
below today decision table, main column
```

Text:

```text
퀀트 모델이란?
수많은 시장 데이터를 수학과 통계로 분석해 종목의 매력도를 점수로 계산하는 도구입니다.
감정이 아닌 데이터로 판단해 더 일관된 투자를 도와줍니다.
```

Rules:

- Keep compact.
- Do not turn into a marketing section.
- `더 알아보기` goes to `/quant`.

## 11. Color System

| Role | Value / Rule |
|---|---|
| Brand/action accent | `#2f77df` |
| Accent soft | `#eef5ff` |
| Accent border | `#cfe0ff` |
| Soft section | `#f1f3f6` |
| Soft section border | `#d9dde5` |
| 상승/positive | red `#d62828` |
| 하락/negative | blue `#1e5edb` |
| Warning | orange `#f97316` |

Rules:

- Monotone base UI.
- Blue is brand/action emphasis.
- Red/blue are reserved for market direction.
- No teal/green/purple/beige decorative palettes.
- No gradient/orb decoration.

## 12. Icons And Badges

Use:

- circular stock initial badges
- simple star for favorites
- compact info dot `i`
- circular profile avatar

Do not use:

- full company logos by default
- odd unicode notification symbols
- top-level favorite button in header
- circular background around table favorite star

Stock badges:

```text
SK하이닉스    red circle + SK
삼성전자      blue circle + 삼
현대차        dark blue circle + 현
KODEX 반도체  purple circle + K
```

## 13. Mobile

Use responsive layout, not separate `m.` site.

Bottom nav:

```text
시장 | 모델 | 홈 | 서비스 | 마이
```

Rules:

- `홈` is centered.
- Mobile home uses cards, not wide tables.
- `오늘의 종목` and `리포트` are reached from home, not bottom nav.
- `마이` contains profile, favorite folders, memos, alerts, saved reports, account, and ADMIN entry if applicable.

## 14. My Page, Services, Admin

My Page:

- desktop entry: profile menu
- mobile entry: bottom nav `마이`
- contains favorite folder view/edit/delete

Favorite folders:

- add from star popover
- edit/delete in My Page
- default `메인 관심` should not be deleted

Services:

- `서비스` contains lotto/tarot.
- Do not mix lotto/tarot into quant home.

Admin:

- ADMIN only.
- validation/backtest/evidence is admin-only.
- normal users do not see `검증 기록`.

## 15. Acceptance Criteria

The home design is acceptable only when:

- `퀀트 모델` is visible on first screen
- top panel is split into today's stocks and today's market status
- right rail order is `뉴스`, `광고 영역`, `관심 폴더`
- right rail is around `420px`
- news and favorite folders scroll inside their own cards
- table has no `오늘 행동`
- favorite star is plain and right-aligned
- profile menu contains `관심 폴더`
- header has no `KRX 기준`, `종가`, top-level `관심`, `admin`, or visible logout
- warning is orange
- red/blue only mean market direction
- mobile bottom nav is `시장 | 모델 | 홈 | 서비스 | 마이`

## 16. Explicit Anti-Patterns

Do not reintroduce:

- old one-line summary right rail
- model status bars in the right rail
- why-this-judgment card in the right rail
- disclaimer card in the right rail
- `Today Report` in the right rail
- quick links in the right rail
- `오늘 행동` column
- top header `관심`
- top header `KRX 기준` or `종가`
- odd unicode notification icons
- public validation/backtest navigation
