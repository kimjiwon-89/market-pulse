"""CPU throttle for heavy backtest scripts.

Import this before pandas/numpy so BLAS/OpenMP env vars apply early.

Effects:
- Caps BLAS/OpenMP threads to `MP_BACKTEST_CPU_LIMIT` fraction of logical cores.
- Restricts process CPU affinity to the same fraction when `psutil` is available.
- Lowers process priority so the desktop stays usable.

Default:
- `MP_BACKTEST_CPU_LIMIT=0.5`
"""
import os
import sys


def parse_cpu_limit(value=None):
    if value is None:
        value = os.getenv("MP_BACKTEST_CPU_LIMIT", "0.5")
    try:
        limit = float(value)
    except (TypeError, ValueError):
        limit = 0.5
    return max(0.1, min(1.0, limit))


def compute_cpu_cap(cpu_count=None, limit=None):
    count = int(cpu_count or os.cpu_count() or 1)
    fraction = parse_cpu_limit(limit)
    return max(1, int(count * fraction))


CPU_LIMIT = parse_cpu_limit()
CPU_CAP = compute_cpu_cap(limit=CPU_LIMIT)

for _var in (
    "OPENBLAS_NUM_THREADS",
    "OMP_NUM_THREADS",
    "MKL_NUM_THREADS",
    "NUMEXPR_NUM_THREADS",
    "VECLIB_MAXIMUM_THREADS",
):
    os.environ.setdefault(_var, str(CPU_CAP))


def apply_process_limits():
    try:
        import psutil

        proc = psutil.Process()
        if hasattr(proc, "cpu_affinity"):
            cores = list(range(os.cpu_count() or 1))
            proc.cpu_affinity(cores[:CPU_CAP])
        if sys.platform == "win32":
            proc.nice(psutil.BELOW_NORMAL_PRIORITY_CLASS)
        else:
            proc.nice(10)
    except Exception:
        pass


apply_process_limits()
