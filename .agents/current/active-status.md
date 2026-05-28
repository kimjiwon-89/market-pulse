# Prod Active Status

Date: 2026-05-28

## Current State

- Production repo shell exists.
- API code copied into `apps/api`.
- Web code copied into `apps/web`.
- Root production docs and domain guides exist.
- Local DB dump copy exists under `datasets/local-only/marketpulse.dump`.

## Not Done Yet

- Update build/run paths after migration.
- Remove copied source originals from root after dev processes release locks.
- Run tests after path updates.
- Run secret scan before first real commit/push.

## Recent Log

- Intent: capture the approved quant-home visual direction for future web work.
- Outcome: added a web agent design guide for quant home, beginner language, navigation, mobile, admin separation, and stock badge rules.
- Changed files: `apps/web/.agents/guides/quant-home-design-guide.md`, `apps/web/AGENTS.md`, `apps/web/CLAUDE.md`.

- Intent: create the user-facing quant home page plan and HTML planning deliverable.
- Outcome: documented IA, desktop/mobile nav, home layout, language rules, stock badges, admin separation, and suggested frontend structure.
- Changed files: `apps/web/report/quant-home-planning/source.md`, `apps/web/report/quant-home-planning/latest.html`, `apps/web/report-index.md`, `apps/web/.agents/guides/quant-home-design-guide.md`.

- Intent: attach the approved quant home mockup to the planning report.
- Outcome: copied the selected reference mockup into the report assets folder and linked it from Markdown and HTML.
- Changed files: `apps/web/report/quant-home-planning/assets/quant-home-mockup.png`, `apps/web/report/quant-home-planning/source.md`, `apps/web/report/quant-home-planning/latest.html`.

- Intent: strengthen the quant home planning report for implementation readiness.
- Outcome: expanded the plan into a PRD-style document with users, goals, requirements, data shape, states, phases, acceptance criteria, and open decisions; extended the HTML report summary.
- Changed files: `apps/web/report/quant-home-planning/source.md`, `apps/web/report/quant-home-planning/latest.html`.

- Intent: align the HTML report with the legacy `project-overview.html` document-dashboard style.
- Outcome: rebuilt `latest.html` with fixed sidebar navigation, narrow document body, section anchors, compact cards, tables, timeline blocks, and the approved mockup section.
- Changed files: `apps/web/report/quant-home-planning/latest.html`.

- Intent: make future HTML reports consistently match the legacy document-dashboard style.
- Outcome: expanded `.agents/guides/html-output-style.md` with the canonical reference path, required HTML skeleton, exact layout measurements, token set, sidebar/header/card/table/grid/timeline/image rules, content order, placement rules, and anti-patterns.
- Changed files: `.agents/guides/html-output-style.md`.

- Intent: make the web quant-home design guide explicit enough for implementation agents.
- Outcome: expanded `apps/web/.agents/guides/quant-home-design-guide.md` with approved references, non-negotiable visual rules, exact desktop/mobile navigation, layout/content requirements, badge rules, language system, data expectations, states, phases, acceptance criteria, and anti-patterns.
- Changed files: `apps/web/.agents/guides/quant-home-design-guide.md`.

- Intent: create a user-facing HTML design guide from the finalized quant-home design rules.
- Outcome: added a report folder with Markdown source, project-overview-style HTML, copied mockup asset, and web report index entry.
- Changed files: `apps/web/report/quant-home-design-guide/source.md`, `apps/web/report/quant-home-design-guide/latest.html`, `apps/web/report/quant-home-design-guide/assets/quant-home-mockup.png`, `apps/web/report-index.md`.

- Intent: apply final quant-home planning decisions before implementation.
- Outcome: fixed `/quant` as the model list, removed normal-user validation navigation, set validation/backtest as admin-only, switched first build guidance to typed mock data, and made public read/login-gated personal actions explicit.
- Changed files: `apps/web/.agents/guides/quant-home-design-guide.md`, `apps/web/report/quant-home-planning/source.md`, `apps/web/report/quant-home-planning/latest.html`, `apps/web/report/quant-home-design-guide/source.md`, `apps/web/report/quant-home-design-guide/latest.html`.

- Intent: reorganize the web app around the approved quant-home plan.
- Outcome: routed `/` to a mock-data QuantHome, fixed `/quant` as the model list, added today/report/services/my pages, removed legacy QuantDashboard/QuantBacktest files, and kept validation/backtest admin-only.
- Changed files: `apps/web/src/app/router.tsx`, `apps/web/src/features/quant/*`, `apps/web/src/pages/QuantHome/*`, `apps/web/src/pages/QuantToday/*`, `apps/web/src/pages/QuantModels/*`, `apps/web/src/pages/Reports/*`, `apps/web/src/pages/Services/*`, `apps/web/src/pages/MyPage/*`, `apps/web/src/components/common/*`, `apps/web/src/types/index.ts`, `apps/web/README.md`.

- Intent: make every current web route usable with mock data before backend wiring.
- Outcome: replaced API-backed market, index, investor, net-buying, news, memo, stock-detail, admin, login, lotto, and tarot screens with mock-data pages; removed unused stock-detail components and lotto discussion code.
- Changed files: `apps/web/src/features/mock/marketMockData.ts`, `apps/web/src/pages/Dashboard/index.tsx`, `apps/web/src/pages/IndexDetail/index.tsx`, `apps/web/src/pages/InvestorTrend/index.tsx`, `apps/web/src/pages/NetBuyingList/index.tsx`, `apps/web/src/pages/NewsList/index.tsx`, `apps/web/src/pages/MemoList/index.tsx`, `apps/web/src/pages/StockDetail/index.tsx`, `apps/web/src/pages/Admin/index.tsx`, `apps/web/src/pages/Login/index.tsx`, `apps/web/src/pages/LottoAnalysis/index.tsx`, `apps/web/src/pages/Services/TarotPage.tsx`, `apps/web/src/components/common/Header.tsx`.

- Intent: remove action-like copy from quant stock decisions and make favorites explicit.
- Outcome: removed the `오늘 행동` column from home/today tables, added right-edge star favorite controls, and added mock interest-folder selection gated by login.
- Changed files: `apps/web/src/features/quant/FavoriteFolderPicker.tsx`, `apps/web/src/features/quant/quantTypes.ts`, `apps/web/src/features/quant/quantMockData.ts`, `apps/web/src/pages/QuantHome/index.tsx`, `apps/web/src/pages/QuantToday/index.tsx`, `apps/web/src/index.css`.

- Intent: lock the finalized quant home dashboard as the design-system baseline.
- Outcome: rewrote the agent and user-facing quant-home design guides around the current dashboard: 420px right rail, split gray top panel, news/ad/favorite rail, header/profile rules, color/icon rules, table rules, mobile nav, and explicit anti-patterns.
- Changed files: `apps/web/.agents/guides/quant-home-design-guide.md`, `apps/web/report/quant-home-design-guide/source.md`, `apps/web/report/quant-home-design-guide/latest.html`, `market-pulse-prod/.agents/current/active-status.md`.

- Intent: capture mobile follow-up after desktop home approval.
- Outcome: desktop main dashboard is accepted as the visual baseline, but the current mobile version must be redesigned separately; create a dedicated mobile design guide before treating mobile implementation as final.
- Changed files: `market-pulse-prod/.agents/current/active-status.md`.
