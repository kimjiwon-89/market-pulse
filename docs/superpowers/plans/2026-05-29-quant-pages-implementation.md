# Quant Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the A-option quant-model-first app pages by keeping the approved home direction and wiring every current route to dense, usable mock-data screens.

**Architecture:** Keep `pages/*` as route-level surfaces for this pass, introduce reusable styled-components primitives under `src/components/ui`, and add a smoke test that verifies every major page exposes its expected user-facing heading. Quant home remains feature-first under `src/features/quant/home`.

**Tech Stack:** React 19, TypeScript, React Router 7, Vite, styled-components, Vitest, Testing Library.

---

### Task 1: Page Smoke Test Harness

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/src/pages/pageSmoke.test.tsx`

- [ ] Add Vitest and Testing Library scripts/dependencies.
- [ ] Add setup file for DOM matchers.
- [ ] Add smoke tests for current page components: market, index detail, investor, net buy, memo, news, admin, lotto, services, tarot, my page, stock detail, quant today, quant models, reports.
- [ ] Run `npm test -- --run` and confirm it fails before page rewrites where headings or DOM test setup are missing.

### Task 2: Shared Styled Page Primitives

**Files:**
- Create: `apps/web/src/components/ui/Page.tsx`
- Modify: `apps/web/src/layout/DefaultLayout.tsx`
- Modify: `apps/web/src/layout/Header.tsx`
- Modify: `apps/web/src/layout/Nav.tsx`
- Modify: `apps/web/src/layout/BottomNav.tsx`

- [ ] Create reusable page, card, table, badge, button, grid, stack, list, metric, and auth gate primitives.
- [ ] Replace layout inline styles and global helper class dependencies with styled-components.
- [ ] Preserve the guide contract: 60px header, 224px sidebar, centered search, profile menu, bottom nav `시장 | 모델 | 홈 | 서비스 | 마이`.

### Task 3: Quant Pages

**Files:**
- Modify: `apps/web/src/pages/QuantToday/index.tsx`
- Modify: `apps/web/src/pages/QuantModels/index.tsx`
- Modify: `apps/web/src/pages/Reports/index.tsx`
- Modify: `apps/web/src/pages/StockDetail/index.tsx`

- [ ] Build today's stock page with the same decision language as home.
- [ ] Build model list/detail with accepted model status, focus chips, linked decisions, and no public validation/backtest navigation.
- [ ] Build reports list/detail with model-linked summary and mock report body.
- [ ] Build stock detail around price, quant decision, reasons, cautions, investor flow, memo entry, and report links.

### Task 4: Market And Personal Pages

**Files:**
- Modify: `apps/web/src/pages/Dashboard/index.tsx`
- Modify: `apps/web/src/pages/IndexDetail/index.tsx`
- Modify: `apps/web/src/pages/InvestorTrend/index.tsx`
- Modify: `apps/web/src/pages/NetBuyingList/index.tsx`
- Modify: `apps/web/src/pages/NewsList/index.tsx`
- Modify: `apps/web/src/pages/MemoList/index.tsx`
- Modify: `apps/web/src/pages/MyPage/index.tsx`

- [ ] Build market overview under `/market`, not as home.
- [ ] Build index, investor flow, net-buying, news, memo, and my-page screens from current mock data.
- [ ] Keep personal actions login-gated where relevant.

### Task 5: Service, Auth, Admin Pages

**Files:**
- Modify: `apps/web/src/pages/Services/index.tsx`
- Modify: `apps/web/src/pages/Services/TarotPage.tsx`
- Modify: `apps/web/src/pages/LottoAnalysis/index.tsx`
- Modify: `apps/web/src/pages/Login/index.tsx`
- Modify: `apps/web/src/pages/Admin/index.tsx`
- Modify: `apps/web/src/app/router.tsx`

- [ ] Build services entry as separate lotto/tarot area, not mixed into quant home.
- [ ] Build lotto and tarot mock serving pages.
- [ ] Build login page with mock login buttons.
- [ ] Build admin-only operations page and styled unauthorized state.

### Task 6: Verification And Log

**Files:**
- Modify: `market-pulse-prod/.agents/current/active-status.md`

- [ ] Run `npm test -- --run`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run a local browser smoke pass if server starts.
- [ ] Append compact active-status log with intent, outcome, changed files.
