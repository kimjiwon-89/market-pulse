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
