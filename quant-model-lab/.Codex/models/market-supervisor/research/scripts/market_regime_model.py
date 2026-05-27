"""
market_regime_model.py

Rule-based market regime classifier.
Designed for both batch historical backtest and realtime snapshot use.

Regime types:
  BULL     - favorable trend, allow breakout/momentum (risk_budget=1.0)
  SIDEWAYS - mixed/range-bound, selective entry     (risk_budget=0.5)
  BEAR     - negative trend, avoid breakout         (risk_budget=0.2)
  CRASH    - high-volatility breakdown, cash only   (risk_budget=0.0)

Realtime usage (e.g. from KIS API snapshot):
  from market_regime_model import features_from_index_levels, compute_snapshot
  f = features_from_index_levels(
      kospi_close=2500, kospi_ma20=2450, kospi_ma60=2400,
      kospi_ma20_slope_5d=0.01, kospi_vol20=0.018,
      kosdaq_close=750, kosdaq_ma20=720, kosdaq_ma60=700,
      kosdaq_ma20_slope_5d=0.005, kosdaq_vol20=0.022,
      breadth_ma20=0.60, breadth_ma60=0.52,
      advance_ratio_5d=0.57, liquidity_trend=0.05,
  )
  snap = compute_snapshot(f, trade_date="2026-05-27")

Input features dict keys:
  kospi_above_ma20     bool
  kosdaq_above_ma20    bool
  kospi_above_ma60     bool
  kosdaq_above_ma60    bool
  kospi_ma20_slope     float  5-day slope of KOSPI MA20 (positive = rising)
  kosdaq_ma20_slope    float
  breadth_ma20         float  fraction of stocks above their MA20 (0-1)
  breadth_ma60         float
  advance_ratio_5d     float  fraction with positive 5d return (0-1)
  volatility_20        float  max(KOSPI_vol20, KOSDAQ_vol20) — annualised daily stddev
  liquidity_trend      float  current total trade amount / 20d avg - 1

Output RegimeSnapshot fields:
  trade_date, regime, confidence, risk_budget, allowed_strategy,
  bull_score, bear_score, stress_score,
  breadth_ma20, breadth_ma60, volatility_20, liquidity_trend
"""
from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Any

# ── Thresholds (all tunable via constants, not scattered magic numbers) ────────
CRASH_BREADTH_MAX = 0.20   # breadth_ma20 at or below this triggers crash check
CRASH_VOL_MIN     = 0.040  # volatility_20 at or above this triggers crash check
BULL_SCORE_MIN    = 7      # bull_score >= this → BULL
BEAR_SCORE_MIN    = 5      # bear_score >= this → BEAR
VOL_NORMAL_MAX    = 0.025  # volatility considered calm for bull scoring
VOL_ELEVATED      = 0.030  # volatility considered elevated for bear scoring
PERSISTENCE_DAYS  = 3      # new regime must hold this many consecutive days before flipping


@dataclass
class RegimeSnapshot:
    trade_date:       Any
    regime:           str    # BULL | SIDEWAYS | BEAR | CRASH
    confidence:       float  # 0.0-1.0
    risk_budget:      float  # 0.0-1.0
    allowed_strategy: str    # W4_BREAKOUT | W4_RESTRICT | W4_RECOVER | CASH
    bull_score:       int
    bear_score:       int
    stress_score:     int
    breadth_ma20:     float
    breadth_ma60:     float
    volatility_20:    float
    liquidity_trend:  float

    def as_dict(self) -> dict:
        return asdict(self)


# ── Score components ──────────────────────────────────────────────────────────

def compute_bull_score(f: dict) -> int:
    return int(sum([
        bool(f.get("kospi_above_ma20")),
        bool(f.get("kosdaq_above_ma20")),
        bool(f.get("kospi_above_ma60")),
        bool(f.get("kosdaq_above_ma60")),
        float(f.get("kospi_ma20_slope", 0))  > 0,
        float(f.get("kosdaq_ma20_slope", 0)) > 0,
        float(f.get("breadth_ma20", 0))      >= 0.55,
        float(f.get("volatility_20", 1.0))   <= VOL_NORMAL_MAX,
        float(f.get("liquidity_trend", 0))   >= 0,
    ]))


def compute_bear_score(f: dict) -> int:
    return int(sum([
        not bool(f.get("kospi_above_ma60")),
        not bool(f.get("kosdaq_above_ma60")),
        float(f.get("kospi_ma20_slope", 0))  < 0,
        float(f.get("kosdaq_ma20_slope", 0)) < 0,
        float(f.get("breadth_ma20", 1.0))    <= 0.35,
        float(f.get("volatility_20", 0))     >= VOL_ELEVATED,
        float(f.get("liquidity_trend", 0))   < 0,
    ]))


def compute_stress_score(f: dict) -> int:
    return int(sum([
        not bool(f.get("kospi_above_ma20")),
        not bool(f.get("kosdaq_above_ma20")),
        float(f.get("breadth_ma20", 1.0))    <= 0.40,
        float(f.get("volatility_20", 0))     >= 0.020,
        float(f.get("advance_ratio_5d", 1.0)) <= 0.40,
    ]))


# ── Classifier ────────────────────────────────────────────────────────────────

def classify_regime(features: dict) -> str:
    breadth  = float(features.get("breadth_ma20", 0.5))
    vol      = float(features.get("volatility_20", 0.0))
    kospi60  = bool(features.get("kospi_above_ma60"))
    kosdaq60 = bool(features.get("kosdaq_above_ma60"))

    # Crash override checked first — no bull/bear score can override it
    if breadth <= CRASH_BREADTH_MAX and vol >= CRASH_VOL_MIN and not kospi60 and not kosdaq60:
        return "CRASH"

    bull = compute_bull_score(features)
    bear = compute_bear_score(features)

    if bull >= BULL_SCORE_MIN:
        return "BULL"
    if bear >= BEAR_SCORE_MIN:
        return "BEAR"
    return "SIDEWAYS"


_REGIME_POLICY: dict[str, tuple[str, float]] = {
    "BULL":     ("W4_BREAKOUT", 1.00),
    "SIDEWAYS": ("W4_RESTRICT", 0.50),
    "BEAR":     ("W4_RECOVER",  0.20),
    "CRASH":    ("CASH",        0.00),
}


def _confidence(regime: str, bull_score: int, bear_score: int) -> float:
    if regime == "CRASH":
        return 1.0
    if regime == "BULL":
        return min(1.0, 0.50 + (bull_score - BULL_SCORE_MIN) * 0.10)
    if regime == "BEAR":
        return min(1.0, 0.50 + (bear_score - BEAR_SCORE_MIN) * 0.10)
    # SIDEWAYS: confidence reflects how far from decisive thresholds
    margin = min(BULL_SCORE_MIN - bull_score, BEAR_SCORE_MIN - bear_score)
    return max(0.30, min(0.70, 0.50 + margin * 0.05))


def compute_snapshot(features: dict, trade_date: Any = None) -> RegimeSnapshot:
    regime = classify_regime(features)
    bull   = compute_bull_score(features)
    bear   = compute_bear_score(features)
    stress = compute_stress_score(features)
    allowed, risk_budget = _REGIME_POLICY[regime]
    conf = _confidence(regime, bull, bear)

    return RegimeSnapshot(
        trade_date       = trade_date,
        regime           = regime,
        confidence       = round(conf, 6),
        risk_budget      = risk_budget,
        allowed_strategy = allowed,
        bull_score       = bull,
        bear_score       = bear,
        stress_score     = stress,
        breadth_ma20     = float(features.get("breadth_ma20",    float("nan"))),
        breadth_ma60     = float(features.get("breadth_ma60",    float("nan"))),
        volatility_20    = float(features.get("volatility_20",   float("nan"))),
        liquidity_trend  = float(features.get("liquidity_trend", float("nan"))),
    )


# ── Persistence filter ───────────────────────────────────────────────────────

def apply_persistence_filter(regimes: list[str], n: int = PERSISTENCE_DAYS) -> list[str]:
    """Smooth a sequence of regime labels: only flip when new label holds >= n days.

    Use for batch historical sequences.
    For realtime single-day use, call classify_regime_persistent() instead.
    """
    if not regimes:
        return []
    stable = [regimes[0]]
    for i in range(1, len(regimes)):
        start = max(0, i - n + 1)
        window = regimes[start : i + 1]
        candidate = regimes[i]
        if window.count(candidate) >= n:
            stable.append(candidate)
        else:
            stable.append(stable[-1])
    return stable


def classify_regime_persistent(features: dict, recent_regimes: list[str]) -> str:
    """Realtime single-day persistence-aware classification.

    Args:
        features:       current-day feature dict
        recent_regimes: list of the last (PERSISTENCE_DAYS-1) regime labels,
                        oldest first (from DB/cache). Pass [] on first run.

    Returns the stable regime after applying persistence logic.
    """
    raw = classify_regime(features)
    history = list(recent_regimes) + [raw]
    stable = apply_persistence_filter(history, n=PERSISTENCE_DAYS)
    return stable[-1]


# ── Per-index classifiers ─────────────────────────────────────────────────────

def _bull_score_single(above_ma20: bool, above_ma60: bool, slope: float,
                       vol: float, breadth_proxy: float, liq: float) -> int:
    return int(sum([
        above_ma20,
        above_ma60,
        slope > 0,
        breadth_proxy >= 0.55,
        vol <= VOL_NORMAL_MAX,
        liq >= 0,
    ]))


def _bear_score_single(above_ma60: bool, slope: float,
                       vol: float, breadth_proxy: float, liq: float) -> int:
    return int(sum([
        not above_ma60,
        slope < 0,
        breadth_proxy <= 0.35,
        vol >= VOL_ELEVATED,
        liq < 0,
    ]))


def _classify_single(above_ma20: bool, above_ma60: bool, slope: float,
                     vol: float, breadth_proxy: float, liq: float) -> str:
    """Classify regime for a single index (KOSPI or KOSDAQ)."""
    if breadth_proxy <= CRASH_BREADTH_MAX and vol >= CRASH_VOL_MIN and not above_ma60:
        return "CRASH"
    bull = _bull_score_single(above_ma20, above_ma60, slope, vol, breadth_proxy, liq)
    bear = _bear_score_single(above_ma60, slope, vol, breadth_proxy, liq)
    # Single-index thresholds are lower (max 6 pts vs combined 9 pts)
    if bull >= 5:
        return "BULL"
    if bear >= 4:
        return "BEAR"
    return "SIDEWAYS"


def classify_regime_kospi(features: dict) -> str:
    return _classify_single(
        above_ma20=bool(features.get("kospi_above_ma20")),
        above_ma60=bool(features.get("kospi_above_ma60")),
        slope=float(features.get("kospi_ma20_slope", 0)),
        vol=float(features.get("kospi_vol20", features.get("volatility_20", 0))),
        breadth_proxy=float(features.get("breadth_ma20", 0.5)),
        liq=float(features.get("liquidity_trend", 0)),
    )


def classify_regime_kosdaq(features: dict) -> str:
    return _classify_single(
        above_ma20=bool(features.get("kosdaq_above_ma20")),
        above_ma60=bool(features.get("kosdaq_above_ma60")),
        slope=float(features.get("kosdaq_ma20_slope", 0)),
        vol=float(features.get("kosdaq_vol20", features.get("volatility_20", 0))),
        breadth_proxy=float(features.get("advance_ratio_5d", 0.5)),
        liq=float(features.get("liquidity_trend", 0)),
    )


# Priority: CRASH > BEAR > SIDEWAYS > BULL (conservative merge)
_REGIME_RANK = {"CRASH": 0, "BEAR": 1, "SIDEWAYS": 2, "BULL": 3}

def classify_regime_combined(kospi_regime: str, kosdaq_regime: str) -> str:
    """Merge KOSPI + KOSDAQ regimes. Both must be BULL to call BULL.
    If they diverge, take the more conservative of the two.
    """
    return min(kospi_regime, kosdaq_regime, key=lambda r: _REGIME_RANK[r])


# ── Realtime helper ───────────────────────────────────────────────────────────

def features_from_index_levels(
    *,
    kospi_close: float,
    kospi_ma20: float,
    kospi_ma60: float,
    kospi_ma20_slope_5d: float,
    kospi_vol20: float,
    kosdaq_close: float,
    kosdaq_ma20: float,
    kosdaq_ma60: float,
    kosdaq_ma20_slope_5d: float,
    kosdaq_vol20: float,
    breadth_ma20: float,
    breadth_ma60: float,
    advance_ratio_5d: float,
    liquidity_trend: float,
) -> dict:
    """Build features dict from raw index levels.

    Designed for realtime use: pass current KIS snapshot values and
    pre-computed rolling indicators (MA20/60, slope, vol20) from DB or cache.
    """
    return {
        "kospi_above_ma20":  kospi_close  > kospi_ma20,
        "kosdaq_above_ma20": kosdaq_close > kosdaq_ma20,
        "kospi_above_ma60":  kospi_close  > kospi_ma60,
        "kosdaq_above_ma60": kosdaq_close > kosdaq_ma60,
        "kospi_ma20_slope":  kospi_ma20_slope_5d,
        "kosdaq_ma20_slope": kosdaq_ma20_slope_5d,
        "breadth_ma20":      breadth_ma20,
        "breadth_ma60":      breadth_ma60,
        "advance_ratio_5d":  advance_ratio_5d,
        "volatility_20":     max(kospi_vol20, kosdaq_vol20),
        "liquidity_trend":   liquidity_trend,
    }
