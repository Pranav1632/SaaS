"""
Weather ingestion module fetching live meteorological data from Open-Meteo.
Coordinates: PCCOE / Akurdi / Pune (18.6279 N, 73.7636 E)
"""
import time
import httpx
from pydantic import BaseModel
from typing import Optional

class WeatherData(BaseModel):
    temperature_c: float
    relative_humidity: float
    rain_mm: float
    wind_speed_kmh: float
    wind_direction_deg: float
    boundary_layer_height_m: float
    ventilation_index: float  # wind_speed * BLH
    updated_at: float
    source: str = "open-meteo"
    is_live: bool = True

# Fallback climatology for Pune in case of network / API outage
_FALLBACK_WEATHER = WeatherData(
    temperature_c=27.4,
    relative_humidity=52.0,
    rain_mm=0.0,
    wind_speed_kmh=8.5,
    wind_direction_deg=65.0,  # North-East (from Bhosari towards Akurdi)
    boundary_layer_height_m=850.0,
    ventilation_index=8.5 * 850.0 / 3.6,
    updated_at=time.time(),
    source="climatology_fallback",
    is_live=False
)

_cached_weather: Optional[WeatherData] = None
_last_fetch_ts: float = 0
CACHE_TTL_SECONDS = 900  # 15 minutes cache

async def fetch_live_weather(lat: float = 18.6279, lon: float = 73.7636) -> WeatherData:
    """
    Fetch live weather and boundary layer height from Open-Meteo with caching & fallback.
    """
    global _cached_weather, _last_fetch_ts
    now = time.time()
    
    if _cached_weather and (now - _last_fetch_ts < CACHE_TTL_SECONDS):
        return _cached_weather

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,rain,wind_speed_10m,wind_direction_10m",
        "hourly": "boundary_layer_height",
        "timezone": "auto"
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                hourly = data.get("hourly", {})
                
                # Extract current boundary layer height or default based on time of day
                blh = 800.0
                if "boundary_layer_height" in hourly and hourly["boundary_layer_height"]:
                    # grab the current hour's BLH
                    blh_values = [v for v in hourly["boundary_layer_height"] if v is not None]
                    if blh_values:
                        blh = float(blh_values[0])
                
                ws_kmh = float(current.get("wind_speed_10m", 8.0))
                # Ventilation index = (wind speed in m/s) * BLH (m^2/s)
                vi = (ws_kmh / 3.6) * blh
                
                _cached_weather = WeatherData(
                    temperature_c=float(current.get("temperature_2m", 27.0)),
                    relative_humidity=float(current.get("relative_humidity_2m", 50.0)),
                    rain_mm=float(current.get("rain", 0.0)),
                    wind_speed_kmh=ws_kmh,
                    wind_direction_deg=float(current.get("wind_direction_10m", 60.0)),
                    boundary_layer_height_m=blh,
                    ventilation_index=round(vi, 1),
                    updated_at=now,
                    source="open-meteo",
                    is_live=True
                )
                _last_fetch_ts = now
                return _cached_weather
    except Exception as e:
        print(f"[Weather Ingestion] Live fetch failed ({e}), using fallback.")
    
    # Return fallback if call fails
    fb = _FALLBACK_WEATHER.model_copy()
    fb.updated_at = now
    _cached_weather = fb
    return fb
