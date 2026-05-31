# Quant Model Detail Beginner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Bull v4 model detail understandable to first-time users when current candidate data is empty.

**Architecture:** Reuse the existing `QuantModels` route and `getQuantHomeSummary` data. Add static beginner explanation blocks plus dynamic judgment/candidate content.

**Tech Stack:** React, React Router, styled-components primitives, Vitest, Testing Library.

---

### Task 1: Detail Copy And Empty State

**Files:**
- Modify: `apps/web/src/pages/QuantModels/index.tsx`
- Test: `apps/web/src/pages/pageSmoke.test.tsx`

- [ ] Write a failing test that renders `/quant/BULL_V4` and expects beginner-facing judgment copy.
- [ ] Run `npm test -- --run src/pages/pageSmoke.test.tsx` and confirm the test fails because the copy is missing.
- [ ] Update the model detail page to show today's judgment, plain no-candidate explanation, model checks, operating facts, and candidate list.
- [ ] Run the same test and confirm it passes.
- [ ] Run full web tests with `npm test -- --run`.
