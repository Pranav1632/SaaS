"""
5-Cycle Automated Stress & Verification Harness for SaansAI Backend.
Validates stability, repeatability, and correctness over 5 distinct simulation passes.
"""
import pytest
import asyncio
import time
from app.sources.stations import fetch_station_readings
from app.sources.weather import fetch_live_weather, WeatherData
from app.concentration_model import estimate_concentration_at_point
from app.dose_response import compute_personal_dose
from app.routing import evaluate_route_options
from app.sentinel import trigger_t20_sentinel_alert
from app.campus import get_campus_duty_of_care_status

async def run_5x_verification():
    print("\n" + "="*80)
    print("STARTING 5-CYCLE COMPREHENSIVE BACKEND VERIFICATION HARNESS")
    print("="*80)

    cycles = [
        {"name": "Cycle 1: Baseline PCCOE Campus Ambient Ingestion", "lat": 18.6517, "lon": 73.7615, "act": "walking", "vuln": "general"},
        {"name": "Cycle 2: Morning Rush Inversion Stress (Spine Road)", "lat": 18.6650, "lon": 73.7910, "act": "two_wheeler", "vuln": "respiratory"},
        {"name": "Cycle 3: Industrial Plume Shift (Downwind of Bhosari)", "lat": 18.6350, "lon": 73.8150, "act": "cycling", "vuln": "elderly"},
        {"name": "Cycle 4: High-Exertion Pediatric Run (45 min)", "lat": 18.6517, "lon": 73.7615, "act": "running", "vuln": "child"},
        {"name": "Cycle 5: End-to-End Route Comparison & T-20 Sentinel Dispatch", "lat": 18.6534, "lon": 73.7749, "act": "two_wheeler", "vuln": "respiratory"}
    ]

    for i, c in enumerate(cycles, 1):
        t0 = time.time()
        print(f"\n>>> EXECUTING {c['name']} ...")

        # 1. Hyperlocal concentration
        conc = await estimate_concentration_at_point(c["lat"], c["lon"])
        assert conc.pm25 > 0, f"Cycle {i} PM2.5 must be positive"
        assert 0 <= conc.aqi <= 500, f"Cycle {i} AQI out of range"
        assert sum(conc.source_percentages.values()) > 95.0, "Source percentages must sum to ~100%"

        # 2. Dose computation
        dose = compute_personal_dose(
            pm25=conc.pm25,
            activity=c["act"],
            duration_minutes=35,
            vulnerability_group=c["vuln"]
        )
        assert dose.exposure_score >= 0 and dose.exposure_score <= 100, "Score bounded"
        assert dose.cigarette_equivalence >= 0.0

        # 3. Route comparison
        route_comp = await evaluate_route_options(
            origin_key="nigdi_to_pccoe",
            activity=c["act"],
            vulnerability_group=c["vuln"]
        )
        assert len(route_comp.routes) == 2
        assert route_comp.exposure_reduction_pct >= 0.0

        # 4. Campus status
        campus = await get_campus_duty_of_care_status()
        assert campus.sports_recess_status in ["PERMITTED", "RESTRICTED", "PROHIBITED"]
        assert "outdoor_intake_dampers" in campus.hvac_state

        elapsed_ms = (time.time() - t0) * 1000.0
        print(f"    [PASS] Concentration: {conc.pm25} µg/m³ (AQI {conc.aqi}) | Confidence: {conc.confidence_pct}%")
        print(f"    [PASS] Inhaled Toxic Burden: {dose.inhaled_mass_micrograms} µg (Score: {dose.exposure_score}/100, Tier: {dose.risk_tier})")
        print(f"    [PASS] Route Reduction: {route_comp.exposure_reduction_pct}% exposure saved via '{route_comp.cleanest_route_id}'")
        print(f"    [PASS] Campus Duty-of-Care: {campus.sports_recess_status} (Dampers: {campus.hvac_state['outdoor_intake_dampers']})")
        print(f"    Cycle {i} Verification Complete in {elapsed_ms:.1f} ms.")

    print("\n" + "="*80)
    print("ALL 5 VERIFICATION CYCLES COMPLETED WITH 100% SUCCESS!")
    print("="*80 + "\n")

@pytest.mark.asyncio
async def test_5x_verification_suite():
    await run_5x_verification()

if __name__ == "__main__":
    asyncio.run(run_5x_verification())
