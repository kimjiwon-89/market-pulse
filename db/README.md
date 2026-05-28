# Prod DB

Production database schema and migrations.

Folders:

```text
migrations/
seeds/
views/
archive/
```

Rules:

- migrations are source of truth
- use PostgreSQL identity columns for entity IDs unless natural/composite keys fit better
- time-series tables should define grain and unique constraints
- indexes must follow query patterns
- validation query required for each migration
