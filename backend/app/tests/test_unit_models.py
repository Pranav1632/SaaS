"""
Unit tests for core physiological and AQI calculations.
"""
import pytest
from app.sources.stations import calculate_indian_aqi
from app.dose_response import compute_personal_dose

def test_indian_aqi_breakpoints():
    # Good range (PM2.5 <= 30)
    assert calculate_indian_aqi(15.0, 25.0) == 25
    # Moderate range (PM2.5: 61-90)
    assert 100 <= calculate_indian_aqi(75.0, 140.0) <= 200
    # Severe range (PM2.5: 121-250)
    assert 300 <= calculate_indian_aqi(180.0, 320.0) <= 400

def test_minute_ventilation_scaling():
    # Identical PM2.5 (100 ug/m3) and duration (30 min)
    dose_rest = compute_personal_dose(100.0, activity="resting", duration_minutes=30)
    dose_walk = compute_personal_dose(100.0, activity="walking", duration_minutes=30)
    dose_run = compute_personal_dose(100.0, activity="running", duration_minutes=30)

    # Inhaled mass should scale strictly with ventilation (6 L/min vs 15 L/min vs 45 L/min)
    assert dose_rest.inhaled_mass_micrograms < dose_walk.inhaled_mass_micrograms
    assert dose_walk.inhaled_mass_micrograms < dose_run.inhaled_mass_micrograms
    assert round(dose_run.inhaled_mass_micrograms / dose_rest.inhaled_mass_micrograms, 1) == 7.5

def test_n95_mask_protection():
    unmasked = compute_personal_dose(150.0, activity="cycling", duration_minutes=40, mask="none")
    masked_n95 = compute_personal_dose(150.0, activity="cycling", duration_minutes=40, mask="n95")

    # N95 filters 95% of particulates
    assert masked_n95.effective_pm25 < unmasked.effective_pm25
    assert masked_n95.inhaled_mass_micrograms < unmasked.inhaled_mass_micrograms * 0.10
    assert masked_n95.exposure_score < unmasked.exposure_score

def test_vulnerability_scaling():
    general = compute_personal_dose(120.0, activity="walking", duration_minutes=30, vulnerability_group="general")
    asthma = compute_personal_dose(120.0, activity="walking", duration_minutes=30, vulnerability_group="respiratory")
    child = compute_personal_dose(120.0, activity="walking", duration_minutes=30, vulnerability_group="child")

    # Same inhaled mass, but higher biological vulnerability should produce higher risk score
    assert asthma.exposure_score > general.exposure_score
    assert child.exposure_score > general.exposure_score

def test_cigarette_equivalence_calculation():
    # ~330 ug inhaled PM2.5 = 1 cigarette
    # 220 ug/m3 * (15 L/min / 1000) * 100 min = 330 ug
    dose = compute_personal_dose(220.0, activity="walking", duration_minutes=100)
    assert 0.95 <= dose.cigarette_equivalence <= 1.05
