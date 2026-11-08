"""
Stress, invariance, and boundary condition tests.
"""
import pytest
from app.dose_response import compute_personal_dose
from app.sources.stations import calculate_indian_aqi
from app.sources.traffic import get_current_traffic_hotspots

def test_zero_duration_and_clean_air_invariance():
    # 0 duration should yield 0 inhaled mass and 0 exposure score
    dose_zero = compute_personal_dose(150.0, duration_minutes=0)
    assert dose_zero.inhaled_mass_micrograms == 0.0
    assert dose_zero.exposure_score == 0

    # 0 ambient PM2.5 should yield 0 exposure score
    dose_clean = compute_personal_dose(0.0, duration_minutes=60)
    assert dose_clean.exposure_score == 0

def test_extreme_concentrations_saturation():
    # Even at extreme catastrophic hazard (5000 ug/m3 PM2.5), score must strictly saturate <= 100
    dose_extreme = compute_personal_dose(5000.0, activity="running", duration_minutes=120, vulnerability_group="respiratory")
    assert dose_extreme.exposure_score == 100
    assert dose_extreme.risk_tier == "Hazardous"

def test_traffic_hotspot_boundedness():
    hotspots = get_current_traffic_hotspots()
    for h in hotspots:
        assert 0.0 <= h.congestion_ratio <= 1.0
        assert 0.0 < h.current_speed_kmh <= h.free_flow_speed_kmh

def test_aqi_monotonicity():
    # As PM2.5 increases, AQI must never decrease
    prev_aqi = 0
    for pm in [10, 25, 45, 60, 85, 110, 150, 220, 300, 450]:
        curr_aqi = calculate_indian_aqi(pm, pm * 1.5)
        assert curr_aqi >= prev_aqi
        prev_aqi = curr_aqi
