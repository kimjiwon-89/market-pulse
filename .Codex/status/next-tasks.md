## Next Tasks

date: 2026-05-21
status: IMPLEMENTED
plan: `.Codex/plans/2026-05-21_quant-mp-core-frontend-spec.md`

### Goal
Make the MP_CORE quant dashboard understandable for a user with no quant background.

### Completed Implementation
- Added a beginner-friendly top decision layer to `/quant`.
- Replaced first-glance quant jargon with plain Korean action states:
  - `지금 매수 가능`
  - `기다리기`
  - `위험 신호 있음`
  - `보유 유지`
  - `비중 줄이기`
  - `매도 검토`
- Added today action cards:
  - what the user should do today
  - why the model says that
  - what would change the decision
  - how risky the current signal is
- Converted candidate list into a decision table:
  - 종목
  - 모델 판단
  - 내가 할 행동
  - 쉬운 이유
  - 위험
  - 예정일
- Added risk meter and simple warning labels for blockers/risk flags plus backtest drawdown wording.
- Moved factor score, raw signal, backtest metrics, and diagnostics into an advanced/details area.
- Kept no-profit-guarantee wording clear and visible.

### Verification
- Non-admin first screen now shows the main action without opening advanced details.
- Candidate cards/table answer: buy now, wait, hold, trim, or sell.
- Mobile 375px view has no text overflow in browser check.
- `npm run build` passed.
- workation-verifier agent was not available in this Codex tool context; local build and browser smoke checks were completed instead.
