## Next Tasks

date: 2026-05-26
status: W4_ENTRY_CONFIRMATION_NEEDS_SENSITIVITY_TEST

### Current Result

- Target: average monthly return >= 15%.
- Latest best train candidate exceeded target.
- Rule family: filtered W4 + range cap + entry-date candle confirmation.
- Result:
  - pre: avg monthly 6.21%, total 105.49%, worst month -26.64%, 17 trades, win rate 52.9%.
  - train: avg monthly 38.51%, total 500.62%, worst month -15.68%, 13 trades, win rate 76.9%.
  - post: avg monthly 28.19%, total 56.38%, worst month 25.75%, 2 trades, win rate 100.0%.
- Verdict: train target passed, pre positive, post positive but under-sampled. Not final yet.

### Latest Rule

- Base candidate: W4 filtered winner pattern.
- Risk filter: `range20 <= 0.55`.
- Exit:
  - stop 25%.
  - early fail 12%.
  - trail starts after 30%.
  - trail 30%.
  - max hold 50 trading days.
  - monthly loss stop -15%.
- Entry confirmation:
  - signal-to-entry close drawdown must be >= -8%.
  - entry candle location must be >= 0.55.
  - entry upper shadow must be <= 0.12.
  - entry body return must be >= -3%.
  - if top candidate fails confirmation, try next candidates up to top 10.

### Next Work

- Test entry delay sensitivity: 1, 3, 5, and 10 trading days.
- Test top fallback sensitivity: top1 only vs top3 vs top5 vs top10.
- Check whether post sample can increase without killing train/pre.
- Reduce pre worst month from -26.64% with a simple market crash blocker.
- Only after sensitivity passes, convert rule into mapper/service code.

### Artifacts

- Main report: `.Codex/reports/2026-05-26_candle-winner-full-chart-analysis.md`
- Latest trade CSV: `.Codex/reports/2026-05-26_w4-entry-raw-confirm-trades.csv`
- Work log: `.Codex/.logs/2026-05-26-log.md`
