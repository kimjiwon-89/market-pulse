"""Small tests for backtest CPU throttling helpers."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from throttle import compute_cpu_cap, parse_cpu_limit


def test_parse_cpu_limit_defaults_to_half():
    assert parse_cpu_limit(None) == 0.5


def test_parse_cpu_limit_clamps_range():
    assert parse_cpu_limit("-1") == 0.1
    assert parse_cpu_limit("2") == 1.0


def test_compute_cpu_cap_uses_half_by_default():
    assert compute_cpu_cap(cpu_count=8, limit=0.5) == 4


def test_compute_cpu_cap_keeps_one_core_minimum():
    assert compute_cpu_cap(cpu_count=1, limit=0.5) == 1


if __name__ == "__main__":
    tests = [
        test_parse_cpu_limit_defaults_to_half,
        test_parse_cpu_limit_clamps_range,
        test_compute_cpu_cap_uses_half_by_default,
        test_compute_cpu_cap_keeps_one_core_minimum,
    ]
    failed = 0
    for test in tests:
        try:
            test()
            print(f"  PASS  {test.__name__}")
        except Exception as exc:
            print(f"  FAIL  {test.__name__}: {exc}")
            failed += 1
    print(f"\n{len(tests) - failed}/{len(tests)} passed")
    raise SystemExit(failed)
