# Quant Package Drop Folder Rules

This folder is the production package intake surface for accepted quant model handoff packages.

Required package shape:

```text
domains/quant-serving/packages/<MODEL_CODE>/
  manifest.json
  artifacts/
  validation.md
  runtime-requirements.md
```

`manifest.json` is required and must include:

- `modelCode`: uppercase public model code, max 50 chars.
- `modelName`: Korean or product-facing model name.
- `modelVersion`: SemVer-compatible package version.
- `category`: one of `상승장`, `횡보장`, `하락장`, `기타`.
- `description`: one sentence shown to admins.
- `seedMoney`: paper-money seed as a number.
- `expectedMonthlyReturnPct`: validation target or observed monthly return as a number.

Dropping a package here does not expose it to users. The API scans this folder into `quant_model_package_registry`; an admin must explicitly set `public_visible=true` from `/admin`.

Do not put lab notebooks, raw experiments, secrets, production deploy scripts, or Docker artifacts in this folder.
