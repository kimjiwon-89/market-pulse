# Prod Web Claude Rules

Read `README.md` first, then root `market-pulse-prod/CLAUDE.md`.

- This is production frontend code.
- Keep UX consistent and dense enough for dashboard work.
- Do not create marketing/landing-only pages when user asks for usable app screens.
- API calls must use production API client patterns.
- User-facing reports go under `report/<domain>/<topic>/`, not `.agents`.
- For quant home, today-stock, model overview, and beginner-facing dashboard work, read `.agents/guides/quant-home-design-guide.md` before planning or editing UI.


## Recursive Scope

- These rules apply to this directory and every descendant folder, including the smallest leaf folders, unless a deeper `AGENTS.md` or `CLAUDE.md` adds stricter local rules.
- Deeper local rules may add domain-specific detail, but they must not weaken root safety, artifact, guide-authoring, or HTML-output rules.
- If a descendant folder has no local agent file, inherit the nearest parent `AGENTS.md`/`CLAUDE.md` rules exactly.
- For any HTML report created anywhere under `D:\market-pulse`, use the synchronized `html-output-style.md` contract unless the user explicitly requests a different style in the current task.
## Guide Authoring Rules
- When creating or updating any agent guide, write it as a strict contract, not a loose preference note.
- Specify exact paths, required references, read order, output locations, class/file names, layout numbers, tokens, required checks, and forbidden patterns whenever they apply.
- Do not rely on vague style words like `similar`, `roughly`, `clean`, or `dashboard-like` unless concrete examples and measurable rules are included.
- If a reference file exists, name the exact file path and list what must be copied from it.
- Agents must follow written guides exactly and must not reinterpret or deviate unless the user explicitly asks for a different rule in the current task.
- If the user asks to make a new preference permanent, update the relevant guide and all affected agent entrypoints in the same task.
## HTML Output Guide
- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating or editing any HTML report, read `D:\market-pulse\.agents\guides\html-output-style.md` and follow it as a strict contract.
- Use `D:\market-pulse\report\rebuild\master-plan\archive\project-overview.html` as the required visual/structural reference.
- Required default format: fixed 220px sidebar, `main.main` document body, section anchors, 1100px content width, compact cards/tables, and project-document navigation.
- Do not use marketing heroes, full dashboard shells, wide KPI-first layouts, gradient/orb decoration, or unrelated custom CSS systems unless the user explicitly asks for a different style.