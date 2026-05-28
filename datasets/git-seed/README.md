# Git Seed Dataset

This folder contains sanitized development seed data that may be committed with Git LFS.

## Current Seed

- `marketpulse-dev-seed-2026-05-28.sql.gz`
- Source: local `marketpulse` PostgreSQL dump
- Format: gzipped plain SQL
- Restore target: local development database only

## Excluded Table Data

The seed keeps schemas but excludes data for:

- `public.api_token`
- `public.users`
- `public.memo`
- `public.investor_memo`
- `public.lotto_comment`
- `public.lotto_user_combo`

## Restore

```bash
gzip -dc datasets/git-seed/marketpulse-dev-seed-2026-05-28.sql.gz | psql -U postgres -d marketpulse
```

On Windows with Git Bash gzip:

```powershell
& "C:\Program Files\Git\usr\bin\gzip.exe" -dc datasets/git-seed/marketpulse-dev-seed-2026-05-28.sql.gz | psql -U postgres -d marketpulse
```
