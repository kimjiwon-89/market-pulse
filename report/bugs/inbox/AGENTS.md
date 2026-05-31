# Bug Inbox Rules

This folder stores user-reported bugs that need admin triage and Codex repair work.

Required folder shape for each bug:

```text
report/bugs/inbox/<BUG_ID>/
  source.md
  meta.json
  screenshot.png        # optional, when a screenshot exists
  fix-notes.md
```

`source.md` must include the user-visible problem, expected behavior, actual behavior, and reproduction steps when known.

`meta.json` must include:

- `bugId`
- `reportedAt`
- `url`
- `status`: one of `RECEIVED`, `INVESTIGATING`, `FIXED`, `RELEASE_PENDING`, `CLOSED`
- `priority`: one of `P0`, `P1`, `P2`, `P3`

`fix-notes.md` is updated by the fixing agent with root cause, changed files, verification commands, and remaining risk.
