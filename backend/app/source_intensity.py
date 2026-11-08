"""
Live source intensity computation:
Combines live traffic congestion, industrial plumes with wind alignment,
active construction dust, and atmospheric dispersion factors.
"""
import math
from typing import Dict, List
from .sources.traffic import get_current_traffic_hotspots
from .sources.crowd_reports import get_active_crowd_reports
from .sources.weather import WeatherData
from .feature_grid import pune_spatial_index, haversine_distance_and_bearing, KNOWN_FACTORIES

def compute_dispersion_multiplier(weather: WeatherData) -> float:
    """
    Computes atmospheric dispersion factor:
    Normal ventilation index VI ~ 2000 m^2/s has factor 1.0.
    Inversion / stagnant winter morning (VI < 600) traps pollutants (multiplier up to 1.6x).
    High wind / afternoon convection (VI > 4000) disperses pollutants (multiplier down to 0.65x).
    Rain washes out particulate matter.
    """
    vi = weather.ventilation_index
    # Base trapping curve
    if vi <= 400:
        factor = 1.55
    elif vi <= 1000:
        factor = 1.30
    elif vi <= 2500:
        factor = 1.00
    elif vi <= 5000:
        factor = 0.80
    else:
        factor = 0.65

    # Rain washout deduction
    if weather.rain_mm > 0.5:
        factor *= 0.60
    elif weather.rain_mm > 0.0:
        factor *= 0.85

    return round(factor, 2)

def compute_traffic_emission(lat: float, lon: float) -> float:
    """
    Computes local traffic PM2.5 contribution based on proximity to road hotspots.
    Decay length L = 180m (traffic plumes drop sharply within 200m).
    """
    hotspots = get_current_traffic_hotspots()
    total_traffic_pm = 0.0

    for h in hotspots:
        d_m, _ = haversine_distance_and_bearing(lat, lon, h.lat, h.lon)
        if d_m <= 800.0:
            # Base emission by road class
            base_class_weight = 45.0 if h.road_class == "highway" else 28.0
            # Intensity scaled by live congestion
            intensity = base_class_weight * (0.4 + 0.6 * h.congestion_ratio)
            # Exponential spatial decay
            decay = math.exp(-d_m / 180.0)
            total_traffic_pm += intensity * decay

    return round(min(total_traffic_pm, 75.0), 1)

def compute_industrial_emission(lat: float, lon: float, weather: WeatherData) -> float:
    """
    Computes factory plume contribution:
    Decay length L = 2500m.
    Scaled by wind direction alignment: max(0, cos(wind_dir - bearing_from_factory_to_point)).
    """
    wind_dir = weather.wind_direction_deg
    total_ind_pm = 0.0

    for f in KNOWN_FACTORIES:
        d_m, bearing_to_factory = haversine_distance_and_bearing(lat, lon, f["lat"], f["lon"])
        if d_m <= 6000.0:
            # Bearing from factory to the user's location
            bearing_from_factory = (bearing_to_factory + 180.0) % 360.0
            angle_diff_rad = math.radians(wind_dir - bearing_from_factory)
            # Alignment factor: 1.0 when directly downwind, 0.0 when upwind
            wind_alignment = max(0.0, math.cos(angle_diff_rad))
            
            decay = math.exp(-d_m / f["decay_m"])
            # Plume contribution
            plume = f["base_intensity"] * decay * (0.2 + 0.8 * wind_alignment)
            total_ind_pm += plume

    return round(min(total_ind_pm, 65.0), 1)

def compute_construction_emission(lat: float, lon: float) -> float:
    """
    Computes local dust contribution from crowdsourced & verified construction reports.
    Decay length L = 350m.
    """
    reports = get_active_crowd_reports()
    total_dust_pm = 0.0

    for r in reports:
        d_m, _ = haversine_distance_and_bearing(lat, lon, r.lat, r.lon)
        if d_m <= 1000.0:
            base_intensity = 38.0 if r.report_type == "road_digging" else 25.0
            decay = math.exp(-d_m / 350.0)
            total_dust_pm += base_intensity * decay

    return round(min(total_dust_pm, 45.0), 1)
