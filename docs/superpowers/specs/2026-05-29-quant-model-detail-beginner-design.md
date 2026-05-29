# Quant Model Detail Beginner Design

## Goal

Make `/quant/BULL_V4` useful even when there are no current candidates.

## Approved Direction

Use the `B + A` direction:

- Lead with today's judgment: candidate exists or no candidate.
- Explain no-candidate state in plain Korean.
- Show what the model checks: market regime, trade liquidity, entry confirmation, risk exits.
- Show safe operating facts: version `5.0.1`, seed `100,000,000 KRW`, position cash `10,000,000 KRW`, paper-only replay.

## Scope

- Update the web quant model detail page only.
- Keep existing API contract.
- Do not add production DB, deployment, or infrastructure changes.
- Candidate rows appear only when real live candidates exist.

## Acceptance Checks

- `/quant/BULL_V4` has a clear "today's judgment" card.
- Empty state says no candidate is a deliberate wait state, not a broken page.
- Beginner explanation appears without requiring backend candidate data.
- Page smoke test covers beginner-facing copy.
