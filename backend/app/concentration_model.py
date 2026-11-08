"""
Stage 1: Two-Stage Source-Aware Concentration Model for Pune / PCCOE.
C(x, t) = [ C_background(t) + Traffic(x,t) + Industry(x,t) + Construction(x,t) - GreenRemoval(x) ] * DispersionFactor(t) + Residual_IDW(x)
"""
import time
import math
import numpy as np
from pydantic import BaseModel
from typing import Dict, List, Tuple
from .sources.weather import fetch_live_weather, WeatherData
from .sources.stations import fetch_station_readings, StationReading, calculate_indian_aqi
from .feature_grid import pune_spatial_index, haversine_distance_and_bearing
from .source_intensity import (
    compute_dispersion_multiplier,
    compute_traffic_emission,
    compute_industrial_emission,
    compute_construction_emission
)

class ConcentrationResult(BaseModel):
    lat: float
    lon: float
    pm25: float
    pm10: float
    no2: float
    o3: float
    aqi: int
    confidence_pct: int
    nearest_station_km: float
    data_freshness_minutes: int
    dispersion_factor: float
    source_attribution: Dict[str, float]  # in ug/m3
    source_percentages: Dict[str, float]  # in %
    model_version: str = "SaansAI-v2-SourceAware"

async def estimate_concentration_at_point(lat: float, lon: float) -> ConcentrationResult:
    """
    Computes hyperlocal PM2.5, PM10, NO2, and AQI at any specific coordinate.
    """
    weather = await fetch_live_weather()
    stations = await fetch_station_readings()

    # 1. Background baseline from regional average
    bg_pm25 = np.mean([s.pm25 for s in stations]) * 0.70  # Baseline city floor
    bg_pm10 = bg_pm25 * 1.85
    bg_no2 = np.mean([s.no2 for s in stations]) * 0.65
    bg_o3 = np.mean([s.o3 for s in stations])

    # 2. Physics source terms
    traffic_pm = compute_traffic_emission(lat, lon)
    ind_pm = compute_industrial_emission(lat, lon, weather)
    const_pm = compute_construction_emission(lat, lon)
    green_rem = pune_spatial_index.get_green_removal(lat, lon)

    # 3. Weather dispersion and intensity scaling
    disp_mult = compute_dispersion_multiplier(weather)
    # Ambient intensity scale (relative to typical reference 55 ug/m3)
    ambient_scale = max(0.40, min(1.60, bg_pm25 / 55.0))

    # Uncorrected physics estimate
    local_sources = (traffic_pm * 0.45 + ind_pm * 0.40 + const_pm * 0.35 - green_rem) * ambient_scale
    raw_pm25 = max(10.0, (bg_pm25 + local_sources) * disp_mult)

    # 4. Residual Correction via IDW against actual station observations
    # Residual = Station_Actual - Physics_At_Station
    weights_sum = 0.0
    weighted_residual = 0.0
    min_dist_m = 999999.0

    for st in stations:
        d_m, _ = haversine_distance_and_bearing(lat, lon, st.lat, st.lon)
        if d_m < min_dist_m:
            min_dist_m = d_m
        
        # IDW weight (p=2) with epsilon
        w = 1.0 / ((d_m / 1000.0) + 0.1)**2
        # Station residual
        st_res = st.pm25 - bg_pm25
        weighted_residual += w * st_res
        weights_sum += w

    idw_residual = (weighted_residual / weights_sum) if weights_sum > 0 else 0.0
    # Blend: 50% physics model + 50% spatial residual correction
    final_pm25 = round(max(10.0, 0.50 * raw_pm25 + 0.50 * (bg_pm25 + idw_residual)), 1)
    final_pm10 = round(final_pm25 * 1.82, 1)
    final_no2 = round(max(15.0, bg_no2 + traffic_pm * 0.35 + ind_pm * 0.25), 1)

    # Calculate AQI
    aqi = calculate_indian_aqi(final_pm25, final_pm10)

    # Confidence calculation: drops with distance to nearest ground-truth station
    dist_km = round(min_dist_m / 1000.0, 2)
    # 95% confidence within 1km, dropping down to ~72% at 6km
    conf_pct = int(max(60, min(98, round(98 - dist_km * 4.5))))

    # Source breakdown calculation
    total_sources = bg_pm25 + traffic_pm + ind_pm + const_pm
    if total_sources <= 0:
        total_sources = 1.0

    source_attr = {
        "traffic_roads": round(traffic_pm, 1),
        "industrial_plumes": round(ind_pm, 1),
        "construction_dust": round(const_pm, 1),
        "regional_background": round(bg_pm25, 1),
        "green_removal": round(green_rem, 1)
    }

    source_pct = {
        "traffic": round((traffic_pm / total_sources) * 100, 1),
        "industry": round((ind_pm / total_sources) * 100, 1),
        "construction": round((const_pm / total_sources) * 100, 1),
        "background": round((bg_pm25 / total_sources) * 100, 1)
    }

    return ConcentrationResult(
        lat=lat,
        lon=lon,
        pm25=final_pm25,
        pm10=final_pm10,
        no2=final_no2,
        o3=round(bg_o3, 1),
        aqi=aqi,
        confidence_pct=conf_pct,
        nearest_station_km=dist_km,
        data_freshness_minutes=int((time.time() - weather.updated_at) / 60.0),
        dispersion_factor=disp_mult,
        source_attribution=source_attr,
        source_percentages=source_pct
    )
