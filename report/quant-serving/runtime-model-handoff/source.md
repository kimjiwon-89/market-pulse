# Quant Model Runtime And Version Management Handoff

## Purpose

This document summarizes the recommended production path for attaching new quant models from lab into Market Pulse production serving.

The goal is not to expose every completed model directly to users. The goal is to let production run accepted model runtimes, track their validation and performance, and expose only approved models to the public website.

## Current Direction

Production quant serving should use this flow:

```text
model runtime registered
-> validation/performance results collected
-> admin reviews metrics
-> approved version becomes ACTIVE
-> ACTIVE model appears on user-facing pages
```

Runtime registration does not mean public exposure.

## Runtime Architecture

The production API is being reshaped around this structure:

```text
LiveQuantController
-> LiveQuantSimulationService facade
-> LiveQuantRuntimeRegistry
-> LiveQuantModelRuntime implementations
   -> BullV4Runtime
   -> future BearV1Runtime
   -> future SidewaysV1Runtime
```

Each production-ready model version should implement the same serving contract.

Expected runtime contract:

```java
public interface LiveQuantModelRuntime {
    String modelCode();
    boolean visible();
    LiveQuantModelSummaryDto summary();
    LiveQuantModelDetailDto detail();
    List<LiveQuantCandidateDto> candidates(String date);
    List<LiveQuantPositionDto> positions();
    List<LiveQuantTradeDto> trades();
    List<LiveQuantExitPlanDto> exitPlans();
    List<WatchedAssetDto> watchedAssets(String date);
    List<OutcomeCheckpointDto> outcomeCheckpoints(Long watchId);
    List<LearningFeedbackDto> learningFeedback();
    List<LiveQuantReportSummaryDto> reports(String period);
    LiveQuantReportDetailDto report(Long reportId);
}
```

## Model Version Lifecycle

Recommended status flow:

```text
DRAFT
-> VALIDATING
-> VALIDATION_FAILED or READY_FOR_APPROVAL
-> ACTIVE
-> PAUSED
-> RETIRED
-> ARCHIVED
```

Meaning:

- `DRAFT`: registered but not validated.
- `VALIDATING`: validation job is running.
- `VALIDATION_FAILED`: validation failed and the model must not be exposed.
- `READY_FOR_APPROVAL`: validation passed, waiting for admin approval.
- `ACTIVE`: user-facing production model.
- `PAUSED`: inactive but rollback-eligible.
- `RETIRED`: no longer used, retained for history.
- `ARCHIVED`: old version retained for audit/history only.

Production rule:

```text
Only ACTIVE + visible + validation-passed runtimes should be exposed to users.
```

## Version And Rollback Policy

Models should be grouped by family.

Example:

```text
family: BULL
  BULL_V4  ACTIVE
  BULL_V5  VALIDATING
  BULL_V3  RETIRED

family: BEAR
  BEAR_V1  READY_FOR_APPROVAL
```

Recommended rules:

- A model family should have only one `ACTIVE` version.
- Previous active versions should become `PAUSED`, not deleted.
- Rollback should only target a `PAUSED` version with known validation history.
- Failed versions should remain as `VALIDATION_FAILED` for traceability.

Rollback example:

```text
BULL_V5 ACTIVE
BULL_V4 PAUSED

Issue found
-> BULL_V5 PAUSED
-> BULL_V4 ACTIVE
```

## Admin Review Metrics

The admin UI should let operators compare runtimes before public exposure.

Minimum metrics:

- cumulative return
- monthly return
- recent 30-day return
- max drawdown
- win rate
- trade count
- candidate count
- warning count
- latest report time
- validation status
- current exposure status

Example admin view:

```text
BULL_V4
status: ACTIVE
cumulative return: +12.4%
MDD: -6.1%
recent 30-day return: +2.3%
validation: passed
public exposure: ON

BULL_V5
status: READY_FOR_APPROVAL
cumulative return: +18.2%
MDD: -9.7%
recent 30-day return: +4.1%
validation: passed
public exposure: OFF
```

## Public Exposure Rules

A model can appear on the user-facing homepage only when all conditions are true:

```text
runtime exists
validation passed
status = ACTIVE
visible = true
admin approval exists
```

Non-active models can continue running in the background for comparison, but they should remain admin-only.

Example:

```text
BULL_V4      ACTIVE              user visible
BULL_V5      VALIDATING          admin only
BEAR_V1      READY_FOR_APPROVAL  admin only
SIDEWAYS_V2  VALIDATION_FAILED   hidden
```

## Lab Handoff Expectations

When lab proposes a model for production, provide:

- model family and model code
- version
- model type
- required input features
- output schema
- candidate selection logic
- validation period
- backtest result
- risk metrics
- known limitations
- runtime requirements
- rollback recommendation

For Java/rule-based models:

```text
Implement as a production LiveQuantModelRuntime.
Submit through normal code review, tests, staging validation, and release.
```

For Python/ML/artifact-based models:

```text
Do not execute arbitrary uploaded files inside the production API.
Run the model through a controlled worker or serving container.
Persist validated outputs to production serving tables.
Let the API read approved outputs.
```

## Production Safety Notes

- File upload must not mean code execution.
- Upload must not mean public exposure.
- Production schema changes require reviewed migrations.
- Runtime activation requires validation evidence and admin approval.
- The API should remain read-oriented for user-facing model outputs.

## Recommended Next Production Steps

1. Add persistent model family/version tables aligned with the production DB redesign.
2. Store validation metrics and activation history.
3. Build admin APIs for listing versions, reviewing metrics, requesting activation, pausing, and rollback.
4. Connect the admin model management UI to real APIs.
5. Add worker flow for artifact-based model validation and result persistence.
