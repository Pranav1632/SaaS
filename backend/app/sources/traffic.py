"""
Traffic hotspot and congestion polling module for PCMC / Pune.
Computes congestion ratio: 1 - current_speed / free_flow_speed.
"""
import time
from pydantic import BaseModel
from typing import List

class TrafficHotspot(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    road_class: str  # "highway" | "arterial" | "residential"
    free_flow_speed_kmh: float
    current_speed_kmh: float
    congestion_ratio: float  # 0.0 (empty) to 1.0 (gridlock)
    updated_at: float

PUNE_TRAFFIC_HOTSPOTS = [
    {
        "id": "akurdi_chowk",
        "name": "Akurdi Khandoba Mandir Chowk",
        "lat": 18.6472,
        "lon": 73.7712,
        "road_class": "arterial",
        "free_flow": 45.0,
        "peak_mult": 0.45  # drops to 45% speed during peak
    },
    {
        "id": "spine_road_junction",
        "name": "Spine Road & Triveni Nagar Junc",
        "lat": 18.6650,
        "lon": 73.7910,
        "road_class": "highway",
        "free_flow": 60.0,
        "peak_mult": 0.50
    },
    {
        "id": "nigdi_flyover",
        "name": "Nigdi Pradhikaran Flyover",
        "lat": 18.6578,
        "lon": 73.7661,
        "road_class": "highway",
        "free_flow": 55.0,
        "peak_mult": 0.40
    },
    {
        "id": "chinchwad_station_chowk",
        "name": "Chinchwad Station Chowk",
        "lat": 18.6315,
        "lon": 73.7925,
        "road_class": "arterial",
        "free_flow": 40.0,
        "peak_mult": 0.35
    },
    {
        "id": "hinjewadi_bridge",
        "name": "Bhumkar Chowk (Hinjewadi Entry)",
        "lat": 18.5998,
        "lon": 73.7541,
        "road_class": "highway",
        "free_flow": 50.0,
        "peak_mult": 0.30
    }
]

def get_current_traffic_hotspots() -> List[TrafficHotspot]:
    """
    Returns current traffic speeds and congestion ratios.
    Calculates time-of-day rush hour multiplier (8:30-10:30 AM and 5:30-8:30 PM).
    """
    now = time.time()
    local_time = time.localtime(now)
    hour = local_time.tm_hour + local_time.tm_min / 60.0

    # Rush hour curves in Pune:
    # Morning: 8:00 AM - 10:30 AM
    # Evening: 17:30 - 20:30
    is_morning_rush = 8.0 <= hour <= 10.5
    is_evening_rush = 17.5 <= hour <= 20.5

    hotspots = []
    for h in PUNE_TRAFFIC_HOTSPOTS:
        free = h["free_flow"]
        if is_morning_rush or is_evening_rush:
            curr_speed = free * h["peak_mult"]
        else:
            curr_speed = free * 0.85  # Normal mild slowdown

        congestion = max(0.0, min(1.0, 1.0 - (curr_speed / free)))
        hotspots.append(TrafficHotspot(
            id=h["id"],
            name=h["name"],
            lat=h["lat"],
            lon=h["lon"],
            road_class=h["road_class"],
            free_flow_speed_kmh=round(free, 1),
            current_speed_kmh=round(curr_speed, 1),
            congestion_ratio=round(congestion, 2),
            updated_at=now
        ))

    return hotspots
