# W4 V3-FIN Candidate Counts

date: 2026-05-27
range: 2012-01-01~2026-05-20

## Method

- `raw_candidates`: W4 signal candidates before entry confirmation.
- `entry_pass_top10`: candidates in top 10 that pass delay/entry/next-body confirmation.
- Counts are per trading day; portfolio single-slot/open-position lock is not applied.
- This diagnoses whether low trade count comes from rare candidates or portfolio slot constraints.

## Raw Candidates By Period

| period | days | avg | median | max | >=1 | >=2 | >=5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| post | 103 | 11.01 | 9.00 | 36 | 100.0% | 96.1% | 88.3% |
| pre | 2543 | 10.16 | 8.00 | 89 | 96.1% | 92.2% | 73.2% |
| train | 796 | 8.46 | 7.00 | 62 | 97.7% | 92.3% | 69.6% |

## Raw Candidates By Regime

| period | regime | days | avg | median | max | >=1 | >=2 | >=5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| post | BULL | 65 | 13.77 | 11.00 | 36 | 100.0% | 100.0% | 96.9% |
| post | SIDEWAYS | 38 | 6.29 | 6.00 | 15 | 100.0% | 89.5% | 73.7% |
| pre | BEAR | 279 | 11.08 | 10.00 | 42 | 99.6% | 98.2% | 84.2% |
| pre | BULL | 1083 | 12.96 | 11.00 | 89 | 97.0% | 95.4% | 84.3% |
| pre | CRASH | 681 | 5.27 | 4.00 | 32 | 91.8% | 82.7% | 49.2% |
| pre | SIDEWAYS | 500 | 10.25 | 8.00 | 67 | 97.8% | 95.0% | 75.6% |
| train | BEAR | 26 | 8.27 | 7.00 | 24 | 100.0% | 100.0% | 76.9% |
| train | BULL | 370 | 11.08 | 9.00 | 62 | 100.0% | 97.6% | 83.0% |
| train | CRASH | 244 | 4.54 | 4.00 | 17 | 93.0% | 82.0% | 42.6% |
| train | SIDEWAYS | 156 | 8.42 | 8.00 | 31 | 99.4% | 94.9% | 78.8% |

## Entry-Pass Top10 By Period

| period | days | avg | median | max | >=1 | >=2 | >=5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| post | 103 | 0.19 | 0.00 | 2 | 18.4% | 1.0% | 0.0% |
| pre | 2543 | 0.15 | 0.00 | 4 | 13.8% | 1.1% | 0.0% |
| train | 796 | 0.11 | 0.00 | 4 | 9.8% | 0.8% | 0.0% |

## Entry-Pass Top10 By Regime

| period | regime | days | avg | median | max | >=1 | >=2 | >=5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| post | BULL | 65 | 0.25 | 0.00 | 2 | 23.1% | 1.5% | 0.0% |
| post | SIDEWAYS | 38 | 0.11 | 0.00 | 1 | 10.5% | 0.0% | 0.0% |
| pre | BEAR | 279 | 0.14 | 0.00 | 2 | 14.0% | 0.4% | 0.0% |
| pre | BULL | 1083 | 0.17 | 0.00 | 2 | 15.6% | 1.3% | 0.0% |
| pre | CRASH | 681 | 0.10 | 0.00 | 2 | 9.3% | 0.6% | 0.0% |
| pre | SIDEWAYS | 500 | 0.19 | 0.00 | 4 | 15.8% | 1.8% | 0.0% |
| train | BEAR | 26 | 0.04 | 0.00 | 1 | 3.8% | 0.0% | 0.0% |
| train | BULL | 370 | 0.12 | 0.00 | 3 | 11.1% | 0.5% | 0.0% |
| train | CRASH | 244 | 0.09 | 0.00 | 2 | 7.4% | 1.2% | 0.0% |
| train | SIDEWAYS | 156 | 0.13 | 0.00 | 4 | 11.5% | 0.6% | 0.0% |

## Entry-Pass Top20 By Period

| period | days | avg | median | max | >=1 | >=2 | >=5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| post | 103 | 0.22 | 0.00 | 2 | 20.4% | 1.9% | 0.0% |
| pre | 2543 | 0.19 | 0.00 | 4 | 16.7% | 2.0% | 0.0% |
| train | 796 | 0.13 | 0.00 | 5 | 11.1% | 1.0% | 0.1% |

## Readout

- If raw candidates are frequent but entry-pass is sparse, entry confirmation is bottleneck.
- If entry-pass has >=1/2 often but trades are few, single-slot `open_until` is bottleneck.
- Next grid should test portfolio slots only after this count profile is reviewed.
- Daily counts: `.Codex/reports/2026-05-27_w4-v3fin-candidate-counts.csv`
