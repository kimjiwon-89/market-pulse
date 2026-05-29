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

- Intent: fix QuantHome mobile top-panel card layout.
- Outcome: changed the 900px responsive breakpoint so KPI and market-status cards render as compact horizontal scroll rails, unified their mobile radius, and compressed the first section to roughly one-third of a 393x852 mobile viewport.
- Changed files: `apps/web/src/index.css`, `market-pulse-prod/.agents/current/active-status.md`.

- Intent: compact the QuantHome mobile decision list.
- Outcome: added mobile-only decision section/card classes and CSS so today's stock decisions use a compact reference structure: profile, two-line content, and right-side star, all vertically centered.
- Changed files: `apps/web/src/pages/QuantHome/index.tsx`, `apps/web/src/index.css`, `market-pulse-prod/.agents/current/active-status.md`.

- Intent: hide visible mobile scrollbars on QuantHome compact rails/lists.
- Outcome: kept horizontal and vertical scrolling available while hiding scrollbar tracks/thumbs for KPI, market-status, and decision-list mobile scroll containers.
- Changed files: `apps/web/src/index.css`, `market-pulse-prod/.agents/current/active-status.md`.

- Intent: make frontend structure and styling preferences permanent.
- Outcome: updated the quant home design guide and web agent entrypoints to require feature-first organization, feature-scoped API/store files, route-wrapper pages, styled-components for product UI, and only reset/base global styling.
- Changed files: `apps/web/.agents/guides/quant-home-design-guide.md`, `apps/web/AGENTS.md`, `apps/web/CLAUDE.md`, `market-pulse-prod/.agents/current/active-status.md`.

- Intent: migrate QuantHome toward the approved feature-first styled-components structure.
- Outcome: installed `styled-components`, added app theme/provider/global reset, moved shell components into `src/layout`, moved QuantHome into `features/quant/home` components, converted quant home styling to styled-components, removed legacy QuantHome selectors from `index.css`, and updated the web README with the new folder rules and migration status.
- Changed files: `apps/web/package.json`, `apps/web/package-lock.json`, `apps/web/README.md`, `apps/web/src/app/*`, `apps/web/src/features/quant/*`, `apps/web/src/features/quant/home/*`, `apps/web/src/pages/QuantHome.tsx`, `apps/web/src/pages/QuantHome/index.tsx`, `apps/web/src/index.css`, `market-pulse-prod/.agents/current/active-status.md`.

- Intent: verification handoff for the QuantHome styled-components migration.
- Outcome: `npm run build` passed, `npm run lint` passed, target structure check passed, and legacy QuantHome selectors are absent from `apps/web/src/index.css`; `package.json` has no `test` script, so no unit test command was available.
- Changed files: none beyond verification log; next agent should continue migrating remaining legacy screens/layout styles out of `index.css` into styled-components.

- Intent: build the A-option quant-model-first frontend pages across all current routes.
- Outcome: added shared styled page primitives, migrated app shell and route pages to usable quant/market/service/account/admin screens, added Vitest smoke coverage, removed visible internal mock-data labels, and browser-smoked key routes with no console errors.
- Changed files: `apps/web/src/components/ui/Page.tsx`, `apps/web/src/layout/*`, `apps/web/src/pages/*`, `apps/web/src/test/setup.ts`, `apps/web/package.json`, `apps/web/package-lock.json`, `apps/web/vite.config.ts`, `docs/superpowers/plans/2026-05-29-quant-pages-implementation.md`.

- Intent: fix desktop nav double-active state on `/quant/today`.
- Outcome: reproduced with a focused nav test, replaced prefix-based `NavLink` active behavior with explicit route matching, and verified only `오늘의 종목` is active in browser.
- Changed files: `apps/web/src/layout/Nav.tsx`, `apps/web/src/layout/Nav.test.tsx`, `market-pulse-prod/.agents/current/active-status.md`.

- Intent: use the provided Market Pulse logo asset in the web app.
- Outcome: copied `D:\market-pulse\logo.png` into `apps/web/public/logo.png`, wired it as favicon/apple touch icon, replaced the header letter mark with the logo image, and verified the browser loads the asset.
- Changed files: `apps/web/public/logo.png`, `apps/web/index.html`, `apps/web/src/layout/Header.tsx`, `market-pulse-prod/.agents/current/active-status.md`.

- Intent: expose only the active Bull v4 quant model on user-facing quant pages and remove quant-home mock data.
- Outcome: wired home, today, model list/detail, and reports to `/api/quant/live/*`, filters visible models to `BULL_V4`, maps live candidates/reports/news into UI state, and shows API-error/empty states instead of fallback mock data.
- Changed files: `apps/web/src/features/quant/api.ts`, `apps/web/src/features/quant/quantTypes.ts`, `apps/web/src/features/quant/home/*`, `apps/web/src/pages/QuantToday/index.tsx`, `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/Reports/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`.

- Intent: keep the Bull v4 model visible when the live API is temporarily unavailable.
- Outcome: added a non-data fallback model shell for `BULL_V4` so `/quant` still shows the actual service model while live metrics/candidates remain empty until the API responds.
- Changed files: `apps/web/src/features/quant/api.ts`, `market-pulse-prod/.agents/current/active-status.md`.

- Intent: reshape quant serving toward runtime/version-managed model promotion.
- Outcome: added a quant runtime/version design spec, introduced `LiveQuantModelRuntime` and `LiveQuantRuntimeRegistry`, split Bull v4 into a runtime behind the existing live service facade, and added an admin model version management skeleton.
- Changed files: `docs/superpowers/specs/2026-05-29-quant-runtime-version-management-design.md`, `apps/api/src/main/java/com/marketpulse/domain/quant/live/service/*`, `apps/api/src/test/java/com/marketpulse/domain/quant/live/*`, `apps/web/src/pages/Admin/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`.

- Intent: prepare a lab-facing handoff for quant runtime and model version management.
- Outcome: documented runtime registry architecture, version lifecycle, admin review metrics, public exposure rules, lab package expectations, and next production steps.
- Changed files: `report/quant-serving/runtime-model-handoff/source.md`, `market-pulse-prod/.agents/current/active-status.md`.

- Intent: promote Bull v4 serving runtime from lab `BULL_V4_100M` package.
- Outcome: bumped active runtime to model version `5.0.1`, config `BULL_V4_5_0_1_100M_BALANCED_PAPER`, 100M seed, and 10M position cash; kept 5.0.0 as rollback/source reference.
- Changed files: `apps/api/src/main/java/com/marketpulse/domain/quant/live/service/BullV4ReplayConfig.java`, `apps/api/src/main/java/com/marketpulse/domain/quant/live/service/BullV4Runtime.java`, `apps/api/src/main/java/com/marketpulse/domain/quant/runner/QuantSchemaInitRunner.java`, `apps/api/src/test/java/com/marketpulse/domain/quant/live/*`, `apps/web/src/pages/Admin/index.tsx`.

- Intent: make the Bull v4 model detail understandable when no live candidates exist.
- Outcome: approved B+A direction and updated `/quant/BULL_V4` with today's judgment, no-candidate explanation, model checks, operating facts, and beginner interpretation.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `docs/superpowers/specs/2026-05-29-quant-model-detail-beginner-design.md`, `docs/superpowers/plans/2026-05-29-quant-model-detail-beginner.md`.

- Intent: make Bull v4 detail use more space for actionable lists.
- Outcome: collapsed the top model summary, added `today candidates`, `period candidates`, and `all trades` tabs, wired model detail API data, and added date/period filters plus full trade history empty states.
- Changed files: `apps/web/src/features/quant/api.ts`, `apps/web/src/features/quant/quantTypes.ts`, `apps/web/src/features/quant/types.ts`, `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`.

- Intent: reorder `/quant/BULL_V4` around beginner-first performance and candidate flow.
- Outcome: replaced the top header/card stack with four KPI cards, moved model-rule explanation above an ad slot, kept candidate tabs below, and added paper-money fallbacks for empty live metrics.
- Changed files: `apps/web/src/features/quant/api.ts`, `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: make Bull v4 trade history clearer and filterable.
- Outcome: renamed `전체 매매` to `매매 기록`, added trade-record period/date filters, and verified recent-period filtering behavior.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: restore the compact Bull v4 model identity header above KPI cards.
- Outcome: reintroduced `Bull v4 모델` with `5.0.1`, `1억원 paper`, and `1종목 1천만원` chips while keeping the header compact.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: move Bull v4 model explanation into the main detail tabs.
- Outcome: made `이 모델이 보는 것` the first/default tab, moved the model explanation below the ad slot, added trade criteria and monthly return rows, and mapped `monthlyReturnPct` through the live model summary.
- Changed files: `apps/web/src/features/quant/api.ts`, `apps/web/src/features/quant/quantTypes.ts`, `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: separate current-month return from monthly return history in the Bull v4 model overview.
- Outcome: renamed the compact return panel to `이번달 수익률`, added a `최근 6개월 수익률` bar graph below the trading criteria, and verified the graph is present in-browser.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: show the Bull v4 six-month return history as a line chart.
- Outcome: replaced the monthly return bar graph with an accessible SVG line graph with six points and monthly labels.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: fix Bull v4 line chart scale readability.
- Outcome: changed the six-month return line chart to a fixed 0-100% scale, added 10% gridlines/axis labels, and verified 0% points render at the bottom of the chart.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: simplify Bull v4 line chart grid and add point hover detail.
- Outcome: reduced gridlines to 20% intervals, removed side percentage labels, and added per-month hover/focus tooltips with return percentages.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: add previous-month comparison to Bull v4 line chart tooltips.
- Outcome: line chart points now expose current return plus `전월 대비` percentage-point change in hover/focus tooltip and accessible labels.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: clean up Bull v4 line chart tooltip typography and reduce duplicate chart labels.
- Outcome: matched tooltip text to the site sans font with lighter weight/no SVG stroke, and removed per-month return numbers below the chart so only month labels remain.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `.agents/current/active-status.md`.

- Intent: make Bull v4 line chart tooltip typography match surrounding body copy.
- Outcome: reduced tooltip text to 11px/400 `textSubtle`, kept site sans font/no stroke, and constrained edge tooltips inward so text does not press against the chart border.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `.agents/current/active-status.md`.

- Intent: reduce Bull v4 line chart visual weight.
- Outcome: halved the line stroke, point radius, and point stroke so the chart reads lighter against the model overview text.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `.agents/current/active-status.md`.

- Intent: slightly restore Bull v4 line chart line visibility.
- Outcome: increased the line stroke from 1.5px to 2px while keeping the smaller points.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `.agents/current/active-status.md`.

- Intent: make Bull v4 monthly chart labels open month summary views.
- Outcome: added `/quant/:modelCode/month/:monthKey`, linked chart month labels to monthly summaries, and built a month page with return, trade, candidate, asset, and follow-through summary sections.
- Changed files: `apps/web/src/app/router.tsx`, `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: move Bull v4 month summaries into the model report flow.
- Outcome: added a `리포트` tab beside `매매 기록`, changed chart month labels to open that tab with a selected monthly report, and listed backend model-authored reports in the same tab.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: make Bull v4 report tab work like a filtered report browser.
- Outcome: added report date/period filters, converted reports to a table-style list, and made monthly/backend report selection render detail inside the same report tab.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: show Bull v4 report details as an overlay instead of an inline report card.
- Outcome: removed the inline monthly report detail card from the report tab, kept the filtered report list, and added a modal detail view with monthly return, trade/candidate counts, monthly summary, follow-through, trade table, and candidate table.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: remove duplicate section headers inside Bull v4 tabs.
- Outcome: removed redundant tab-body headers/descriptions/count badges so each selected tab now starts directly with its content or filters.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: improve mobile layout for Bull v4 header and KPI cards.
- Outcome: moved the mobile login action to the right edge and changed the four top KPI cards into a one-row horizontal scroll rail on mobile.
- Changed files: `apps/web/src/layout/Header.tsx`, `apps/web/src/pages/QuantModels/index.tsx`, `.agents/current/active-status.md`.

- Intent: make Bull v4 mobile KPI rail denser.
- Outcome: reduced mobile KPI card width to show about two and a half cards, lowered card height, and scaled inner KPI typography down.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `.agents/current/active-status.md`.

- Intent: clarify Bull v4 tab naming and replace vague summary chips with concrete model rules.
- Outcome: renamed `이 모델이 보는 것` to `요약`, renamed `매매 기록` to `거래 내역`, removed generic rule chips, and added candidate, entry, exit, and capital rule panels.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: consolidate Bull v4 summary rules into one tabbed card.
- Outcome: replaced the separate rule cards with a single summary card containing internal tabs for candidate, entry, exit, capital, and current-month return views.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: add previous-month comparison to the Bull v4 current-month return summary.
- Outcome: added a `전월 대비` percentage-point row to the `이번달 수익률` summary subtab using the same monthly line-chart delta calculation.
- Changed files: `apps/web/src/pages/QuantModels/index.tsx`, `apps/web/src/pages/pageSmoke.test.tsx`, `.agents/current/active-status.md`.

- Intent: codify the approved Bull v4 detail design as reusable web/mobile quant UI guidance.
- Outcome: expanded `apps/web/.agents/guides/quant-home-design-guide.md` with strict desktop/mobile layout, card, tab, filter, table, modal, chart, color, and quant model detail/report contracts.
- Changed files: `apps/web/.agents/guides/quant-home-design-guide.md`, `.agents/current/active-status.md`.

- Intent: apply the approved compact quant design rules to the home page styling.
- Outcome: tightened home card padding and aligned the home KPI/market rails with the Bull v4 mobile rail contract: horizontal cards, 38% mobile width, 100px minimum height, and compact KPI typography.
- Changed files: `apps/web/src/features/quant/home/styles.ts`, `.agents/current/active-status.md`.

- Intent: reorder the mobile quant home around the approved beginner flow.
- Outcome: mobile home now shows today's stock section, ad, candidate list, quant explanation, then news; favorite folders remain desktop-only.
- Changed files: `apps/web/src/features/quant/home/QuantHomePage.tsx`, `apps/web/src/features/quant/home/QuantUtilityRail.tsx`, `apps/web/src/features/quant/home/QuantDecisionSection.tsx`, `apps/web/src/features/quant/home/styles.ts`, `.agents/current/active-status.md`.

- Intent: reshape the quant home top area around market summary and hot-stock discovery.
- Outcome: replaced the Bull v4-specific hero with market summary cards, hot-stock cards, then ad, today recommended candidates, and news; removed mobile/desktop favorite-folder and quant-explainer blocks from the home flow.
- Changed files: `apps/web/src/features/quant/api.ts`, `apps/web/src/features/quant/quantTypes.ts`, `apps/web/src/features/quant/types.ts`, `apps/web/src/features/quant/home/QuantHeroSection.tsx`, `apps/web/src/features/quant/home/QuantHomePage.tsx`, `apps/web/src/features/quant/home/QuantDecisionSection.tsx`, `apps/web/src/features/quant/home/styles.ts`, `.agents/current/active-status.md`.

- Intent: make page-level headers match the compact Bull v4 model header pattern.
- Outcome: added a shared compact `PageHeaderCard` and replaced oversized title/description header cards across market, quant, reports, services, admin, stock/index detail, lotto/tarot, memo, investor, net-buying, and my pages.
- Changed files: `apps/web/src/components/ui/Page.tsx`, `apps/web/src/pages/*`, `.agents/current/active-status.md`.

- Intent: move the home ad beside the top market summary on desktop.
- Outcome: changed the home top area to a desktop two-column grid with market summary/hot stocks on the left and the ad slot on the right at the same width as the news rail; mobile still stacks the ad below the summary.
- Changed files: `apps/web/src/features/quant/home/QuantHomePage.tsx`, `apps/web/src/features/quant/home/styles.ts`, `.agents/current/active-status.md`.

- Intent: split home ad inventory into desktop and mobile-specific slots.
- Outcome: added `desktop_side_top` and `mobile_inline_top` ad slots so desktop renders a tall right-rail ad beside the summary while mobile renders a separate shorter inline banner below the summary.
- Changed files: `apps/web/src/features/quant/home/QuantHomePage.tsx`, `apps/web/src/features/quant/home/QuantUtilityRail.tsx`, `apps/web/src/features/quant/home/styles.ts`, `.agents/current/active-status.md`.

- Intent: make the web app dark mode by default.
- Outcome: changed styled-components theme and legacy CSS variables to a dark palette, set `color-scheme: dark`, and replaced remaining light badge/ad/header hard-coded backgrounds with theme colors.
- Changed files: `apps/web/src/app/theme.ts`, `apps/web/src/app/GlobalStyle.ts`, `apps/web/src/index.css`, `apps/web/src/components/ui/Page.tsx`, `apps/web/src/features/quant/home/styles.ts`, `apps/web/src/layout/Header.tsx`, `.agents/current/active-status.md`.

- Intent: align the default dark palette with the Codex theme reference.
- Outcome: updated the app dark palette to use `#111111` background, `#FCFCFC` foreground, `#0169CC` accent, and matching neutral panel/border steps.
- Changed files: `apps/web/src/app/theme.ts`, `apps/web/src/index.css`, `.agents/current/active-status.md`.

- Intent: remove the forced circular crop from the header logo.
- Outcome: removed `border-radius` from the header logo image and changed it to `object-fit: contain` so the source logo renders without the added white ring/crop.
- Changed files: `apps/web/src/layout/Header.tsx`, `.agents/current/active-status.md`.

- Intent: replace the web logo and favicon with the new transparent-background asset.
- Outcome: copied `D:\market-pulse\logo(no_background).png` to `apps/web/public/logo.png`; header logo, favicon, and apple touch icon continue to resolve through `/logo.png`.
- Changed files: `apps/web/public/logo.png`, `.agents/current/active-status.md`.

- Intent: codify the user-approved quant runtime handoff location.
- Outcome: added a strict `AGENTS.md` contract for `.agents/handoff/quant/<MODEL_CODE>/` packages, including folder shape, production execution limits, runtime implementation path, worker/container rule, exposure gates, and migration requirement.
- Changed files: `AGENTS.md`, `CLAUDE.md`, `.agents/current/active-status.md`.
