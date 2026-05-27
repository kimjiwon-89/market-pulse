"""Unit tests for market_regime_model — no DB, no pandas required."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from market_regime_model import (
    classify_regime,
    compute_snapshot,
    compute_bull_score,
    compute_bear_score,
    compute_stress_score,
    features_from_index_levels,
    BULL_SCORE_MIN,
    BEAR_SCORE_MIN,
)


# ── Fixture helpers ───────────────────────────────────────────────────────────

def _bull():
    return {
        "kospi_above_ma20":  True,
        "kosdaq_above_ma20": True,
        "kospi_above_ma60":  True,
        "kosdaq_above_ma60": True,
        "kospi_ma20_slope":  0.012,
        "kosdaq_ma20_slope": 0.008,
        "breadth_ma20":      0.65,
        "breadth_ma60":      0.58,
        "advance_ratio_5d":  0.62,
        "volatility_20":     0.014,
        "liquidity_trend":   0.08,
    }


def _sideways():
    return {
        "kospi_above_ma20":  True,
        "kosdaq_above_ma20": False,
        "kospi_above_ma60":  True,
        "kosdaq_above_ma60": False,
        "kospi_ma20_slope":  0.003,
        "kosdaq_ma20_slope": -0.002,
        "breadth_ma20":      0.47,
        "breadth_ma60":      0.41,
        "advance_ratio_5d":  0.49,
        "volatility_20":     0.021,
        "liquidity_trend":   0.02,
    }


def _bear():
    return {
        "kospi_above_ma20":  False,
        "kosdaq_above_ma20": False,
        "kospi_above_ma60":  False,
        "kosdaq_above_ma60": False,
        "kospi_ma20_slope":  -0.012,
        "kosdaq_ma20_slope": -0.015,
        "breadth_ma20":      0.30,
        "breadth_ma60":      0.24,
        "advance_ratio_5d":  0.33,
        "volatility_20":     0.036,
        "liquidity_trend":   -0.12,
    }


def _crash():
    return {
        "kospi_above_ma20":  False,
        "kosdaq_above_ma20": False,
        "kospi_above_ma60":  False,
        "kosdaq_above_ma60": False,
        "kospi_ma20_slope":  -0.035,
        "kosdaq_ma20_slope": -0.040,
        "breadth_ma20":      0.14,
        "breadth_ma60":      0.09,
        "advance_ratio_5d":  0.18,
        "volatility_20":     0.058,
        "liquidity_trend":   -0.35,
    }


# ── Classification tests ──────────────────────────────────────────────────────

def test_bull_classified_as_bull():
    assert classify_regime(_bull()) == "BULL"


def test_bear_classified_as_bear():
    assert classify_regime(_bear()) == "BEAR"


def test_crash_classified_as_crash():
    assert classify_regime(_crash()) == "CRASH"


def test_sideways_classified_as_sideways():
    assert classify_regime(_sideways()) == "SIDEWAYS"


def test_crash_overrides_partial_bear():
    f = _bear()
    f["breadth_ma20"] = 0.15
    f["volatility_20"] = 0.045
    assert classify_regime(f) == "CRASH"


def test_crash_requires_low_breadth_AND_high_vol():
    f = _crash()
    f["volatility_20"] = 0.020  # low vol → crash condition not met
    result = classify_regime(f)
    assert result in ("BEAR", "SIDEWAYS")  # not CRASH


def test_bull_score_at_threshold():
    f = _bull()
    score = compute_bull_score(f)
    assert score >= BULL_SCORE_MIN


def test_bear_score_at_threshold():
    f = _bear()
    score = compute_bear_score(f)
    assert score >= BEAR_SCORE_MIN


# ── Snapshot output tests ─────────────────────────────────────────────────────

def test_snapshot_bull_policy():
    snap = compute_snapshot(_bull(), trade_date="2024-01-15")
    assert snap.regime           == "BULL"
    assert snap.allowed_strategy == "W4_BREAKOUT"
    assert snap.risk_budget      == 1.00
    assert snap.confidence       >= 0.50


def test_snapshot_sideways_policy():
    snap = compute_snapshot(_sideways(), trade_date="2024-01-15")
    assert snap.regime           == "SIDEWAYS"
    assert snap.allowed_strategy == "W4_RESTRICT"
    assert snap.risk_budget      == 0.50


def test_snapshot_bear_policy():
    snap = compute_snapshot(_bear(), trade_date="2024-01-15")
    assert snap.regime           == "BEAR"
    assert snap.allowed_strategy == "W4_RECOVER"
    assert snap.risk_budget      == 0.20


def test_snapshot_crash_policy():
    snap = compute_snapshot(_crash(), trade_date="2024-01-15")
    assert snap.regime           == "CRASH"
    assert snap.allowed_strategy == "CASH"
    assert snap.risk_budget      == 0.00
    assert snap.confidence       == 1.00


def test_snapshot_has_required_fields():
    snap = compute_snapshot(_bull(), trade_date="2024-01-15")
    d = snap.as_dict()
    for key in ["trade_date", "regime", "confidence", "risk_budget",
                "allowed_strategy", "bull_score", "bear_score",
                "stress_score", "breadth_ma20", "breadth_ma60",
                "volatility_20", "liquidity_trend"]:
        assert key in d, f"missing field: {key}"


# ── Realtime helper test ──────────────────────────────────────────────────────

def test_features_from_index_levels_bull():
    f = features_from_index_levels(
        kospi_close=2500, kospi_ma20=2450, kospi_ma60=2380,
        kospi_ma20_slope_5d=0.008, kospi_vol20=0.015,
        kosdaq_close=800,  kosdaq_ma20=775,  kosdaq_ma60=740,
        kosdaq_ma20_slope_5d=0.006, kosdaq_vol20=0.018,
        breadth_ma20=0.62, breadth_ma60=0.55,
        advance_ratio_5d=0.58, liquidity_trend=0.06,
    )
    assert f["kospi_above_ma20"]  is True
    assert f["kosdaq_above_ma60"] is True
    assert f["volatility_20"]     == max(0.015, 0.018)
    assert classify_regime(f)     == "BULL"


def test_features_from_index_levels_bear():
    f = features_from_index_levels(
        kospi_close=2100, kospi_ma20=2300, kospi_ma60=2400,
        kospi_ma20_slope_5d=-0.015, kospi_vol20=0.032,
        kosdaq_close=650,  kosdaq_ma20=750,  kosdaq_ma60=800,
        kosdaq_ma20_slope_5d=-0.018, kosdaq_vol20=0.038,
        breadth_ma20=0.28, breadth_ma60=0.22,
        advance_ratio_5d=0.31, liquidity_trend=-0.08,
    )
    assert f["kospi_above_ma20"]  is False
    assert f["kosdaq_above_ma60"] is False
    assert classify_regime(f)     == "BEAR"


# ── Runner ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    tests = [
        test_bull_classified_as_bull,
        test_bear_classified_as_bear,
        test_crash_classified_as_crash,
        test_sideways_classified_as_sideways,
        test_crash_overrides_partial_bear,
        test_crash_requires_low_breadth_AND_high_vol,
        test_bull_score_at_threshold,
        test_bear_score_at_threshold,
        test_snapshot_bull_policy,
        test_snapshot_sideways_policy,
        test_snapshot_bear_policy,
        test_snapshot_crash_policy,
        test_snapshot_has_required_fields,
        test_features_from_index_levels_bull,
        test_features_from_index_levels_bear,
    ]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"  PASS  {t.__name__}")
        except AssertionError as e:
            print(f"  FAIL  {t.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR {t.__name__}: {e}")
            failed += 1
    total = len(tests)
    print(f"\n{total - failed}/{total} passed")
    raise SystemExit(failed)
