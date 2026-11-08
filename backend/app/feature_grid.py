"""
Precomputed Spatial Feature Grid for Pune / PCCOE Region.
Uses SciPy cKDTree for instant, sub-millisecond distance & bearing queries.
"""
import math
import numpy as np
from scipy.spatial import cKDTree
from typing import List, Tuple, Dict

# Known Point & Area Sources in PCMC / Pune
KNOWN_FACTORIES = [
    {"name": "Bhosari MIDC Heavy Fabrication & Casting", "lat": 18.6250, "lon": 73.8480, "base_intensity": 65.0, "decay_m": 2500.0},
    {"name": "Pimpri Auto Cluster & Foundry", "lat": 18.6380, "lon": 73.8010, "base_intensity": 45.0, "decay_m": 1500.0},
    {"name": "Chikhali Industrial Zone", "lat": 18.6780, "lon": 73.8210, "base_intensity": 50.0, "decay_m": 1800.0}
]

KNOWN_GREEN_ZONES = [
    {"name": "Durga Devi Tekdi Park (Nigdi)", "lat": 18.6590, "lon": 73.7710, "removal_factor": 18.0, "radius_m": 1200.0},
    {"name": "Appu Ghar & Indira Gandhi Udyan", "lat": 18.6540, "lon": 73.7680, "removal_factor": 12.0, "radius_m": 600.0},
    {"name": "PCCOE Sports Ground & Green Canopy", "lat": 18.6515, "lon": 73.7620, "removal_factor": 8.0, "radius_m": 350.0}
]

def haversine_distance_and_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> Tuple[float, float]:
    """
    Returns distance in meters and initial bearing in degrees (0 = North, 90 = East, etc.)
    """
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance_m = R * c

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    bearing_deg = (math.degrees(math.atan2(y, x)) + 360.0) % 360.0

    return distance_m, bearing_deg

class PuneSpatialIndex:
    def __init__(self):
        # Factory coordinates
        self.factory_coords = np.array([[f["lat"], f["lon"]] for f in KNOWN_FACTORIES])
        self.factory_tree = cKDTree(self.factory_coords)
        self.factory_meta = KNOWN_FACTORIES

    def query_nearest_factory(self, lat: float, lon: float) -> Dict:
        dist_deg, idx = self.factory_tree.query([lat, lon])
        target = self.factory_meta[idx]
        dist_m, bearing_deg = haversine_distance_and_bearing(lat, lon, target["lat"], target["lon"])
        return {
            "factory": target,
            "distance_m": dist_m,
            "bearing_deg": bearing_deg
        }

    def get_green_removal(self, lat: float, lon: float) -> float:
        """
        Calculates vegetation / green-removal deduction in ug/m3 based on proximity to parks
        """
        removal = 0.0
        for gz in KNOWN_GREEN_ZONES:
            d_m, _ = haversine_distance_and_bearing(lat, lon, gz["lat"], gz["lon"])
            if d_m < gz["radius_m"]:
                removal += gz["removal_factor"] * (1.0 - (d_m / gz["radius_m"]))
        return min(removal, 22.0)  # Max 22 ug/m3 removal

# Singleton instance
pune_spatial_index = PuneSpatialIndex()
