# Prod Workers

Production background jobs and batch processes.

Responsibilities:

- data ingestion workers
- model signal generation for accepted models
- scheduled maintenance jobs
- cache/build jobs

No production job should run without scoped intent, data range, and output expectation.
