## Next Tasks

date: 2026-05-21
status: PAUSED
plan: `.Codex/plans/2026-05-21_quant-mp-core-frontend-spec.md`

### Goal
Make the MP_CORE quant dashboard understandable for a user with no quant background.

### Pending Implementation
- Add a beginner-friendly top decision layer to `/quant`.
- Replace first-glance quant jargon with plain Korean action states:
  - `지금 매수 가능`
  - `기다리기`
  - `위험 신호 있음`
  - `보유 유지`
  - `비중 줄이기`
  - `매도 검토`
- Add today action cards:
  - what the user should do today
  - why the model says that
  - what would change the decision
  - how risky the current signal is
- Convert candidate list into a decision table:
  - 종목
  - 모델 판단
  - 내가 할 행동
  - 쉬운 이유
  - 위험
  - 예정일
- Add risk meter and simple warning labels for MDD, volatility, blockers, and stale data.
- Move factor score, raw signal, backtest metrics, and diagnostics into an advanced/details area.
- Keep no-profit-guarantee wording clear and visible.

### Suggested Verification
- Non-admin user can understand the main action without opening advanced details.
- Candidate cards/table answer: buy now, wait, hold, trim, or sell.
- Mobile 375px view has no text overflow.
- `npm.cmd run build` passes.
- Re-run workation-verifier after implementation.
