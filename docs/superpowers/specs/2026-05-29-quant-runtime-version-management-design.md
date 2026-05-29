# Quant Runtime Version Management Design

## Goal

Make accepted quant models attach to production through a runtime registry, version status, and admin-visible management surface instead of hardcoding every model into one service.

## Scope

This first implementation creates the runtime boundary and admin UI skeleton. It does not execute uploaded files, run Python artifacts, mutate production infrastructure, or automatically activate unverified models.

## Architecture

- `LiveQuantModelRuntime` is the serving contract for one model version.
- `BullV4Runtime` owns the existing Bull v4 replay behavior.
- `LiveQuantRuntimeRegistry` stores available runtimes by `modelCode`, returns visible model summaries, and rejects unknown models.
- `LiveQuantSimulationService` becomes a facade used by `LiveQuantController`; it delegates to the registry so controller endpoints stay stable.
- Service-preparing model slots are represented by non-active runtimes and are not exposed to normal user API responses.

## Version Policy

- User-facing APIs expose only visible, accepted runtimes.
- Admin screens can show future states: `DRAFT`, `VALIDATING`, `VALIDATION_FAILED`, `READY_FOR_APPROVAL`, `ACTIVE`, `PAUSED`, `RETIRED`, `ARCHIVED`.
- A model family should have only one `ACTIVE` version.
- Previous active versions should become `PAUSED` first so rollback remains possible.

## Admin Surface

The first admin UI shows:

- model family/version rows
- current status
- validation/approval stage
- active/rollback affordance copy

No admin action mutates production state in this step.

## Safety

- No file upload executes code.
- No production deployment or production DB mutation.
- Runtime activation will require validation evidence and explicit approval in a later step.

## Testing

- Registry tests verify visible runtime filtering and unknown-model rejection.
- Existing Bull v4 service tests continue to verify candidate, report, watched asset, and replay behavior through the facade.
- Frontend smoke tests verify admin and quant pages still render.
