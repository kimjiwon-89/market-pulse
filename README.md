# Market Pulse Prod

Production service repository for Market Pulse.

This repo owns the user-facing website, backend API, workers, production DB schema, migrations, CI/CD, security, and accepted model versions.

## Role

`market-pulse-prod` owns:

- production website
- production API
- background workers
- auth/account/security
- production DB migrations
- staging and production release flow
- accepted quant/lottery/tarot model versions
- operations and incident response

It does not own:

- raw research experiments
- unvalidated model notebooks/scripts
- lab-only backtest scratch files
- production-unapproved migration drafts

Those belong in `market-pulse-lab`.

## Target Layout

```text
market-pulse-prod/
  README.md
  AGENTS.md
  CLAUDE.md
  VERSION
  docs/
    architecture/
    operations/
    runbooks/
    domain-contracts/
  apps/
    api/
    web/
    workers/
  domains/
    auth/
    market-data/
    investor-flow/
    quant-serving/
    lottery-serving/
    tarot-serving/
  db/
    migrations/
    seeds/
    views/
    archive/
  infra/
  scripts/
  tests/
```

## Planned Feature Surface

Canonical production feature scope:

- `docs/architecture/feature-scope.md`

Production owns:

- quant model serving
- market data API for index, full stock universe, price/chart data, snapshots, and rankings
- foreign/institution/individual investor net buy-sell flows
- lotto and pension lottery serving
- tarot serving
- signup, login, account, role, session, and audit behavior

Lab owns research and promotion proposals for models/data contracts. Prod owns accepted serving behavior.

## Branch And Release

```text
feature/* -> develop
fix/*     -> develop
develop   -> staging
release PR: develop -> main
main tag  -> production release
```

Use SemVer:

```text
MAJOR.MINOR.PATCH
```

Examples:

```text
1.0.0
1.1.0
1.1.1
2.0.0
```

## DB Ownership

Prod is source of truth for DB schema.

Canonical DB redesign direction:

- `docs/architecture/database-redesign.md`

Lab can propose:

- data contract
- migration request
- validation report
- model candidate package

Prod decides, implements, tests, stages, and releases accepted changes.

Every migration must include:

- table/grain
- PK/FK
- unique constraints
- indexes
- rollback expectation
- validation query

## Safety

Production deploy and production infra mutation require explicit current-message approval.

No agent may deploy, push production image, change EC2 `/app`, change prod compose, trigger prod workflow, or run production migration without that approval.

Deploy details:

- `docs/operations/deploy.md`

## Artifact Policy

```text
.agents/
  current/
  logs/
  archive/

report/
  <domain>/
    <topic>/
      latest.html
      source.md
      archive/
```

- `.agents` is for AI working memory.
- `report` is for user-facing final reports.
- Keep one current plan/status/report source.
- If a new document replaces current, archive the old one immediately.

## Local Data

Initial strategy:

- production RDS remains source/original data store
- local dev DB restores required dump slices
- no extra RDS until pain justifies dev-lab or staging DB

Sensitive user data must be masked or excluded before local/lab restore.
