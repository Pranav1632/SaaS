"""
Tests for Stage 1 spatial geometry, cKDTree indexing, and physics emission plumes.
"""
import pytest
from app.feature_grid import haversine_distance_and_bearing, pune_spatial_index
from app.source_intensity import compute_industrial_emission, compute_dispersion_multiplier
from app.sources.weather import WeatherData

def test_haversine_distance_and_bearing():
    # Distance between PCCOE (18.6517, 73.7615) and Nigdi Pradhikaran (18.6534, 73.7749)
    dist_m, bearing = haversine_distance_and_bearing(18.6517, 73.7615, 18.6534, 73.7749)
    # Approx 1.4 km, heading roughly East-North-East (60-90 deg)
    assert 1200.0 < dist_m < 1600.0
    assert 60.0 <= bearing <= 95.0

def test_ckdtree_nearest_factory():
    # Query from near Bhosari
    res = pune_spatial_index.query_nearest_factory(18.6260, 73.8470)
    assert "Bhosari" in res["factory"]["name"]
    assert res["distance_m"] < 1000.0

def test_green_removal_effect():
    # Exactly inside Durga Devi Tekdi Park vs 5km away
    park_removal = pune_spatial_index.get_green_removal(18.6590, 73.7710)
    distant_removal = pune_spatial_index.get_green_removal(18.6100, 73.8500)
    assert park_removal > 10.0
    assert distant_removal == 0.0

def test_wind_alignment_plume_physics():
    # Factory at Bhosari (East). If user is West of factory (Akurdi),
    # Bearing from factory to user is ~270 deg (West).
    # When wind is blowing from East (wind_dir = 90 deg towards West / 270):
    user_lat, user_lon = 18.6472, 73.7712  # Akurdi

    weather_downwind = WeatherData(
        temperature_c=25.0, relative_humidity=50.0, rain_mm=0.0,
        wind_speed_kmh=12.0, wind_direction_deg=270.0, boundary_layer_height_m=800.0,
        ventilation_index=2000.0, updated_at=0.0, is_live=True
    )
    weather_upwind = WeatherData(
        temperature_c=25.0, relative_humidity=50.0, rain_mm=0.0,
        wind_speed_kmh=12.0, wind_direction_deg=90.0, boundary_layer_height_m=800.0,
        ventilation_index=2000.0, updated_at=0.0, is_live=True
    )

    plume_downwind = compute_industrial_emission(user_lat, user_lon, weather_downwind)
    plume_upwind = compute_industrial_emission(user_lat, user_lon, weather_upwind)

    # Downwind location must experience higher industrial plume than upwind
    assert plume_downwind >= plume_upwind

def test_dispersion_multiplier_inversion_vs_washout():
    inversion_weather = WeatherData(
        temperature_c=18.0, relative_humidity=70.0, rain_mm=0.0,
        wind_speed_kmh=2.0, wind_direction_deg=0.0, boundary_layer_height_m=300.0,
        ventilation_index=166.0, updated_at=0.0, is_live=True
    )
    rain_weather = WeatherData(
        temperature_c=24.0, relative_humidity=95.0, rain_mm=4.5,
        wind_speed_kmh=15.0, wind_direction_deg=0.0, boundary_layer_height_m=1200.0,
        ventilation_index=5000.0, updated_at=0.0, is_live=True
    )

    mult_inversion = compute_dispersion_multiplier(inversion_weather)
    mult_rain = compute_dispersion_multiplier(rain_weather)

    assert mult_inversion > 1.30  # Pollutants trapped
    assert mult_rain < 0.65       # Washout cleans the air
