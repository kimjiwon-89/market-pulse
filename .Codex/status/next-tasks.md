## Next Tasks

date: 2026-05-22
status: PLANNED_AWAITING_USER_APPROVAL

### Active Plan
- Spec: `.Codex/plans/2026-05-22_quant-mp-core-trading-skills-3pct-spec.md`
- HTML: `.Codex/plans/2026-05-22_quant-mp-core-trading-skills-3pct.html`

### Current Result
- Code 1차 done: regime filter, risk-adjusted 252d feature, risk caps/concentration variants.
- Backend compile passed.
- INDEX/STOCK 2020-2025 collection done.
- MP_CORE features generated: 3,581,824 rows.
- Best backtest: monthlyReturn 2.4796%, MDD -25.22%, finalValue 582,593,574.

### Next
- AC-7 failed: need monthlyReturn >= 3%.
- Make MP_CORE variant params configurable instead of hardcoded Java/XML edits.
- Test grid: topN 3/5/8/10, stock cap 20/30/40, sector cap 50/70, RISK_OFF penalty 0.05/0.10/0.15, vol max 0.12/0.15/0.18.
- Investigate weekly rebalance and 20d forward horizon alignment.
- Keep live trading design-only.
